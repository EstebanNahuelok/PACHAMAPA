// Buscador de lugares de toda la Argentina con la API Georef del Estado (datos.gob.ar): gratis y sin clave.
const BASE = 'https://apis.datos.gob.ar/georef/api';
const TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map();

async function georef(ruta, params) {
  const url = `${BASE}/${ruta}?${new URLSearchParams(params)}`;
  const guardado = cache.get(url);
  if (guardado && Date.now() - guardado.hora < TTL_MS) return guardado.datos;
  const pedir = () => fetch(url, { signal: AbortSignal.timeout(10000) });
  const res = await pedir().catch(pedir);
  if (!res.ok) throw Object.assign(new Error('El buscador de lugares no responde'), { status: 502 });
  const datos = await res.json();
  if (cache.size > 500) cache.clear();
  cache.set(url, { hora: Date.now(), datos });
  return datos;
}

const lugar = (tipo, l) => ({
  id: `${tipo}-${l.id}`,
  tipo,
  nombre: l.nombre,
  municipio: l.municipio?.nombre ?? null,
  departamento: l.departamento?.nombre ?? null,
  provincia: l.provincia?.nombre ?? null,
  lat: l.centroide.lat,
  lon: l.centroide.lon,
});

export async function provincias() {
  const { provincias: lista } = await georef('provincias', { campos: 'id,nombre,centroide', max: 30, orden: 'nombre' });
  return lista.map((p) => ({ ...lugar('provincia', p), provincia: p.nombre }));
}

// Con texto busca ciudades, pueblos y municipios; sin texto, lista los municipios de la provincia elegida.
export async function buscarLugares(texto = '', provincia = '') {
  const filtro = provincia ? { provincia } : {};
  const campos = 'id,nombre,centroide,provincia.nombre';
  if (!texto) {
    const { municipios } = await georef('municipios', { ...filtro, campos, max: 1000, orden: 'nombre' });
    return municipios.map((m) => lugar('municipio', m));
  }
  const [loc, mun] = await Promise.all([
    georef('localidades', { ...filtro, nombre: texto, campos: `${campos},departamento.nombre,municipio.nombre`, max: 15 }),
    georef('municipios', { ...filtro, nombre: texto, campos, max: 5 }),
  ]);
  const vistos = new Set();
  return [...loc.localidades.map((l) => lugar('localidad', l)), ...mun.municipios.map((m) => lugar('municipio', m))].filter((l) => {
    const clave = `${l.nombre}|${l.provincia}|${l.lat.toFixed(2)}`;
    if (vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  }).slice(0, 15);
}
