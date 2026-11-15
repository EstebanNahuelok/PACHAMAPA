import type { RespuestaTramos } from './tipos'

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

async function pedir<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${ruta}`, {
    ...opciones,
    headers: opciones?.body ? { 'Content-Type': 'application/json' } : undefined,
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.error ?? `Error ${res.status}`)
  return json as T
}

export const obtenerTramos = () => pedir<RespuestaTramos>('/api/tramos')

export interface NuevoReporte {
  tipo?: string
  tramoId: string
  comentario?: string
}

export interface ReporteCreado {
  id: string
  tipo: string
  etiqueta: string
  tramoId: string
  tramo: string
  confirmado: boolean
}

export interface Metricas {
  visitas: number
  visitantes: number
  reportes: number
  reportesActivos: number
  listaEspera: number
  suscriptores: number
}

export interface Interesado {
  nombre: string
  contacto: string
  rubro: string
  mensaje?: string
}

const enviar = <T>(ruta: string, cuerpo: unknown) => pedir<T>(ruta, { method: 'POST', body: JSON.stringify(cuerpo) })

export const enviarReporte = (reporte: NuevoReporte) => enviar<ReporteCreado>('/api/reportes', reporte)
export const obtenerMetricas = () => pedir<Metricas>('/api/metricas')
export const sumarListaEspera = (interesado: Interesado) => enviar<{ ok: true }>('/api/lista-espera', interesado)

export interface NuevaSuscripcion {
  telefono: string
  nombre?: string
  tramos: string[]
  nivel: 'atencion' | 'problemas'
  desdeHora: number
  hastaHora: number
}

export interface SuscripcionCreada {
  telefono: string
  confirmacion: boolean
}

export const suscribirAlertas = (suscripcion: NuevaSuscripcion) => enviar<SuscripcionCreada>('/api/alertas/suscripciones', suscripcion)

export function registrarVisita() {
  let visitante = localStorage.getItem('pm-visitante')
  if (!visitante) {
    visitante = crypto.randomUUID()
    localStorage.setItem('pm-visitante', visitante)
  }
  return enviar<null>('/api/visitas', { visitante })
}
