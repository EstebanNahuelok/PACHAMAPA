import { dificultadesDe } from './dificultades'
import type { Dificultad } from './dificultades'
import { MAXIMO_DESVIO_KM, caminoPorDelante, ubicar } from './ruta'
import type { Estado, HoraPronostico, Icono, Tramo } from './tipos'

// Modo navegacion: arma el camino que queda por delante, en tramos de 5 km, y para cada uno lo que se espera
// a la hora estimada de llegada (no lo que pasa ahora, que puede cambiar antes de llegar).
export const VELOCIDAD_SUPUESTA = 60
const HORA_MS = 60 * 60 * 1000
const NIVEL: Record<Estado, number> = { bien: 0, atencion: 1, problemas: 2 }

export interface Ubicacion {
  lat: number
  lon: number
  velocidad: number | null
  rumbo: number | null
}

export interface Paso {
  tramo: Tramo
  km: number
  llegada: number
  estado: Estado
  icono: Icono | undefined
  temperatura: number | null | undefined
  dificultades: Dificultad[]
}

// Varios tramos seguidos con las mismas dificultades (o sin ninguna) se leen como uno solo.
export interface Trecho {
  pasos: Paso[]
  km: number
  largo: number
  estado: Estado
  dificultades: Dificultad[]
  localidades: string[]
  clave: string
}

export interface Recorrido {
  pasos: Paso[]
  trechos: Trecho[]
  total: number
  llegada: number
  velocidad: number
  velocidadMedida: boolean
  desvio: number
  fueraDeRuta: boolean
}

const firma = (dificultades: Dificultad[]) => dificultades.map((d) => d.titulo).join('|')

function agrupar(pasos: Paso[], total: number): Trecho[] {
  const trechos: Trecho[] = []
  for (const p of pasos) {
    const ultimo = trechos.at(-1)
    if (ultimo && firma(ultimo.dificultades) === firma(p.dificultades) && ultimo.estado === p.estado) ultimo.pasos.push(p)
    else trechos.push({ pasos: [p], km: p.km, largo: 0, estado: p.estado, dificultades: p.dificultades, localidades: [], clave: '' })
  }
  for (const t of trechos) {
    const final = t.pasos.at(-1)!
    t.largo = Math.min(total, final.km + (final.tramo.kmFin - final.tramo.kmInicio)) - t.km
    t.localidades = t.pasos.filter((p) => p.tramo.localidad).map((p) => p.tramo.nombre)
    // El final del trecho no cambia mientras se avanza: sirve para avisarlo una sola vez.
    t.clave = `${final.tramo.id}:${firma(t.dificultades)}`
  }
  return trechos
}

export function armarRecorrido(tramos: Tramo[], origen: Ubicacion | Tramo, destino: Tramo, ahora: number): Recorrido {
  const desde = ubicar(origen.lat, origen.lon)
  const medida = 'velocidad' in origen && origen.velocidad != null && origen.velocidad >= 20
  const velocidad = medida ? (origen as Ubicacion).velocidad! : VELOCIDAD_SUPUESTA
  // El tramo que se esta recorriendo va primero aunque ya se haya pasado su punto medio.
  const actual = tramos.find((t) => t.rutaId === desde.ruta && desde.km >= t.kmInicio && desde.km <= t.kmFin)
  const adelante = caminoPorDelante(tramos, desde, ubicar(destino.lat, destino.lon)).filter((p) => p.tramo.id !== actual?.id)
  const camino = [...(actual ? [{ tramo: actual, km: 0 }] : []), ...adelante.map((p) => ({ tramo: p.tramo, km: Math.max(0, p.km - (p.tramo.kmFin - p.tramo.kmInicio) / 2) }))]
  const pasos = camino.map(({ tramo, km }): Paso => {
    const llegada = ahora + (km / velocidad) * HORA_MS
    const prevista: HoraPronostico | undefined = tramo.pronostico?.horas.find((h) => {
      const inicio = new Date(h.hora).getTime()
      return llegada >= inicio && llegada < inicio + HORA_MS
    })
    const deReportes = tramo.estadoReportes?.estado ?? 'bien'
    return {
      tramo,
      km,
      llegada,
      estado: prevista ? (NIVEL[prevista.estado] >= NIVEL[deReportes] ? prevista.estado : deReportes) : tramo.estado,
      icono: prevista?.icono ?? tramo.clima?.icono,
      temperatura: prevista ? prevista.temperatura : tramo.clima?.temperatura,
      // Lo previsto para mas tarde no cuenta: importa lo que va a haber cuando se pase por el tramo.
      dificultades: dificultadesDe(tramo, prevista).filter((d) => d.origen !== 'previsto'),
    }
  })
  const final = pasos.at(-1)
  const total = final ? final.km + (final.tramo.kmFin - final.tramo.kmInicio) / 2 : 0
  return { pasos, trechos: agrupar(pasos, total), total, llegada: ahora + (total / velocidad) * HORA_MS, velocidad, velocidadMedida: medida, desvio: desde.desvio, fueraDeRuta: desde.desvio > MAXIMO_DESVIO_KM }
}

export const distancia = (km: number) => (km < 1 ? 'Acá' : `${Math.round(km)} km`)

export function duracion(ms: number) {
  const min = Math.max(0, Math.round(ms / 60000))
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`
}

export function decir(texto: string) {
  if (!('speechSynthesis' in window)) return
  const frase = new SpeechSynthesisUtterance(texto)
  frase.lang = 'es-AR'
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(frase)
}

export const fraseDe = (t: Trecho) =>
  `${t.km < 1 ? 'En este tramo' : `En ${Math.round(t.km)} kilómetros`}${t.largo > 7 ? `, por ${Math.round(t.largo)} kilómetros` : ''}: ${t.dificultades.map((d) => d.titulo).join(', ')}.`
