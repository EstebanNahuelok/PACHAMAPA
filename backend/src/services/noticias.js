// Noticias de los diarios sobre incidentes en las rutas, tomadas del buscador de Google Noticias (RSS).
// Son solo informativas: no cambian el estado de los tramos ni disparan alertas.
import { PUNTOS } from '../data/puntos.js';
import { TIPOS_REPORTE } from '../data/tiposReporte.js';
import { clasificarPorPalabras } from './clasificador.js';

const INTERVALO_MS = (Number(process.env.NOTICIAS_MINUTOS) || 5) * 60 * 1000;
const HORAS = Number(process.env.NOTICIAS_HORAS) || 48;
const MAXIMO = 12;
const NAVEGADOR = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const BUSQUEDAS = [
  '"ruta 9" Jujuy',
  '"ruta 52" Jujuy',
  'Jujuy ruta (corte OR derrumbe OR alud OR desborde OR nevada OR tránsito) (Quebrada OR Humahuaca OR Tilcara OR Purmamarca OR Volcán OR "Salinas Grandes" OR "Cuesta de Lipán")',
];

let cache = { noticias: [], actualizado: null };
// El enlace directo se averigua una sola vez por nota.
const enlaces = new Map();

const sinAcentos = (texto) => texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const LUGARES = PUNTOS.filter((p) => p.id !== 'san-salvador').map((p) => ({ id: p.id, nombre: p.nombre, patron: new RegExp(`\\b${sinAcentos(p.nombre)}\\b`) }));
const EN_RUTA = /\b(ruta|rn|ruta nacional|ruta nac\.?) ?(9|52)\b|quebrada de humahuaca/;
const RESUELTO = /normaliz|habilit|reabr|liber(o|aron|ada|ado)\b|restablec|ya se puede (circular|transitar)|transito normal/;
// Palabras propias de los titulares, ademas de las del clasificador de reportes.
const EXTRA = [
  ['accidente', /siniestro|despist|atropell/],
  ['corte', /transito (interrumpido|cortado|restringido)|restriccion|interrup/],
  ['crecida', /temporal|tormenta|lluvias? (intensa|fuerte)/],
];

const entidades = (texto) =>
  texto
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();

function leerRss(xml) {
  return [...xml.matchAll(/<item>(.*?)<\/item>/gs)].map(([, item]) => {
    const campo = (nombre) => entidades(item.match(new RegExp(`<${nombre}[^>]*>(.*?)</${nombre}>`, 's'))?.[1] ?? '');
    const fuente = item.match(/<source url="([^"]*)">(.*?)<\/source>/s);
    const nombreFuente = entidades(fuente?.[2] ?? '');
    let titulo = campo('title');
    if (nombreFuente && titulo.endsWith(` - ${nombreFuente}`)) titulo = titulo.slice(0, -nombreFuente.length - 3);
    return { id: campo('guid'), titulo, enlaceGoogle: campo('link'), fuente: nombreFuente, fuenteUrl: entidades(fuente?.[1] ?? ''), publicado: new Date(campo('pubDate')) };
  });
}

// Deja solo las notas que hablan de un incidente en las rutas cubiertas y las ubica en una localidad si la nombran.
export function interpretar(nota) {
  const texto = sinAcentos(nota.titulo);
  const lugar = LUGARES.find((l) => l.patron.test(texto));
  const deJujuy = /jujuy/.test(texto) || /jujuy/.test(sinAcentos(`${nota.fuente} ${nota.fuenteUrl}`));
  if (!lugar && !(EN_RUTA.test(texto) && deJujuy)) return null;
  const tipo = clasificarPorPalabras(texto) ?? EXTRA.find(([, patron]) => patron.test(texto))?.[0] ?? null;
  const resuelto = RESUELTO.test(texto);
  if (!tipo && !resuelto) return null;
  return {
    id: nota.id,
    titulo: nota.titulo,
    fuente: nota.fuente || 'Fuente sin nombre',
    fuenteUrl: nota.fuenteUrl || null,
    enlace: nota.enlaceGoogle,
    publicado: nota.publicado.toISOString(),
    tipo,
    etiqueta: resuelto ? 'Tránsito normalizado' : TIPOS_REPORTE[tipo].etiqueta,
    resuelto,
    localidad: lugar?.id ?? null,
    lugar: lugar?.nombre ?? null,
  };
}

// Google entrega un enlace propio que redirige; con esto se obtiene la direccion de la nota en el diario.
async function enlaceDirecto(enlaceGoogle) {
  const id = new URL(enlaceGoogle).pathname.split('/').pop();
  const pagina = await (await fetch(`https://news.google.com/rss/articles/${id}`, { headers: { 'User-Agent': NAVEGADOR }, signal: AbortSignal.timeout(10000) })).text();
  const firma = pagina.match(/data-n-a-sg="([^"]+)"/)?.[1];
  const momento = pagina.match(/data-n-a-ts="([^"]+)"/)?.[1];
  if (!firma || !momento) throw new Error('Google no entrego la firma del enlace');
  const pedido = ['garturlreq', [['X', 'X', ['X', 'X'], null, null, 1, 1, 'US:en', null, 1, null, null, null, null, null, 0, 1], 'X', 'X', 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0], id, Number(momento), firma];
  const res = await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', 'User-Agent': NAVEGADOR },
    body: `f.req=${encodeURIComponent(JSON.stringify([[['Fbv4je', JSON.stringify(pedido), null, 'generic']]]))}`,
    signal: AbortSignal.timeout(10000),
  });
  const url = JSON.parse(JSON.parse((await res.text()).split('\n\n')[1])[0][2])[1];
  if (!/^https?:\/\//.test(url)) throw new Error('Google no entrego el enlace');
  return url;
}

async function buscar(consulta) {
  const params = new URLSearchParams({ q: `${consulta} when:${Math.ceil(HORAS / 24)}d`, hl: 'es-419', gl: 'AR', ceid: 'AR:es-419' });
  const res = await fetch(`https://news.google.com/rss/search?${params}`, { headers: { 'User-Agent': NAVEGADOR }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Google Noticias respondio ${res.status}`);
  return leerRss(await res.text());
}

export async function actualizarNoticias() {
  try {
    const resultados = await Promise.allSettled(BUSQUEDAS.map(buscar));
    if (resultados.every((r) => r.status === 'rejected')) throw resultados[0].reason;
    const desde = Date.now() - HORAS * 60 * 60 * 1000;
    const vistas = new Set();
    const noticias = resultados
      .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
      .filter((n) => n.id && !vistas.has(n.id) && vistas.add(n.id) && n.publicado.getTime() >= desde)
      .map(interpretar)
      .filter(Boolean)
      .sort((a, b) => b.publicado.localeCompare(a.publicado))
      .slice(0, MAXIMO);
    for (const n of noticias) {
      if (!enlaces.has(n.id)) {
        try {
          enlaces.set(n.id, await enlaceDirecto(n.enlace));
        } catch (err) {
          // Queda el enlace de Google, que igual lleva a la nota; se reintenta en la proxima vuelta.
          console.error('[noticias] sin enlace directo:', err.message);
        }
      }
      n.enlace = enlaces.get(n.id) ?? n.enlace;
    }
    cache = { noticias, actualizado: new Date() };
  } catch (err) {
    console.error('[noticias] no se pudieron actualizar:', err.message);
  }
  return cache;
}

export const obtenerNoticias = () => cache;

export function iniciarNoticias() {
  if (process.env.NOTICIAS === 'no') return;
  actualizarNoticias();
  setInterval(actualizarNoticias, INTERVALO_MS).unref();
}
