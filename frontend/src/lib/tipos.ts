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
  nubosidad: number
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

export type TipoReporte = 'neblina' | 'derrumbe' | 'corte' | 'hielo' | 'nevada' | 'accidente' | 'fila'

export interface GrupoReportes {
  tipo: TipoReporte
  cantidad: number
  confirmado: boolean
  ultimo: string
  comentarios: string[]
}

export interface Tramo {
  id: string
  nombre: string
  ruta: string
  lat: number
  lon: number
  altitud: number
  clima: Clima | null
  estado: Estado
  motivos: string[]
  reportes: GrupoReportes[]
}

export interface RespuestaTramos {
  actualizado: string | null
  climaDisponible: boolean
  error: string | null
  tramos: Tramo[]
}
