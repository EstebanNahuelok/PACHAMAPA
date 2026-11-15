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
