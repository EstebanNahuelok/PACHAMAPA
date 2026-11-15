import { svgDificultad } from '../lib/iconosDificultad'
import { ESTADOS } from '../lib/formato'
import type { Dificultad } from '../lib/dificultades'

// Circulo de color con el pictograma. Lo previsto (todavia no pasa) va con borde punteado.
export default function IconoDificultad({ dificultad, tamano = 28 }: { dificultad: Dificultad; tamano?: number }) {
  const previsto = dificultad.origen === 'previsto'
  return (
    <span
      title={dificultad.titulo}
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: tamano, height: tamano, background: previsto ? '#57534e' : ESTADOS[dificultad.nivel].color, outline: previsto ? `2px dashed ${ESTADOS[dificultad.nivel].color}` : undefined, outlineOffset: previsto ? 1 : undefined }}
      dangerouslySetInnerHTML={{ __html: svgDificultad(dificultad.tipo, Math.round(tamano * 0.62)) }}
    />
  )
}
