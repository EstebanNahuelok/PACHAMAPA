import { prisma, dbConfigurada } from './prisma.js';
import { TIPOS_REPORTE, MINIMO_PARA_CONFIRMAR } from '../data/tiposReporte.js';
import { idDeTramo } from '../data/puntos.js';

export function crearReporte({ tipo, tramoId, comentario, canal = 'web' }) {
  const expiraEn = new Date(Date.now() + TIPOS_REPORTE[tipo].horas * 60 * 60 * 1000);
  return prisma.reporte.create({ data: { tipo, tramoId, comentario: comentario || null, canal, expiraEn } });
}

export const reportesActivos = (filtro = {}) =>
  prisma.reporte.findMany({ where: { ...filtro, expiraEn: { gt: new Date() } }, orderBy: { creadoEn: 'desc' } });

// Agrupa los reportes activos por tramo y tipo: 2 o mas del mismo tipo en un tramo quedan confirmados.
export function agruparPorTramo(reportes) {
  const porTramo = new Map();
  for (const r of reportes) {
    const tramoId = idDeTramo(r.tramoId);
    const grupos = porTramo.get(tramoId) ?? [];
    porTramo.set(tramoId, grupos);
    let grupo = grupos.find((g) => g.tipo === r.tipo);
    if (!grupo) {
      grupo = { tipo: r.tipo, etiqueta: TIPOS_REPORTE[r.tipo]?.etiqueta ?? r.tipo, grave: Boolean(TIPOS_REPORTE[r.tipo]?.grave), cantidad: 0, confirmado: false, ultimo: r.creadoEn, comentarios: [] };
      grupos.push(grupo);
    }
    grupo.cantidad += 1;
    grupo.confirmado = grupo.cantidad >= MINIMO_PARA_CONFIRMAR;
    if (r.comentario && grupo.comentarios.length < 3) grupo.comentarios.push(r.comentario);
  }
  return porTramo;
}

// Nunca tira error: si la base no responde, el mapa sigue funcionando solo con el clima.
export async function gruposActivosPorTramo() {
  if (!dbConfigurada) return { porTramo: new Map(), disponible: false };
  try {
    return { porTramo: agruparPorTramo(await reportesActivos()), disponible: true };
  } catch (err) {
    console.error('[reportes] no se pudieron leer:', err.message);
    return { porTramo: new Map(), disponible: false };
  }
}

const DIAS_HISTORIAL = 30;
const FRANJAS = [[6, 'madrugada'], [12, 'mañana'], [20, 'tarde'], [24, 'noche']];
const horaLocal = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/Argentina/Jujuy' });
const franjaDe = (fecha) => FRANJAS.find(([hasta]) => Number(horaLocal.format(fecha)) < hasta)[1];
const masFrecuente = (conteo) => Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

// Patrones de los reportes de los ultimos dias: que se reporta en cada tramo y en que momento del dia.
export function resumirHistorial(reportes, dias = DIAS_HISTORIAL) {
  const porTramo = new Map();
  for (const r of reportes) {
    const tramoId = idDeTramo(r.tramoId);
    const h = porTramo.get(tramoId) ?? { total: 0, tipos: {}, franjas: {} };
    porTramo.set(tramoId, h);
    h.total += 1;
    h.tipos[r.tipo] = (h.tipos[r.tipo] ?? 0) + 1;
    const franja = franjaDe(r.creadoEn);
    h.franjas[franja] = (h.franjas[franja] ?? 0) + 1;
  }
  for (const [id, h] of porTramo) {
    porTramo.set(id, {
      dias,
      total: h.total,
      porTipo: Object.entries(h.tipos).sort((a, b) => b[1] - a[1]).map(([tipo, cantidad]) => ({ tipo, etiqueta: TIPOS_REPORTE[tipo]?.etiqueta ?? tipo, cantidad })),
      franjaHabitual: masFrecuente(h.franjas),
    });
  }
  return porTramo;
}

const TTL_HISTORIAL_MS = 10 * 60 * 1000;
let cacheHistorial = { porTramo: new Map(), hasta: 0 };

// Igual que los reportes activos: si la base no responde, devuelve vacio y el mapa sigue funcionando.
export async function historialPorTramo() {
  if (!dbConfigurada) return new Map();
  if (Date.now() < cacheHistorial.hasta) return cacheHistorial.porTramo;
  try {
    const desde = new Date(Date.now() - DIAS_HISTORIAL * 24 * 60 * 60 * 1000);
    const reportes = await prisma.reporte.findMany({ where: { creadoEn: { gte: desde } }, select: { tramoId: true, tipo: true, creadoEn: true } });
    cacheHistorial = { porTramo: resumirHistorial(reportes), hasta: Date.now() + TTL_HISTORIAL_MS };
  } catch (err) {
    console.error('[historial] no se pudo leer:', err.message);
  }
  return cacheHistorial.porTramo;
}
