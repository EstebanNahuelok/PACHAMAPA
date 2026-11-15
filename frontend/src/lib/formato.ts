import type { Alerta, Estado, NivelRiesgo, Tramo } from './tipos'

const ZONA = 'America/Argentina/Jujuy'
const formatoHora = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA })

export const hora = (iso: string | null | undefined) => (iso ? formatoHora.format(new Date(iso)) : '--:--')

export function haceCuanto(iso: string) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  return `hace ${h} h${min % 60 ? ` ${min % 60} min` : ''}`
}

export const altitud = (m: number) => `${m.toLocaleString('es-AR')} m`

export const grados = (t: number | undefined | null) => (t == null || Number.isNaN(t) ? '--' : `${Math.round(t)}°`)

export function visibilidad(m: number | null | undefined) {
  if (m == null) return 'Sin dato'
  if (m < 1000) return `${Math.round(m / 10) * 10} m`
  if (m >= 20000) return 'Más de 20 km'
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', ',')} km`
}

export const ESTADOS: Record<Estado, { etiqueta: string; color: string; fondo: string; texto: string }> = {
  bien: { etiqueta: 'Bien', color: '#10b981', fondo: 'bg-emerald-50', texto: 'text-emerald-700' },
  atencion: { etiqueta: 'Atención', color: '#f59e0b', fondo: 'bg-amber-50', texto: 'text-amber-800' },
  problemas: { etiqueta: 'Problemas', color: '#dc2626', fondo: 'bg-red-50', texto: 'text-red-700' },
}

export function rangoHoras(desde: string, hasta: string) {
  const fin = new Date(new Date(hasta).getTime() + 60 * 60 * 1000).toISOString()
  return `de ${hora(desde)} a ${hora(fin)}`
}

export const RIESGOS: Record<NivelRiesgo, { etiqueta: string; clase: string }> = {
  bajo: { etiqueta: 'Bajo', clase: 'bg-emerald-50 text-emerald-700' },
  moderado: { etiqueta: 'Moderado', clase: 'bg-amber-50 text-amber-800' },
  alto: { etiqueta: 'Alto', clase: 'bg-red-50 text-red-700' },
}

export const mm = (valor: number) => `${valor.toLocaleString('es-AR')} mm`

export function textoAlerta(a: Alerta) {
  if (a.clase === 'previsto' && a.desde && a.hasta) return `Previsto ${rangoHoras(a.desde, a.hasta)}: ${a.mensaje.toLowerCase()}`
  return a.mensaje
}

// Hay algo para avisar en el tramo mas alla de su estado actual: empeora, riesgo alto o cierre reportado.
export function tieneAviso(t: Tramo) {
  const orden: Estado[] = ['bien', 'atencion', 'problemas']
  const aviso = t.pronostico?.aviso
  return Boolean(t.restriccion) || t.riesgo?.nivel === 'alto' || (aviso != null && orden.indexOf(aviso.estado) > orden.indexOf(t.estado))
}
