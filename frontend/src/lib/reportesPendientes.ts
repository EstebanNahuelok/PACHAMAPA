import { enviarReporte } from './api'
import type { NuevoReporte } from './api'

// Reportes hechos sin señal: quedan en el telefono y se envian solos cuando vuelve la conexion.
const CLAVE = 'pm-reportes-pendientes'
// Un reporte viejo ya no describe la ruta: pasado este tiempo se descarta en vez de enviarse.
const VIGENCIA_MS = 2 * 60 * 60 * 1000

interface Pendiente {
  reporte: NuevoReporte
  creado: number
}

function leer(): Pendiente[] {
  try {
    const lista: Pendiente[] = JSON.parse(localStorage.getItem(CLAVE) ?? '[]')
    return lista.filter((p) => Date.now() - p.creado < VIGENCIA_MS)
  } catch {
    return []
  }
}

const guardar = (lista: Pendiente[]) => localStorage.setItem(CLAVE, JSON.stringify(lista))

// El servidor respondio con un error (pedir() lanza Error con su mensaje); un fallo de red llega como otro tipo de error.
export const esFalloDeRed = (err: unknown) => !navigator.onLine || !(err instanceof Error) || err.name !== 'Error'

export const cantidadPendientes = () => leer().length

export function guardarPendiente(reporte: NuevoReporte) {
  guardar([...leer(), { reporte, creado: Date.now() }])
}

let enviando = false

// Devuelve cuantos se enviaron. Los que el servidor rechaza se descartan; si falla la red quedan para el proximo intento.
export async function enviarPendientes() {
  if (enviando) return 0
  enviando = true
  let enviados = 0
  try {
    for (const p of leer()) {
      try {
        await enviarReporte(p.reporte)
        enviados++
      } catch (err) {
        if (esFalloDeRed(err)) break
      }
      guardar(leer().filter((q) => q.creado !== p.creado))
    }
  } finally {
    enviando = false
  }
  return enviados
}
