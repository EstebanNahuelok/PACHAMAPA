import type { TipoReporte } from './tipos'

export const TIPOS_REPORTE: { tipo: TipoReporte; etiqueta: string }[] = [
  { tipo: 'neblina', etiqueta: 'Neblina' },
  { tipo: 'corte', etiqueta: 'Corte de ruta' },
  { tipo: 'derrumbe', etiqueta: 'Derrumbe' },
  { tipo: 'crecida', etiqueta: 'Crecida o agua en la ruta' },
  { tipo: 'barro', etiqueta: 'Barro o piedras' },
  { tipo: 'hielo', etiqueta: 'Hielo' },
  { tipo: 'nevada', etiqueta: 'Nevada' },
  { tipo: 'accidente', etiqueta: 'Accidente' },
  { tipo: 'bache', etiqueta: 'Baches' },
  { tipo: 'obras', etiqueta: 'Obras o desvío' },
  { tipo: 'fila', etiqueta: 'Fila / demora' },
]

// Hechos que ocupan un trecho de la ruta: se puede marcar donde empiezan y donde terminan.
export const CON_LARGO: TipoReporte[] = ['corte', 'obras', 'fila']

export const etiquetaReporte = (tipo: TipoReporte) => TIPOS_REPORTE.find((t) => t.tipo === tipo)?.etiqueta ?? tipo
