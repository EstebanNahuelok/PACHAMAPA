// Viajes a cualquier lugar de la Argentina: camino e indicaciones con OSRM (sobre OpenStreetMap) y el clima
// previsto a la hora en que se va a pasar por cada tramo, con Open-Meteo.
import { normalizarHoras } from './openMeteo.js';
import { estadoPorClima } from './estado.js';
import { flechaDe, textoManiobra, via } from './indicaciones.js';

const OSRM = process.env.OSRM_URL || 'https://router.project-osrm.org';
const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';
const VARIABLES = ['temperature_2m', 'apparent_temperature', 'weather_code', 'visibility', 'wind_speed_10m', 'wind_gusts_10m', 'precipitation', 'snowfall', 'precipitation_probability', 'is_day'];
const HORAS = 48;
const MAXIMO_TRAMOS = 60;
const TTL_MS = 10 * 60 * 1000;
const cache = new Map();

const RAD = Math.PI / 180;
export function distanciaKm([lat1, lon1], [lat2, lon2]) {
  const x = (lon2 - lon1) * RAD * Math.cos(((lat1 + lat2) / 2) * RAD);
  return Math.hypot(x, (lat2 - lat1) * RAD) * 6371;
}

// Saca puntos a menos de ~15 m del anterior y redondea: la respuesta pesa mucho menos y el trazado se ve igual.
export function simplificar(coordenadas) {
  const linea = [];
  for (const [lon, lat] of coordenadas) {
    const p = [Math.round(lat * 1e5) / 1e5, Math.round(lon * 1e5) / 1e5];
    if (!linea.length || distanciaKm(linea.at(-1), p) > 0.015) linea.push(p);
  }
  const [lonF, latF] = coordenadas.at(-1);
  const final = [Math.round(latF * 1e5) / 1e5, Math.round(lonF * 1e5) / 1e5];
  if (linea.length && linea.at(-1).join() !== final.join()) linea.push(final);
  return linea;
}

// Kilometro acumulado de cada punto de la linea.
export function acumulado(linea) {
  const km = [0];
  for (let i = 1; i < linea.length; i++) km.push(km[i - 1] + distanciaKm(linea[i - 1], linea[i]));
  return km;
}

// Divide el camino en tramos parejos: de 10 km, o mas largos en viajes largos para no pasar de MAXIMO_TRAMOS.
export function cortarEnTramos(linea, km) {
  const total = km.at(-1);
  const cantidad = Math.max(1, Math.min(MAXIMO_TRAMOS, Math.round(total / 10)));
  const largo = total / cantidad;
  const tramos = [];
  let i = 0;
  for (let n = 0; n < cantidad; n++) {
    const [desde, hasta] = [n * largo, Math.min(total, (n + 1) * largo)];
    const inicio = i;
    while (i < linea.length - 1 && km[i + 1] <= hasta) i++;
    const medio = km.findIndex((k) => k >= (desde + hasta) / 2);
    const [lat, lon] = linea[medio === -1 ? linea.length - 1 : medio];
    tramos.push({ kmInicio: Math.round(desde * 10) / 10, kmFin: Math.round(hasta * 10) / 10, lat, lon, desdePunto: inicio, hastaPunto: Math.max(i, inicio + 1) });
  }
  return tramos;
}

async function climaDe(tramos) {
  const params = new URLSearchParams({
    latitude: tramos.map((t) => t.lat).join(','),
    longitude: tramos.map((t) => t.lon).join(','),
    hourly: VARIABLES.join(','),
    past_hours: 1,
    forecast_hours: HORAS,
    timeformat: 'unixtime',
    timezone: 'America/Argentina/Buenos_Aires',
  });
  const res = await fetch(`${OPEN_METEO}?${params}`, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Open-Meteo respondio ${res.status}`);
  const json = await res.json();
  const lista = Array.isArray(json) ? json : [json];
  return lista.map((p) => ({ altitud: p.elevation ?? null, ...normalizarHoras(p.hourly) }));
}

// Clima a la hora de llegada: la hora del pronostico que la contiene, o la actual si se llega enseguida.
export function climaALaHora(serie, llegada) {
  const hora = serie.futuras.find((h) => {
    const inicio = new Date(h.hora).getTime();
    return llegada >= inicio && llegada < inicio + 3600000;
  });
  return hora ?? (llegada < Date.now() + 3600000 ? serie.actual : serie.futuras.at(-1)) ?? null;
}

export async function calcularViaje({ desde, hasta, salida = Date.now() }) {
  const clave = [desde.lat, desde.lon, hasta.lat, hasta.lon].map((n) => n.toFixed(4)).join(',');
  const guardado = cache.get(clave);
  let base = guardado && Date.now() - guardado.hora < TTL_MS ? guardado.base : null;
  if (!base) {
    const url = `${OSRM}/route/v1/driving/${desde.lon},${desde.lat};${hasta.lon},${hasta.lat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url, { headers: { 'User-Agent': 'pachamapa' }, signal: AbortSignal.timeout(20000) });
    const json = await res.json().catch(() => null);
    if (json?.code === 'NoRoute' || json?.code === 'NoSegment') throw Object.assign(new Error('No encontramos un camino por ruta entre esos dos lugares.'), { status: 404 });
    if (!res.ok || json?.code !== 'Ok') throw Object.assign(new Error('El servicio de rutas no responde. Probá de nuevo en un rato.'), { status: 502 });
    const ruta = json.routes[0];
    const linea = simplificar(ruta.geometry.coordinates);
    const km = acumulado(linea);
    const escala = km.at(-1) / (ruta.distance / 1000 || 1);
    let recorrido = 0;
    const indicaciones = ruta.legs.flatMap((l) => l.steps).map((s) => {
      const paso = {
        texto: textoManiobra(s),
        flecha: flechaDe(s.maneuver),
        via: via(s) || null,
        km: Math.round(recorrido * 1000) / 1000,
        distancia: Math.round(s.distance),
        lat: s.maneuver.location[1],
        lon: s.maneuver.location[0],
      };
      recorrido += (s.distance / 1000) * escala;
      return paso;
    });
    base = { linea, km, total: km.at(-1), duracion: ruta.duration, indicaciones };
    if (cache.size > 200) cache.clear();
    cache.set(clave, { hora: Date.now(), base });
  }
  const tramos = cortarEnTramos(base.linea, base.km);
  let series = null;
  let errorClima = null;
  try {
    series = await climaDe(tramos).catch(() => climaDe(tramos));
  } catch (err) {
    errorClima = err.message;
  }
  const velocidad = base.total / (base.duracion / 3600 || 1);
  return {
    total: Math.round(base.total * 10) / 10,
    duracion: Math.round(base.duracion),
    linea: base.linea,
    indicaciones: base.indicaciones,
    errorClima,
    tramos: tramos.map((t, n) => {
      const llegada = salida + (((t.kmInicio + t.kmFin) / 2) / velocidad) * 3600000;
      const clima = series ? climaALaHora(series[n], llegada) : null;
      const { estado, motivos } = estadoPorClima(clima);
      return {
        ...t,
        llegada: new Date(llegada).toISOString(),
        altitud: series?.[n]?.altitud ?? null,
        estado,
        motivos,
        clima: clima && { temperatura: clima.temperatura, descripcion: clima.descripcion, icono: clima.icono, visibilidad: clima.visibilidad, rafagas: clima.rafagas, probabilidad: clima.probabilidad },
      };
    }),
  };
}
