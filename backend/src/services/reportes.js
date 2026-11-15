import { prisma, dbConfigurada } from './prisma.js';
import { TIPOS_REPORTE, MINIMO_PARA_CONFIRMAR } from '../data/tiposReporte.js';

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
    const grupos = porTramo.get(r.tramoId) ?? [];
    porTramo.set(r.tramoId, grupos);
    let grupo = grupos.find((g) => g.tipo === r.tipo);
    if (!grupo) {
      grupo = { tipo: r.tipo, etiqueta: TIPOS_REPORTE[r.tipo]?.etiqueta ?? r.tipo, cantidad: 0, confirmado: false, ultimo: r.creadoEn, comentarios: [] };
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
