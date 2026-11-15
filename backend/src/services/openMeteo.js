import { PUNTOS } from '../data/puntos.js';

const URL_BASE = 'https://api.open-meteo.com/v1/forecast';
const VARIABLES = [
  'temperature_2m', 'apparent_temperature', 'weather_code', 'cloud_cover', 'visibility',
  'wind_speed_10m', 'wind_gusts_10m', 'precipitation', 'rain', 'snowfall', 'is_day',
];
const TTL_MS = 5 * 60 * 1000;

let cache = { porId: new Map(), actualizado: null, error: null };
let enCurso = null;

const DESCRIPCIONES = {
  0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
  45: 'Neblina', 48: 'Neblina con escarcha',
  51: 'Llovizna leve', 53: 'Llovizna', 55: 'Llovizna intensa', 56: 'Llovizna helada', 57: 'Llovizna helada intensa',
  61: 'Lluvia leve', 63: 'Lluvia', 65: 'Lluvia fuerte', 66: 'Lluvia helada', 67: 'Lluvia helada fuerte',
  71: 'Nevada leve', 73: 'Nevada', 75: 'Nevada fuerte', 77: 'Granos de nieve',
  80: 'Chaparrones leves', 81: 'Chaparrones', 82: 'Chaparrones fuertes',
  85: 'Chaparrones de nieve', 86: 'Chaparrones de nieve fuertes',
  95: 'Tormenta', 96: 'Tormenta con granizo', 99: 'Tormenta con granizo fuerte',
};

function iconoPara({ codigo, esDia, visibilidad, rafagas, viento }) {
  if (codigo >= 95) return 'tormenta';
  if ((codigo >= 71 && codigo <= 77) || codigo === 85 || codigo === 86) return 'nieve';
  if ((codigo >= 61 && codigo <= 67) || (codigo >= 80 && codigo <= 82)) return 'lluvia';
  if (codigo === 45 || codigo === 48 || (visibilidad != null && visibilidad < 1000)) return 'neblina';
  if (codigo >= 51 && codigo <= 57) return 'llovizna';
  if (rafagas >= 50 || viento >= 40) return 'viento';
  if (codigo === 3) return 'nublado';
  if (codigo === 2) return esDia ? 'parcial' : 'parcial-noche';
  return esDia ? 'sol' : 'luna';
}

function normalizar(actual) {
  const codigo = actual.weather_code;
  const clima = {
    temperatura: actual.temperature_2m,
    sensacion: actual.apparent_temperature,
    codigo,
    nubosidad: actual.cloud_cover,
    visibilidad: actual.visibility,
    viento: actual.wind_speed_10m,
    rafagas: actual.wind_gusts_10m,
    precipitacion: actual.precipitation,
    lluvia: actual.rain,
    nieve: actual.snowfall,
    esDia: actual.is_day === 1,
    medido: new Date(actual.time * 1000).toISOString(),
  };
  const pocaVisibilidad = clima.visibilidad != null && clima.visibilidad < 1000;
  clima.descripcion = DESCRIPCIONES[codigo] ?? 'Sin datos';
  if (pocaVisibilidad && codigo < 45) clima.descripcion = 'Neblina';
  else if (pocaVisibilidad && codigo > 48) clima.descripcion += ' con neblina';
  clima.icono = iconoPara(clima);
  if (clima.icono === 'viento') clima.descripcion = `${clima.descripcion}, ventoso`;
  return clima;
}

async function consultar() {
  const params = new URLSearchParams({
    latitude: PUNTOS.map((p) => p.lat).join(','),
    longitude: PUNTOS.map((p) => p.lon).join(','),
    elevation: PUNTOS.map((p) => p.altitud).join(','),
    current: VARIABLES.join(','),
    timeformat: 'unixtime',
    timezone: 'America/Argentina/Jujuy',
  });
  const res = await fetch(`${URL_BASE}?${params}`, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Open-Meteo respondio ${res.status}`);
  const json = await res.json();
  const lista = Array.isArray(json) ? json : [json];
  if (lista.length !== PUNTOS.length) throw new Error('Open-Meteo devolvio una cantidad inesperada de puntos');
  return new Map(PUNTOS.map((p, i) => [p.id, normalizar(lista[i].current)]));
}

export async function actualizarClima() {
  if (!enCurso) {
    enCurso = consultar()
      .then((porId) => { cache = { porId, actualizado: new Date(), error: null }; })
      .catch((err) => {
        console.error('[clima] no se pudo actualizar:', err.message);
        cache = { ...cache, error: err.message };
      })
      .finally(() => { enCurso = null; });
  }
  await enCurso;
  return cache;
}

// Devuelve el clima de todos los puntos; consulta Open-Meteo solo si el cache esta vencido.
export async function obtenerClima() {
  const vencido = !cache.actualizado || Date.now() - cache.actualizado.getTime() > TTL_MS;
  return vencido ? actualizarClima() : cache;
}

export function iniciarActualizacionAutomatica() {
  actualizarClima();
  setInterval(actualizarClima, TTL_MS).unref();
}
