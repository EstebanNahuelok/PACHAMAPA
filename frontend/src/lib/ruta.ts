import rutas from '../data/rutas.json'
import type { Tramo } from './tipos'

// Geometria de las rutas para el modo navegacion: ubica un punto sobre la RN 9 o la RN 52 y mide distancias
// por el camino (no en linea recta). La RN 52 nace en la RN 9, en el empalme de Purmamarca.
type Punto = [number, number]
export interface Posicion {
  ruta: 'rn9' | 'rn52'
  km: number
  desvio: number
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
  return { id: r.id as Posicion['ruta'], linea, km }
})

function sobre(ruta: (typeof LINEAS)[number], punto: Punto): Posicion {
  let mejor = 0
  let desvio = Infinity
  ruta.linea.forEach((p, i) => {
    const d = distanciaKm(p, punto)
    if (d < desvio) [mejor, desvio] = [i, d]
  })
  return { ruta: ruta.id, km: ruta.km[mejor], desvio }
}

// Punto de la ruta mas cercano a una coordenada, con cuanto se aparta de ella (desvio, en km).
export function ubicar(lat: number, lon: number): Posicion {
  return LINEAS.map((r) => sobre(r, [lat, lon])).reduce((a, b) => (b.desvio < a.desvio ? b : a))
}

const RN9 = LINEAS.find((r) => r.id === 'rn9')!
const RN52 = LINEAS.find((r) => r.id === 'rn52')!
const KM_EMPALME = sobre(RN9, RN52.linea[0]).km

// Distancia por ruta entre dos posiciones.
export function distanciaPorRuta(a: Posicion, b: Posicion) {
  if (a.ruta === b.ruta) return Math.abs(a.km - b.km)
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

// Coordenada y rumbo (en grados, 0 = norte) de un kilometro de la ruta, interpolando entre los puntos del trazado.
export function puntoEnRuta(rutaId: Posicion['ruta'], km: number, haciaAdelante = true) {
  const { linea, km: kms } = LINEAS.find((r) => r.id === rutaId)!
  const i = Math.max(1, Math.min(linea.length - 1, kms.findIndex((k) => k >= km)))
  const [a, b] = [linea[i - 1], linea[i]]
  const f = Math.max(0, Math.min(1, (km - kms[i - 1]) / (kms[i] - kms[i - 1] || 1)))
  const rumbo = (Math.atan2((b[1] - a[1]) * Math.cos(a[0] * RAD), b[0] - a[0]) / RAD + (haciaAdelante ? 360 : 180)) % 360
  return { lat: a[0] + (b[0] - a[0]) * f, lon: a[1] + (b[1] - a[1]) * f, rumbo }
}
