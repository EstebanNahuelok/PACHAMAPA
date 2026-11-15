import IconoClima from './IconoClima'
import { ESTADOS, altitud, grados, haceCuanto, hora, visibilidad } from '../lib/formato'
import { etiquetaReporte } from '../lib/reportes'
import type { Tramo } from '../lib/tipos'

interface Props {
  tramo: Tramo
  onVolver: () => void
  onReportar?: () => void
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg bg-stone-100 px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-stone-500">{titulo}</dt>
      <dd className="text-sm font-semibold">{valor}</dd>
    </div>
  )
}

export default function DetalleTramo({ tramo, onVolver, onReportar }: Props) {
  const { clima } = tramo
  const estado = ESTADOS[tramo.estado]
  return (
    <div className="p-4">
      <button type="button" onClick={onVolver} className="-ml-1 mb-2 text-sm font-medium text-orange-800 hover:underline">
        ‹ Todos los tramos
      </button>
      <div className="flex items-center gap-3">
        <IconoClima icono={clima?.icono} tamano={64} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold leading-tight">{tramo.nombre}</h2>
          <p className="text-sm text-stone-500">
            {tramo.ruta} · {altitud(tramo.altitud)} de altura
          </p>
          <p className="text-sm">{clima?.descripcion ?? 'Sin datos de clima'}</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold tabular-nums leading-none">{grados(clima?.temperatura)}</div>
          {clima && <div className="mt-1 text-xs text-stone-500">Sensación {grados(clima.sensacion)}</div>}
        </div>
      </div>

      <div className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${estado.fondo} ${estado.texto}`}>
        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: estado.color }} />
        {[estado.etiqueta, ...tramo.motivos].join(' · ')}
      </div>

      {clima && (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-2">
            <Dato titulo="Visibilidad" valor={visibilidad(clima.visibilidad)} />
            <Dato titulo="Viento" valor={`${Math.round(clima.viento)} km/h · ráfagas ${Math.round(clima.rafagas)}`} />
            <Dato titulo="Nubosidad" valor={`${Math.round(clima.nubosidad)} %`} />
            <Dato titulo="Precipitación" valor={clima.nieve > 0 ? `Nieve ${clima.nieve} cm` : `${clima.precipitacion} mm`} />
          </dl>
          <p className="mt-2 text-xs text-stone-500">Clima actualizado a las {hora(clima.medido)} · Open-Meteo</p>
        </>
      )}

      <h3 className="mt-4 text-sm font-bold">Reportes recientes</h3>
      {tramo.reportes.length === 0 ? (
        <p className="mt-1 text-sm text-stone-500">Nadie reportó nada en este tramo en las últimas horas.</p>
      ) : (
        <ul className="mt-1 space-y-2">
          {tramo.reportes.map((r) => (
            <li key={r.tipo} className="rounded-lg border border-stone-200 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center gap-x-2">
                <span className="font-semibold">{etiquetaReporte(r.tipo)}</span>
                {r.confirmado && <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Confirmado</span>}
                <span className="text-xs text-stone-500">
                  {r.cantidad} {r.cantidad === 1 ? 'reporte' : 'reportes'} · {haceCuanto(r.ultimo)}
                </span>
              </div>
              {r.comentarios.map((c, i) => (
                <p key={i} className="mt-1 text-stone-600">“{c}”</p>
              ))}
            </li>
          ))}
        </ul>
      )}

      {onReportar && (
        <button type="button" onClick={onReportar} className="mt-4 w-full rounded-lg bg-orange-700 px-4 py-3 font-semibold text-white active:bg-orange-800">
          Reportar en {tramo.nombre}
        </button>
      )}
    </div>
  )
}
