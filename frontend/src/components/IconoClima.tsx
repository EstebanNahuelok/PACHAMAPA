import { svgClima } from '../lib/iconos'
import type { Icono } from '../lib/tipos'

export default function IconoClima({ icono, tamano = 28 }: { icono?: Icono; tamano?: number }) {
  return <span className="inline-flex shrink-0" dangerouslySetInnerHTML={{ __html: svgClima(icono, tamano) }} />
}
