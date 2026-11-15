import type { TipoReporte } from './tipos'

export const TIPOS_REPORTE: { tipo: TipoReporte; etiqueta: string }[] = [
  { tipo: 'neblina', etiqueta: 'Neblina' },
  { tipo: 'corte', etiqueta: 'Corte de ruta' },
  { tipo: 'derrumbe', etiqueta: 'Derrumbe' },
  { tipo: 'hielo', etiqueta: 'Hielo' },
  { tipo: 'nevada', etiqueta: 'Nevada' },
  { tipo: 'accidente', etiqueta: 'Accidente' },
  { tipo: 'fila', etiqueta: 'Fila / demora' },
]

export const etiquetaReporte = (tipo: TipoReporte) => TIPOS_REPORTE.find((t) => t.tipo === tipo)?.etiqueta ?? tipo
