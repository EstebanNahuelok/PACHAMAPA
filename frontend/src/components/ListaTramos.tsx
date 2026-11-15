import IconoClima from './IconoClima'
import { ESTADOS, altitud, grados } from '../lib/formato'
import type { Tramo } from '../lib/tipos'

interface Props {
  tramos: Tramo[]
  onSeleccionar: (id: string) => void
}

export default function ListaTramos({ tramos, onSeleccionar }: Props) {
  return (
    <ul className="divide-y divide-stone-200">
      {tramos.map((t) => {
        const estado = ESTADOS[t.estado]
        const reportes = t.reportes.reduce((total, r) => total + r.cantidad, 0)
        return (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onSeleccionar(t.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-100 active:bg-stone-200"
            >
              <span className="h-11 w-1.5 shrink-0 rounded-full" style={{ background: estado.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{t.nombre}</span>
                <span className="block truncate text-xs text-stone-500">
                  {altitud(t.altitud)} · {t.clima?.descripcion ?? 'Sin datos de clima'}
                </span>
                <span className={`block truncate text-xs font-semibold ${estado.texto}`}>
                  {[estado.etiqueta, ...t.motivos].join(' · ')}
                  {reportes > 0 && ` · ${reportes} ${reportes === 1 ? 'reporte' : 'reportes'}`}
                </span>
              </span>
              <IconoClima icono={t.clima?.icono} tamano={34} />
              <span className="w-10 text-right text-xl font-bold tabular-nums">{grados(t.clima?.temperatura)}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
