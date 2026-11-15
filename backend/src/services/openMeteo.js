import { TRAMOS } from '../data/puntos.js';

const URL_BASE = 'https://api.open-meteo.com/v1/forecast';
// Diez variables por hora: Open-Meteo cuenta cada pedido segun la cantidad de puntos y de variables.
const VARIABLES = [
  'temperature_2m', 'apparent_temperature', 'weather_code', 'visibility', 'wind_speed_10m',
  'wind_gusts_10m', 'precipitation', 'snowfall', 'precipitation_probability', 'is_day',
];
const HORAS_PASADAS = 72;
const HORAS_FUTURAS = 24;
// El pronostico cambia por hora: con un punto cada 5 km no hace falta pedirlo mas seguido.
const TTL_MS = 15 * 60 * 1000;

let cache = { porId: new Map(), horas: new Map(), actualizado: null, error: null };
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

function describir(clima) {
  const { codigo } = clima;
  const pocaVisibilidad = clima.visibilidad != null && clima.visibilidad < 1000;
  clima.descripcion = DESCRIPCIONES[codigo] ?? 'Sin datos';
  if (pocaVisibilidad && codigo < 45) clima.descripcion = 'Neblina';
  else if (pocaVisibilidad && codigo > 48) clima.descripcion += ' con neblina';
  clima.icono = iconoPara(clima);
  if (clima.icono === 'viento') clima.descripcion = `${clima.descripcion}, ventoso`;
  return clima;
}

// Separa la serie horaria en lluvia ya caida (para el riesgo de aludes), la hora en curso (el clima actual)
// y el pronostico de las proximas horas.
export function normalizarHoras(porHora, ahora = Date.now()) {
  const pasadas = [];
  const futuras = [];
  let actual = null;
  porHora.time.forEach((t, i) => {
    const hora = new Date(t * 1000).toISOString();
    const clima = describir({
      hora,
      temperatura: porHora.temperature_2m[i],
      sensacion: porHora.apparent_temperature?.[i],
      codigo: porHora.weather_code[i],
      visibilidad: porHora.visibility[i],
      viento: porHora.wind_speed_10m[i],
      rafagas: porHora.wind_gusts_10m[i],
      precipitacion: porHora.precipitation[i] ?? 0,
      nieve: porHora.snowfall[i] ?? 0,
      probabilidad: porHora.precipitation_probability[i],
      esDia: porHora.is_day[i] === 1,
    });
    if (t * 1000 > ahora) return futuras.push(clima);
    pasadas.push({ hora, precipitacion: clima.precipitacion });
    actual = { ...clima, medido: hora };
  });
  return { actual, pasadas, futuras: futuras.slice(0, HORAS_FUTURAS) };
}

async function pedir() {
  const params = new URLSearchParams({
    latitude: TRAMOS.map((t) => t.lat).join(','),
    longitude: TRAMOS.map((t) => t.lon).join(','),
    elevation: TRAMOS.map((t) => t.altitud).join(','),
    hourly: VARIABLES.join(','),
    past_hours: HORAS_PASADAS,
    forecast_hours: HORAS_FUTURAS + 1,
    timeformat: 'unixtime',
    timezone: 'America/Argentina/Jujuy',
  });
  const res = await fetch(`${URL_BASE}?${params}`, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Open-Meteo respondio ${res.status}`);
  const json = await res.json();
  const lista = Array.isArray(json) ? json : [json];
  if (lista.length !== TRAMOS.length) throw new Error('Open-Meteo devolvio una cantidad inesperada de puntos');
  const series = lista.map((punto) => normalizarHoras(punto.hourly));
  return {
    porId: new Map(TRAMOS.flatMap((t, i) => (series[i].actual ? [[t.id, series[i].actual]] : []))),
    horas: new Map(TRAMOS.map((t, i) => [t.id, series[i]])),
  };
}

// Open-Meteo falla cada tanto (cortes, respuestas incompletas): se reintenta una vez antes de darlo por caido.
const consultar = () => pedir().catch(() => pedir());

export async function actualizarClima() {
  if (!enCurso) {
    enCurso = consultar()
      .then((datos) => { cache = { ...datos, actualizado: new Date(), error: null }; })
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
