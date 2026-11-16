import type { TipoDificultad } from './dificultades'
import type { Paso, Recorrido } from './navegacion'

// Consejos de manejo para el viaje. Son recomendaciones generales de seguridad vial, no indicaciones oficiales.

// Lo que hay que revisar antes de arrancar, sea cual sea el camino.
export const ANTES_DE_ARRANCAR = [
  { titulo: 'Cinturón abrochado', texto: 'Todos los que viajan, adelante y atrás. Los chicos, en su silla.' },
  { titulo: 'Luces bajas encendidas', texto: 'Son obligatorias en ruta, también de día.' },
  { titulo: 'Teléfono en el soporte', texto: 'No lo toques mientras manejás: activá los avisos por voz.' },
  { titulo: 'Combustible, agua y abrigo', texto: 'En la Quebrada y la Puna hay pocas estaciones de servicio y el tiempo cambia rápido.' },
]

// Lo que se suma en la lista de control de la portada, para repasar con tiempo antes de salir de casa.
export const ANTES_DE_SALIR = [
  { titulo: 'Mirá cómo está la ruta', texto: 'Revisá en el mapa los tramos de tu viaje y el pronóstico para la hora en que vas a pasar.' },
  { titulo: 'Avisá a alguien', texto: 'Contale a dónde vas y a qué hora pensás llegar: en la ruta hay trechos largos sin señal.' },
  { titulo: 'Descansado y sin alcohol', texto: 'Si estás cansado, no salgas. En viajes largos pará cada dos horas.' },
  { titulo: 'El vehículo en condiciones', texto: 'Frenos, luces, limpiaparabrisas y presión de las cubiertas, incluida la de auxilio.' },
  { titulo: 'Elementos de seguridad', texto: 'Balizas, matafuego con carga vigente, crique y llave de ruedas.' },
  { titulo: 'Papeles a mano', texto: 'Licencia, cédula del vehículo, seguro y revisión técnica al día.' },
]

export interface Guia {
  titulo: string
  // Version de una linea, para la tarjeta del tramo y los avisos por voz.
  corto: string
  pasos: string[]
}

const NIEBLA: Guia = {
  titulo: 'Con niebla',
  corto: 'Luces bajas, más distancia y sin balizas',
  pasos: ['Luces bajas y antiniebla; nunca las altas, que encandilan contra la niebla.', 'Bajá la velocidad y dejá el doble de distancia con el de adelante.', 'Guiate por la línea del borde derecho de la calzada.', 'No uses balizas mientras avanzás y no pares sobre la ruta: si no ves, salí bien afuera de la calzada.'],
}
const LLUVIA: Guia = {
  titulo: 'Con lluvia',
  corto: 'Bajá la velocidad y frená suave',
  pasos: ['Bajá la velocidad: sobre mojado el auto tarda mucho más en frenar.', 'Frená y doblá suave, sin movimientos bruscos.', 'Cuidado con el agua acumulada: el auto puede patinar.', 'No cruces un badén ni un arroyo con agua corriendo.'],
}
const HIELO: Guia = {
  titulo: 'Con hielo o nieve',
  corto: 'Muy despacio y sin frenar de golpe',
  pasos: ['Andá muy despacio y con maniobras suaves.', 'No frenes de golpe: soltá el acelerador y bajá un cambio.', 'En las sombras y los puentes el hielo dura más.', 'Si piden cadenas o hay restricción, respetala.'],
}
const VIENTO: Guia = {
  titulo: 'Con viento fuerte',
  corto: 'Las dos manos al volante',
  pasos: ['Sostené el volante con las dos manos y bajá la velocidad.', 'Cuidado al pasar o cruzarte con camiones: la ráfaga te mueve de golpe.'],
}
const OBSTACULO: Guia = {
  titulo: 'Con derrumbes, barro o agua en la calzada',
  corto: 'Despacio: no pases sobre piedras ni agua',
  pasos: ['Acercate despacio y fijate antes de pasar.', 'No pases por encima de piedras, barro profundo ni agua corriendo.', 'Si hay personal en el lugar, seguí sus indicaciones; si no se puede pasar, esperá o volvé.'],
}
const CUESTA: Guia = {
  titulo: 'En cuesta o camino de cornisa',
  corto: 'Freno motor y sin pasar en las curvas',
  pasos: ['En bajada usá el freno motor (un cambio bajo) y no vayas pisando el freno todo el tiempo.', 'No te adelantes en las curvas ni invadas la otra mano.', 'Tocá bocina antes de una curva sin visibilidad.', 'Si el camino es angosto, pasa primero el que sube.'],
}
const ALTURA: Guia = {
  titulo: 'En la altura',
  corto: 'Tomá agua y subí sin apuro',
  pasos: ['Por encima de los 3.000 m el cuerpo lo siente: subí sin apuro y tomá agua.', 'Si alguien tiene mucho dolor de cabeza o mareo, lo mejor es bajar.', 'El motor también pierde fuerza: calculá más espacio para pasar a otro vehículo.'],
}

const POR_TIPO: Partial<Record<TipoDificultad, Guia>> = {
  neblina: NIEBLA,
  lluvia: LLUVIA,
  tormenta: LLUVIA,
  hielo: HIELO,
  nevada: HIELO,
  viento: VIENTO,
  derrumbe: OBSTACULO,
  barro: OBSTACULO,
  crecida: OBSTACULO,
  riesgo: OBSTACULO,
}

const DESNIVEL_CUESTA_M = 200
const ALTURA_M = 3000

// Un tramo es de cuesta si entre el y el siguiente (o el anterior) hay un desnivel fuerte.
// Todas las guias, para mostrarlas juntas en la portada.
export const GUIAS: Guia[] = [NIEBLA, LLUVIA, HIELO, VIENTO, OBSTACULO, CUESTA, ALTURA]

export function esCuesta(pasos: Paso[], i: number) {
  const desnivel = (a?: Paso, b?: Paso) => (a && b && a.tramo.rutaId === b.tramo.rutaId ? Math.abs(a.tramo.altitud - b.tramo.altitud) : 0)
  return Math.max(desnivel(pasos[i - 1], pasos[i]), desnivel(pasos[i], pasos[i + 1])) >= DESNIVEL_CUESTA_M
}

export const consejoCorto = (tipo: TipoDificultad) => POR_TIPO[tipo]?.corto

// Consejo de una linea para el tramo que se esta recorriendo: por lo que pasa en el, o por el tipo de camino.
export function consejoDelTramo(recorrido: Recorrido) {
  const actual = recorrido.pasos[0]
  if (!actual) return null
  const porDificultad = actual.dificultades.map((d) => consejoCorto(d.tipo)).find(Boolean)
  return porDificultad ?? (esCuesta(recorrido.pasos, 0) ? CUESTA.corto : null)
}

export interface Consejo extends Guia {
  // Donde aplica en este viaje.
  donde: string
}

// Guias que aplican a este viaje, en el orden en que se las va a encontrar.
export function consejosDelViaje(recorrido: Recorrido): Consejo[] {
  const primero = new Map<Guia, Paso>()
  recorrido.pasos.forEach((p, i) => {
    const guias = [...p.dificultades.flatMap((d) => POR_TIPO[d.tipo] ?? []), ...(esCuesta(recorrido.pasos, i) ? [CUESTA] : []), ...(p.tramo.altitud >= ALTURA_M ? [ALTURA] : [])]
    for (const g of guias) if (!primero.has(g)) primero.set(g, p)
  })
  return [...primero].map(([guia, paso]) => ({ ...guia, donde: paso.km < 1 ? `Desde acá (${paso.tramo.nombre})` : `Desde ${paso.tramo.nombre}, en ${Math.round(paso.km)} km` }))
}
