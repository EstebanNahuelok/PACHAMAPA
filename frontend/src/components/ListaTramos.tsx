import IconoClima from './IconoClima'
import IconoDificultad from './IconoDificultad'
import { dificultadesDe } from '../lib/dificultades'
import { ESTADOS, altitud, grados, rangoHoras, tieneAviso } from '../lib/formato'
import type { Tramo } from '../lib/tipos'

interface Props {
  tramos: Tramo[]
  onSeleccionar: (id: string) => void
}

export default function ListaTramos({ tramos, onSeleccionar }: Props) {
  return (
    <ul className="pm-tarjeta mx-3 divide-y divide-stone-200 overflow-hidden">
      {tramos.map((t) => {
        const estado = ESTADOS[t.estado]
        const reportes = t.reportes.reduce((total, r) => total + r.cantidad, 0)
        return (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onSeleccionar(t.id)}
              className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-stone-100 active:bg-stone-200"
            >
              <span className="h-10 w-1 shrink-0 rounded-full" style={{ background: estado.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{t.nombre}</span>
                <span className="block truncate text-xs text-stone-500">
                  {t.ruta} · {t.kmInicio}–{t.kmFin} km · {altitud(t.altitud)} · {t.clima?.descripcion ?? 'Sin datos de clima'}
                </span>
                <span className={`block truncate text-xs font-semibold ${estado.texto}`}>
                  {[estado.etiqueta, ...t.motivos].join(' · ')}
                  {reportes > 0 && ` · ${reportes} ${reportes === 1 ? 'reporte' : 'reportes'}`}
                </span>
                {tieneAviso(t) && (
                  <span className="block truncate text-xs font-semibold text-orange-800">
                    {t.restriccion ? t.restriccion.mensaje : t.pronostico?.aviso && t.riesgo?.nivel !== 'alto' ? `Empeora ${rangoHoras(t.pronostico.aviso.desde, t.pronostico.aviso.hasta)}` : 'Riesgo alto de aludes o crecidas'}
                  </span>
                )}
              </span>
              <span className="flex shrink-0 gap-1">
                {dificultadesDe(t).filter((d) => d.origen !== 'previsto').slice(0, 3).map((d) => (
                  <IconoDificultad key={d.clave} dificultad={d} tamano={22} />
                ))}
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
