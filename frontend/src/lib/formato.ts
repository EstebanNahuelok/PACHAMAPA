import type { Estado } from './tipos'

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

export const grados = (t: number | undefined | null) => (t == null ? '--' : `${Math.round(t)}°`)

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
