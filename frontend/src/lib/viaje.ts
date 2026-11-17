import type { Estado, Icono } from './tipos'

// Viajes a cualquier lugar de la Argentina: buscador de lugares, camino con indicaciones y clima por tramo.
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export interface Lugar {
  id: string
  tipo: 'provincia' | 'municipio' | 'localidad' | 'gps'
  nombre: string
  municipio: string | null
  departamento: string | null
  provincia: string | null
  lat: number
  lon: number
}

export interface Indicacion {
  texto: string
  flecha: string
  via: string | null
  km: number
  distancia: number
  lat: number
  lon: number
}

export interface TramoViaje {
  kmInicio: number
  kmFin: number
  lat: number
  lon: number
  desdePunto: number
  hastaPunto: number
  llegada: string
  altitud: number | null
  estado: Estado
  motivos: string[]
  clima: { temperatura: number; descripcion: string; icono: Icono; visibilidad: number | null; rafagas: number; probabilidad: number | null } | null
}

export interface Viaje {
  total: number
  duracion: number
  linea: [number, number][]
  indicaciones: Indicacion[]
  tramos: TramoViaje[]
  errorClima: string | null
}

async function pedir<T>(ruta: string, ms = 15000): Promise<T> {
  const res = await fetch(`${BASE}${ruta}`, { signal: AbortSignal.timeout(ms) })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.error ?? `Error ${res.status}`)
  return json as T
}

export const obtenerProvincias = () => pedir<Lugar[]>('/api/provincias')
export const buscarLugares = (texto: string, provincia = '') => pedir<Lugar[]>(`/api/lugares?${new URLSearchParams({ q: texto, provincia })}`)
export const pedirViaje = (desde: { lat: number; lon: number }, hasta: { lat: number; lon: number }) =>
  pedir<Viaje>(`/api/viaje?desde=${desde.lat},${desde.lon}&hasta=${hasta.lat},${hasta.lon}`, 30000)

// Texto para mostrar un lugar: "Cafayate · Salta".
export const detalleDe = (l: Lugar) => [l.municipio && l.municipio !== l.nombre ? l.municipio : l.departamento !== l.nombre ? l.departamento : null, l.provincia !== l.nombre ? l.provincia : null].filter(Boolean).join(' · ')

const CLAVE_RECIENTES = 'pm-destinos-recientes'
export function leerRecientes(): Lugar[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_RECIENTES) ?? '[]')
  } catch {
    return []
  }
}
export function guardarReciente(l: Lugar) {
  if (l.tipo === 'gps') return
  localStorage.setItem(CLAVE_RECIENTES, JSON.stringify([l, ...leerRecientes().filter((r) => r.id !== l.id)].slice(0, 6)))
}

const RAD = Math.PI / 180
export function distanciaKm([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]) {
  const x = (lon2 - lon1) * RAD * Math.cos(((lat1 + lat2) / 2) * RAD)
  return Math.hypot(x, (lat2 - lat1) * RAD) * 6371
}

export function acumulado(linea: [number, number][]) {
  const km = [0]
  for (let i = 1; i < linea.length; i++) km.push(km[i - 1] + distanciaKm(linea[i - 1], linea[i]))
  return km
}

// Ubica una posicion sobre el camino: el kilometro recorrido y cuanto se aparta (para recalcular si se sale).
// Busca cerca del ultimo punto conocido para no saltar a otra parte del camino que pase cerca.
export function ubicarEnCamino(linea: [number, number][], km: number[], punto: [number, number], desde = 0) {
  let mejor = { km: 0, desvio: Infinity, i: 0 }
  const inicio = Math.max(0, desde - 50)
  for (let i = inicio; i < linea.length - 1; i++) {
    const [a, b] = [linea[i], linea[i + 1]]
    const largo = km[i + 1] - km[i]
    const cos = Math.cos(a[0] * RAD)
    const [bx, by] = [(b[1] - a[1]) * cos, b[0] - a[0]]
    const [px, py] = [(punto[1] - a[1]) * cos, punto[0] - a[0]]
    const f = Math.max(0, Math.min(1, (px * bx + py * by) / (bx * bx + by * by || 1)))
    const cerca: [number, number] = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
    const d = distanciaKm(cerca, punto)
    if (d < mejor.desvio) mejor = { km: km[i] + largo * f, desvio: d, i }
    // Ya se encontro el camino y se esta alejando: no hace falta seguir.
    if (mejor.desvio < 0.05 && km[i] - mejor.km > 5) break
  }
  return mejor
}

// Punto y rumbo a un kilometro del camino (para la simulacion).
export function puntoEnCamino(linea: [number, number][], km: number[], k: number) {
  const i = Math.max(1, Math.min(linea.length - 1, km.findIndex((x) => x >= k)))
  const [a, b] = [linea[i - 1], linea[i]]
  const f = Math.max(0, Math.min(1, (k - km[i - 1]) / (km[i] - km[i - 1] || 1)))
  const rumbo = (Math.atan2((b[1] - a[1]) * Math.cos(a[0] * RAD), b[0] - a[0]) / RAD + 360) % 360
  return { lat: a[0] + (b[0] - a[0]) * f, lon: a[1] + (b[1] - a[1]) * f, rumbo }
}

export const metros = (km: number) => (km < 1 ? `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m` : `${km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)} km`)

export function duracionDe(segundos: number) {
  const min = Math.max(1, Math.round(segundos / 60))
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`
}
