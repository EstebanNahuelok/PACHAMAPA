import rutas from '../data/rutas.json'
import type { Tramo } from './tipos'

// Geometria de las rutas para el modo navegacion: ubica un punto sobre la RN 9 o la RN 52 y mide distancias
// por el camino (no en linea recta). La RN 52 nace en la RN 9, en el empalme de Purmamarca.
type Punto = [number, number]
export interface Posicion {
  ruta: string
  km: number
  desvio: number
  // Coordenada del punto de la ruta (cuando la posicion sale de ubicar).
  lat?: number
  lon?: number
}

const RAD = Math.PI / 180
function distanciaKm([lat1, lon1]: Punto, [lat2, lon2]: Punto) {
  const x = (lon2 - lon1) * RAD * Math.cos(((lat1 + lat2) / 2) * RAD)
  const y = (lat2 - lat1) * RAD
  return Math.hypot(x, y) * 6371
}

const LINEAS = rutas.map((r) => {
  const linea = r.linea as Punto[]
  const km = [0]
  for (let i = 1; i < linea.length; i++) km.push(km[i - 1] + distanciaKm(linea[i - 1], linea[i]))
  return { id: r.id, linea, km, prueba: 'prueba' in r && r.prueba === true }
})

function sobre(ruta: (typeof LINEAS)[number], punto: Punto): Posicion {
  let mejor = 0
  let desvio = Infinity
  ruta.linea.forEach((p, i) => {
    const d = distanciaKm(p, punto)
    if (d < desvio) [mejor, desvio] = [i, d]
  })
  return { ruta: ruta.id, km: ruta.km[mejor], desvio, lat: ruta.linea[mejor][0], lon: ruta.linea[mejor][1] }
}

// Punto de la ruta mas cercano a una coordenada, con cuanto se aparta de ella (desvio, en km).
// Las rutas de prueba de Salta solo cuentan en el modo TEST EN SALTA.
export function ubicar(lat: number, lon: number, conPrueba = false): Posicion {
  return LINEAS.filter((r) => conPrueba || !r.prueba).map((r) => sobre(r, [lat, lon])).reduce((a, b) => (b.desvio < a.desvio ? b : a))
}

const RN9 = LINEAS.find((r) => r.id === 'rn9')!
const RN52 = LINEAS.find((r) => r.id === 'rn52')!
const KM_EMPALME = sobre(RN9, RN52.linea[0]).km

// Distancia por ruta entre dos posiciones.
export function distanciaPorRuta(a: Posicion, b: Posicion) {
  if (a.ruta === b.ruta) return Math.abs(a.km - b.km)
  // Solo la RN 9 y la RN 52 estan unidas; las rutas de prueba de Salta no se conectan con nada.
  if (![a.ruta, b.ruta].every((r) => r === 'rn9' || r === 'rn52')) return Infinity
  const [en9, en52] = a.ruta === 'rn9' ? [a, b] : [b, a]
  return Math.abs(en9.km - KM_EMPALME) + en52.km
}

export interface Parada {
  tramo: Tramo
  km: number
}

// Tramos que quedan en el camino entre el origen y el destino, del mas cercano al mas lejano.
export function caminoPorDelante(tramos: Tramo[], origen: Posicion, destino: Posicion): Parada[] {
  const total = distanciaPorRuta(origen, destino)
  if (!Number.isFinite(total)) return []
  return tramos
    .map((tramo) => {
      const p: Posicion = { ruta: tramo.rutaId, km: (tramo.kmInicio + tramo.kmFin) / 2, desvio: 0 }
      return { tramo, km: distanciaPorRuta(origen, p), resto: distanciaPorRuta(p, destino) }
    })
    .filter((p) => p.km + p.resto <= total + 0.5)
    .sort((a, b) => a.km - b.km)
    .map(({ tramo, km }) => ({ tramo, km }))
}

export const MAXIMO_DESVIO_KM = 5

// Punto de la ruta elegido para un reporte: la coordenada sobre el trazado, su tramo y un texto para mostrar.
export interface PuntoElegido {
  lat: number
  lon: number
  tramoId: string
  texto: string
  ruta: string
  km: number
  // Donde termina, en los reportes con largo propio (obras, filas, cortes).
  fin?: { lat: number; lon: number; texto: string }
}

const MAXIMO_AL_TOCAR_KM = 1.5

// Lleva un toque en el mapa (o la posicion del GPS) al punto mas cercano de la ruta. Lejos de la ruta no hay reporte.
export function puntoSobreRuta(tramos: Tramo[], lat: number, lon: number): PuntoElegido | null {
  const p = ubicar(lat, lon, tramos.some((t) => t.prueba))
  const tramo = tramos.find((t) => t.rutaId === p.ruta && p.km >= t.kmInicio && p.km <= t.kmFin)
  if (p.desvio > MAXIMO_AL_TOCAR_KM || !tramo || p.lat == null || p.lon == null) return null
  return { lat: p.lat, lon: p.lon, tramoId: tramo.id, ruta: p.ruta, km: p.km, texto: `${tramo.nombre} · ${tramo.ruta}, km ${p.km.toFixed(1).replace('.', ',')}` }
}

const MEDIO_ANCHO_PUNTO_KM = 0.25

// Pedazo de ruta que ocupa un reporte: de su inicio a su fin, o unos cientos de metros alrededor si es un punto.
// Devuelve la linea para pintarlo y el lugar donde va el pictograma.
export function trechoDe(lugar: { lat: number; lon: number; fin?: { lat: number; lon: number } | null }, conPrueba = false) {
  const inicio = ubicar(lugar.lat, lugar.lon, conPrueba)
  const fin = lugar.fin ? ubicar(lugar.fin.lat, lugar.fin.lon, conPrueba) : null
  const { linea, km: kms } = LINEAS.find((r) => r.id === inicio.ruta)!
  const conFin = fin?.ruta === inicio.ruta && fin.km !== inicio.km
  const [desde, hasta] = conFin ? [Math.min(inicio.km, fin.km), Math.max(inicio.km, fin.km)] : [inicio.km - MEDIO_ANCHO_PUNTO_KM, inicio.km + MEDIO_ANCHO_PUNTO_KM]
  const [a, b] = [Math.max(0, desde), Math.min(kms.at(-1)!, hasta)]
  const punta = (km: number): Punto => {
    const p = puntoEnRuta(inicio.ruta, km)
    return [p.lat, p.lon]
  }
  return { linea: [punta(a), ...linea.filter((_, i) => kms[i] > a && kms[i] < b), punta(b)], centro: conFin ? punta((a + b) / 2) : ([lugar.lat, lugar.lon] as Punto), largoKm: conFin ? b - a : 0 }
}

// Coordenada y rumbo (en grados, 0 = norte) de un kilometro de la ruta, interpolando entre los puntos del trazado.
export function puntoEnRuta(rutaId: Posicion['ruta'], km: number, haciaAdelante = true) {
  const { linea, km: kms } = LINEAS.find((r) => r.id === rutaId)!
  const i = Math.max(1, Math.min(linea.length - 1, kms.findIndex((k) => k >= km)))
  const [a, b] = [linea[i - 1], linea[i]]
  const f = Math.max(0, Math.min(1, (km - kms[i - 1]) / (kms[i] - kms[i - 1] || 1)))
  const rumbo = (Math.atan2((b[1] - a[1]) * Math.cos(a[0] * RAD), b[0] - a[0]) / RAD + (haciaAdelante ? 360 : 180)) % 360
  return { lat: a[0] + (b[0] - a[0]) * f, lon: a[1] + (b[1] - a[1]) * f, rumbo }
}
