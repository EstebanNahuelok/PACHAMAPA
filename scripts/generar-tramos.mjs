// Divide las rutas en tramos de 5 km para el analisis (una sola vez, a partir del trazado ya generado).
// Uso: node scripts/generar-tramos.mjs
// Escribe backend/src/data/tramos.json (datos de cada tramo) y frontend/src/data/tramos-geo.json (su dibujo).
import { readFileSync, writeFileSync } from 'node:fs';
import { PUNTOS } from '../backend/src/data/puntos.js';

const LARGO_KM = 5;
const raiz = new URL('..', import.meta.url);
const rutas = JSON.parse(readFileSync(new URL('frontend/src/data/rutas.json', raiz), 'utf8'));
const NOMBRES = { rn9: 'RN 9', rn52: 'RN 52' };
const ORIGEN = { rn9: 'de San Salvador de Jujuy', rn52: 'del empalme con la RN 9' };

const RAD = Math.PI / 180;
const distanciaKm = ([lat1, lon1], [lat2, lon2]) =>
  Math.hypot((lon2 - lon1) * RAD * Math.cos(((lat1 + lat2) / 2) * RAD), (lat2 - lat1) * RAD) * 6371;

// Punto de una ruta mas cercano a una coordenada: a que distancia queda y en que kilometro.
function proyectar(ruta, punto) {
  const distancias = ruta.linea.map((v) => distanciaKm(v, punto));
  const desvio = Math.min(...distancias);
  return { desvio, km: ruta.km[distancias.indexOf(desvio)] };
}
for (const ruta of rutas) {
  ruta.km = [0];
  for (let i = 1; i < ruta.linea.length; i++) ruta.km.push(ruta.km[i - 1] + distanciaKm(ruta.linea[i - 1], ruta.linea[i]));
}
// Cada localidad pertenece a la ruta que tiene mas cerca (Purmamarca esta sobre la RN 52, no sobre la RN 9).
const localidadesDe = (ruta) =>
  PUNTOS.map((p) => {
    const cercana = rutas.map((r) => ({ rutaId: r.id, ...proyectar(r, [p.lat, p.lon]) })).reduce((a, b) => (b.desvio < a.desvio ? b : a));
    return { id: p.id, nombre: p.nombre, rutaId: cercana.rutaId, km: cercana.km };
  }).filter((p) => p.rutaId === ruta.id);
const rn52 = rutas.find((r) => r.id === 'rn52');

const tramos = [];
const geo = {};
for (const ruta of rutas) {
  const { km } = ruta;
  const total = km.at(-1);
  const localidades = localidadesDe(ruta);
  // La RN 52 nace en la RN 9: ese punto sirve de referencia aunque no sea una localidad.
  if (ruta.id === 'rn9') localidades.push({ id: null, nombre: 'Empalme RN 52', km: proyectar(ruta, rn52.linea[0]).km });
  localidades.sort((a, b) => a.km - b.km);

  // El ultimo pedazo, si es muy corto, se suma al tramo anterior.
  const cantidad = Math.max(1, Math.round(total / LARGO_KM));
  for (let n = 0; n < cantidad; n++) {
    const inicio = n * LARGO_KM;
    const fin = n === cantidad - 1 ? total : inicio + LARGO_KM;
    const indices = km.map((_, i) => i).filter((i) => km[i] >= inicio && km[i] <= fin);
    const desde = Math.max(0, indices[0] - 1);
    const linea = ruta.linea.slice(desde, indices.at(-1) + 1);
    const medio = (inicio + fin) / 2;
    const centro = ruta.linea[km.reduce((mejor, k, i) => (Math.abs(k - medio) < Math.abs(km[mejor] - medio) ? i : mejor), 0)];
    const propia = localidades.find((l) => l.km >= inicio && (l.km < fin || n === cantidad - 1));
    const anterior = localidades.findLast((l) => l.km < inicio);
    const siguiente = localidades.find((l) => l.km >= fin);
    const nombre = propia?.nombre
      ?? (anterior && siguiente ? `Entre ${anterior.nombre} y ${siguiente.nombre}` : siguiente ? `Antes de ${siguiente.nombre}` : `Después de ${anterior.nombre}`);
    const id = `${ruta.id}-${String(n).padStart(2, '0')}`;
    tramos.push({
      id,
      nombre,
      ruta: NOMBRES[ruta.id],
      rutaId: ruta.id,
      kmInicio: Math.round(inicio),
      kmFin: Math.round(fin),
      referencia: `a ${Math.round(inicio)}–${Math.round(fin)} km ${ORIGEN[ruta.id]}`,
      localidad: propia?.id ?? null,
      lat: centro[0],
      lon: centro[1],
    });
    // Un punto cada ~250 m alcanza para dibujar el tramo.
    geo[id] = linea.filter((_, i) => i % 2 === 0 || i === linea.length - 1);
  }
}

// Altitud de cada tramo segun el modelo de elevacion de Open-Meteo.
const params = new URLSearchParams({ latitude: tramos.map((t) => t.lat).join(','), longitude: tramos.map((t) => t.lon).join(',') });
const res = await fetch(`https://api.open-meteo.com/v1/elevation?${params}`);
if (!res.ok) throw new Error(`Open-Meteo respondio ${res.status}`);
const { elevation } = await res.json();
tramos.forEach((t, i) => { t.altitud = Math.round(elevation[i]); });

writeFileSync(new URL('backend/src/data/tramos.json', raiz), `${JSON.stringify(tramos, null, 1)}\n`);
writeFileSync(new URL('frontend/src/data/tramos-geo.json', raiz), `${JSON.stringify(geo)}\n`);
console.log(`${tramos.length} tramos generados`);
