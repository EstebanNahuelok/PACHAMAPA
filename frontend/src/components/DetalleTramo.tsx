import IconoClima from './IconoClima'
import Pronostico from './Pronostico'
import IconoDificultad from './IconoDificultad'
import { dificultadesDe } from '../lib/dificultades'
import { ESTADOS, RIESGOS, altitud, grados, haceCuanto, hora, mm, rangoHoras, visibilidad } from '../lib/formato'
import { etiquetaReporte } from '../lib/reportes'
import type { ParteOficial, Tramo } from '../lib/tipos'

interface Props {
  tramo: Tramo
  parteOficial?: ParteOficial
  onVolver: () => void
  onReportar?: () => void
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="pm-tarjeta px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-stone-500">{titulo}</dt>
      <dd className="text-sm font-semibold">{valor}</dd>
    </div>
  )
}

const NIVEL = { bien: 0, atencion: 1, problemas: 2 }
const enlace = 'font-medium text-orange-800 underline'

export default function DetalleTramo({ tramo, parteOficial, onVolver, onReportar }: Props) {
  const { clima, pronostico, riesgo, restriccion, historial } = tramo
  const aviso = pronostico?.aviso
  const dificultades = dificultadesDe(tramo)
  const estado = ESTADOS[tramo.estado]
  return (
    <div className="p-4">
      <button type="button" onClick={onVolver} className="-ml-1 mb-2 text-sm font-medium text-orange-800 hover:underline">
        ‹ Todos los tramos
      </button>
      <div className="flex items-center gap-3">
        <IconoClima icono={clima?.icono} tamano={64} />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold leading-tight">{tramo.nombre}</h2>
          <p className="text-sm text-stone-500">
            {tramo.ruta}, {tramo.referencia} · {altitud(tramo.altitud)} de altura
          </p>
          <p className="text-sm">{clima?.descripcion ?? 'Sin datos de clima'}</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold tabular-nums leading-none">{grados(clima?.temperatura)}</div>
          {clima && !Number.isNaN(clima.sensacion) && clima.sensacion != null && !tramo.estimado && <div className="mt-1 text-xs text-stone-500">Sensación {grados(clima.sensacion)}</div>}
        </div>
      </div>

      <div className={`mt-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold ${estado.fondo} ${estado.texto}`}>
        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: estado.color }} />
        {[estado.etiqueta, ...tramo.motivos].join(' · ')}
      </div>

      {dificultades.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {dificultades.map((d) => (
            <li key={d.clave} className="flex items-start gap-2.5 pm-tarjeta px-3 py-2.5 text-sm">
              <IconoDificultad dificultad={d} />
              <span className="min-w-0">
                <span className="block font-semibold">{d.titulo}</span>
                <span className="block text-stone-600">{d.detalle}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {restriccion && (
        <div className="mt-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
          <p className="font-bold">{restriccion.mensaje}</p>
          <p className="mt-1">
            {restriccion.alternativa?.descripcion ?? 'No hay un desvío cargado para este tramo: esperá la habilitación antes de salir.'}
            {restriccion.alternativa && (
              <>
                {' '}
                <a href={restriccion.alternativa.fuente} target="_blank" rel="noreferrer" className={enlace}>Antecedente</a>
              </>
            )}
          </p>
          {parteOficial && (
            <p className="mt-1">
              Confirmá con el parte oficial:{' '}
              <a href={parteOficial.url} target="_blank" rel="noreferrer" className={enlace}>{parteOficial.nombre}</a> · {parteOficial.telefono}
            </p>
          )}
        </div>
      )}

      {aviso && NIVEL[aviso.estado] > NIVEL[tramo.estado] && (
        <div className={`mt-2 rounded-2xl px-3.5 py-2.5 text-sm ${ESTADOS[aviso.estado].fondo} ${ESTADOS[aviso.estado].texto}`}>
          <span className="font-bold">Se espera que empeore {rangoHoras(aviso.desde, aviso.hasta)}:</span> {aviso.motivos.join(' · ').toLowerCase()}
        </div>
      )}

      {clima && (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-2">
            <Dato titulo="Visibilidad" valor={visibilidad(clima.visibilidad)} />
            <Dato titulo="Viento" valor={`${Math.round(clima.viento)} km/h · ráfagas ${Math.round(clima.rafagas)}`} />
            <Dato titulo="Prob. de lluvia" valor={pronostico?.horas[0]?.probabilidad != null ? `${pronostico.horas[0].probabilidad} %` : 'Sin dato'} />
            <Dato titulo="Precipitación" valor={clima.nieve > 0 ? `Nieve ${clima.nieve} cm` : `${clima.precipitacion} mm`} />
          </dl>
          <p className="mt-2 text-xs text-stone-500">{tramo.estimado ? 'Estimado con el pronóstico para las' : 'Clima actualizado a las'} {hora(clima.medido)} · Open-Meteo</p>
        </>
      )}

      {pronostico && pronostico.horas.length > 0 && (
        <>
          <h3 className="mt-4 text-sm font-bold">Próximas {pronostico.horas.length} horas</h3>
          <Pronostico pronostico={pronostico} />
        </>
      )}

      {riesgo && (
        <>
          <h3 className="mt-3 text-sm font-bold">Riesgo de aludes y crecidas</h3>
          <div className={`mt-1 rounded-2xl px-3.5 py-2.5 text-sm ${RIESGOS[riesgo.nivel].clase}`}>
            <span className="font-bold">{RIESGOS[riesgo.nivel].etiqueta}</span> · llovió {mm(riesgo.lluvia24)} en 24 h y {mm(riesgo.lluvia72)} en 72 h · se esperan {mm(riesgo.prevista24)}
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Estimación orientativa según la lluvia{riesgo.sensible ? ' y los antecedentes del tramo' : ''}; no reemplaza al parte oficial.
          </p>
        </>
      )}

      {tramo.zonasCriticas.length > 0 && (
        <>
          <h3 className="mt-3 text-sm font-bold">Zonas críticas</h3>
          <ul className="mt-1 space-y-2">
            {tramo.zonasCriticas.map((z) => (
              <li key={z.lugar} className="pm-tarjeta px-3 py-2.5 text-sm">
                <span className="font-semibold">{z.lugar}</span>
                <span className="ml-2 rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-stone-700">{z.tipo}</span>
                <p className="mt-1 text-stone-600">
                  {z.detalle}{' '}
                  {z.fuente && <a href={z.fuente} target="_blank" rel="noreferrer" className={enlace}>Fuente</a>}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      {historial && (
        <p className="pm-tarjeta mt-3 px-3 py-2 text-sm text-stone-700">
          <span className="font-semibold">Últimos {historial.dias} días:</span>{' '}
          {historial.porTipo.map((t) => `${t.cantidad} de ${t.etiqueta.toLowerCase()}`).join(', ')}
          {historial.franjaHabitual && `, sobre todo a la ${historial.franjaHabitual}`}.
        </p>
      )}

      <h3 className="mt-4 text-sm font-bold">Reportes recientes</h3>
      {tramo.reportes.length === 0 ? (
        <p className="mt-1 text-sm text-stone-500">Nadie reportó nada en este tramo en las últimas horas.</p>
      ) : (
        <ul className="mt-1 space-y-2">
          {tramo.reportes.map((r) => (
            <li key={r.tipo} className="pm-tarjeta px-3 py-2.5 text-sm">
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
        <button type="button" onClick={onReportar} className="mt-4 w-full rounded-2xl bg-orange-700 px-4 py-3 font-semibold text-white active:bg-orange-800">
          Reportar en {tramo.nombre}
        </button>
      )}
    </div>
  )
}
