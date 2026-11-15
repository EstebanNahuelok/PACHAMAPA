export type Estado = 'bien' | 'atencion' | 'problemas'

export type Icono =
  | 'sol'
  | 'luna'
  | 'parcial'
  | 'parcial-noche'
  | 'nublado'
  | 'neblina'
  | 'llovizna'
  | 'lluvia'
  | 'nieve'
  | 'tormenta'
  | 'viento'

export interface Clima {
  temperatura: number
  sensacion: number
  codigo: number
  nubosidad?: number
  visibilidad: number | null
  viento: number
  rafagas: number
  precipitacion: number
  lluvia: number
  nieve: number
  esDia: boolean
  medido: string
  descripcion: string
  icono: Icono
}

export type TipoReporte = 'neblina' | 'derrumbe' | 'corte' | 'crecida' | 'barro' | 'hielo' | 'nevada' | 'accidente' | 'bache' | 'obras' | 'fila'

export interface GrupoReportes {
  tipo: TipoReporte
  grave?: boolean
  cantidad: number
  confirmado: boolean
  ultimo: string
  comentarios: string[]
}

export interface Tramo {
  id: string
  nombre: string
  ruta: string
  rutaId: 'rn9' | 'rn52'
  kmInicio: number
  kmFin: number
  referencia: string
  localidad: string | null
  lat: number
  lon: number
  altitud: number
  clima: Clima | null
  estado: Estado
  motivos: string[]
  reportes: GrupoReportes[]
  estadoReportes: { estado: Estado; motivos: string[] }
  pronostico: Pronostico | null
  riesgo: Riesgo | null
  zonasCriticas: ZonaCritica[]
  restriccion: Restriccion | null
  historial: Historial | null
  estimado?: boolean
}

export interface RespuestaTramos {
  actualizado: string | null
  climaDisponible: boolean
  error: string | null
  parteOficial: ParteOficial
  temporada: { id: 'lluvias' | 'invierno'; nombre: string; detalle: string } | null
  alertas: Alerta[]
  tramos: Tramo[]
}

export interface HoraPronostico {
  hora: string
  temperatura: number | null
  icono: Icono
  descripcion: string
  probabilidad: number | null
  precipitacion: number
  visibilidad: number | null
  viento: number
  rafagas: number
  esDia: boolean
  estado: Estado
  motivos: string[]
}

export interface AvisoPronostico {
  estado: Estado
  desde: string
  hasta: string
  motivos: string[]
}

export interface Pronostico {
  horas: HoraPronostico[]
  aviso: AvisoPronostico | null
}

export type NivelRiesgo = 'bajo' | 'moderado' | 'alto'

export interface Riesgo {
  nivel: NivelRiesgo
  sensible: boolean
  lluvia24: number
  lluvia72: number
  prevista24: number
  pico: number
}

export interface ZonaCritica {
  tipo: 'alud' | 'crecida' | 'derrumbe' | 'hielo' | 'niebla'
  lugar: string
  detalle: string
  fuente: string | null
}

export interface Restriccion {
  tipo: TipoReporte
  confirmado: boolean
  mensaje: string
  alternativa: { descripcion: string; fuente: string } | null
}

export interface Historial {
  dias: number
  total: number
  porTipo: { tipo: TipoReporte; etiqueta: string; cantidad: number }[]
  franjaHabitual: string | null
}

export interface Alerta {
  id: string
  tramoId: string
  tramoIds: string[]
  tramo: string
  referencia: string | null
  clase: 'actual' | 'previsto' | 'riesgo' | 'restriccion' | 'reporte'
  nivel: Estado
  mensaje: string
  desde?: string
  hasta?: string
}

export interface ParteOficial {
  nombre: string
  url: string
  telefono: string
}
