import { dificultadesDe } from './dificultades'
import type { Dificultad } from './dificultades'
import { MAXIMO_DESVIO_KM, caminoPorDelante, distanciaPorRuta, ubicar } from './ruta'
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
  // Color del tramo en el mapa: sin los reportes con punto exacto, que se pintan en su lugar.
  estadoLinea: Estado
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
  // No hay camino cargado entre el origen y el destino (por ejemplo, de Salta a Jujuy).
  sinCamino: boolean
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
  const conPrueba = tramos.some((t) => t.prueba)
  const desde = ubicar(origen.lat, origen.lon, conPrueba)
  const hasta = ubicar(destino.lat, destino.lon, conPrueba)
  const medida = 'velocidad' in origen && origen.velocidad != null && origen.velocidad >= 20
  const velocidad = medida ? (origen as Ubicacion).velocidad! : VELOCIDAD_SUPUESTA
  // El tramo que se esta recorriendo va primero aunque ya se haya pasado su punto medio.
  const actual = tramos.find((t) => t.rutaId === desde.ruta && desde.km >= t.kmInicio && desde.km <= t.kmFin)
  const adelante = caminoPorDelante(tramos, desde, hasta).filter((p) => p.tramo.id !== actual?.id)
  const camino = [...(actual ? [{ tramo: actual, km: 0 }] : []), ...adelante.map((p) => ({ tramo: p.tramo, km: Math.max(0, p.km - (p.tramo.kmFin - p.tramo.kmInicio) / 2) }))]
  // Un reporte con punto exacto se mide hasta ese punto; si todos sus puntos ya quedaron atras, no se avisa mas.
  const largo = distanciaPorRuta(desde, hasta)
  const conDistancia = (d: Dificultad): Dificultad[] => {
    if (!d.puntos?.length) return [d]
    const porDelante = (p: { lat: number; lon: number }) => {
      const lugar = ubicar(p.lat, p.lon, conPrueba)
      return distanciaPorRuta(desde, lugar) + distanciaPorRuta(lugar, hasta) <= largo + 0.3 ? [distanciaPorRuta(desde, lugar)] : []
    }
    const adelante = d.puntos.flatMap((p) => {
      const extremos = [p, ...(p.fin ? [p.fin] : [])].flatMap(porDelante)
      // Con una punta adelante y la otra atras se esta adentro del trecho.
      return p.fin && extremos.length === 1 ? [0] : extremos
    })
    return adelante.length ? [{ ...d, km: Math.min(...adelante) }] : []
  }
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
      estadoLinea: prevista ? prevista.estado : (tramo.estadoLinea ?? tramo.estado),
      icono: prevista?.icono ?? tramo.clima?.icono,
      temperatura: prevista ? prevista.temperatura : tramo.clima?.temperatura,
      // Lo previsto para mas tarde no cuenta: importa lo que va a haber cuando se pase por el tramo.
      dificultades: dificultadesDe(tramo, prevista).filter((d) => d.origen !== 'previsto').flatMap(conDistancia),
    }
  })
  const final = pasos.at(-1)
  const total = final ? final.km + (final.tramo.kmFin - final.tramo.kmInicio) / 2 : 0
  return { pasos, trechos: agrupar(pasos, total), total, llegada: ahora + (total / velocidad) * HORA_MS, velocidad, velocidadMedida: medida, desvio: desde.desvio, fueraDeRuta: desde.desvio > MAXIMO_DESVIO_KM, sinCamino: !Number.isFinite(distanciaPorRuta(desde, hasta)) }
}

export const distancia = (km: number) => (km < 1 ? 'Acá' : `${Math.round(km)} km`)

// Distancia hasta un punto exacto: en metros si esta cerca.
export const aDistancia = (km: number) => (km < 1 ? `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m` : `${km.toFixed(1).replace('.', ',')} km`)

// Kilometros hasta lo primero de un trecho: el punto exacto mas cercano si lo hay, o el inicio del trecho.
export const kmDe = (t: Trecho) => (t.dificultades.length ? Math.min(...t.dificultades.map((d) => d.km ?? t.km)) : t.km)

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
  `${kmDe(t) < 0.3 ? 'Acá' : kmDe(t) < 1 ? `En ${Math.round(kmDe(t) * 10) * 100} metros` : `En ${Math.round(kmDe(t))} kilómetros`}${t.largo > 7 ? `, por ${Math.round(t.largo)} kilómetros` : ''}: ${t.dificultades.map((d) => d.titulo).join(', ')}.`
