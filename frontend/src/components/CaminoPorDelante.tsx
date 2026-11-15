import IconoClima from './IconoClima'
import IconoDificultad from './IconoDificultad'
import { ESTADOS, grados, hora } from '../lib/formato'
import { distancia } from '../lib/navegacion'
import type { Recorrido } from '../lib/navegacion'

const MAXIMO_ZONAS = 3
const horaDe = (ms: number) => hora(new Date(ms).toISOString())

// Lista del camino que queda: los tramos de 5 km seguidos con lo mismo (o sin nada) se muestran juntos.
export default function CaminoPorDelante({ recorrido }: { recorrido: Recorrido }) {
  return (
    <ol>
      {recorrido.trechos.map((t, i) => {
        const [primero] = t.pasos
        const zonas = [...new Map(t.pasos.flatMap((p) => p.tramo.zonasCriticas).map((z) => [z.lugar, z])).values()]
        return (
          <li key={primero.tramo.id} className="relative flex gap-3 pb-5 pl-1">
            {i < recorrido.trechos.length - 1 && <span className="absolute left-[12px] top-5 h-full w-1 rounded bg-stone-700" />}
            <span className="relative mt-1 h-5 w-5 shrink-0 rounded-full border-4 border-stone-900" style={{ background: ESTADOS[t.estado].color }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold leading-tight">{t.dificultades.length > 0 ? t.dificultades.map((d) => d.titulo).join(' · ') : 'Sin dificultades'}</span>
                <span className="ml-auto shrink-0 text-lg font-semibold tabular-nums">{distancia(t.km)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-1.5 text-sm text-stone-300">
                {t.dificultades.map((d) => (
                  <IconoDificultad key={d.clave} dificultad={d} tamano={22} />
                ))}
                <IconoClima icono={primero.icono} tamano={22} />
                <span className="font-semibold text-white">{grados(primero.temperatura)}</span>
                <span>
                  · por {Math.round(t.largo)} km · {t.km < 1 ? 'ahora' : `llegás ${horaDe(primero.llegada)}`}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-stone-400">
                {primero.tramo.ruta} km {primero.tramo.kmInicio}–{t.pasos.at(-1)!.tramo.kmFin}
                {t.localidades.length > 0 ? ` · pasás por ${t.localidades.join(', ')}` : ` · ${primero.tramo.nombre}`}
              </p>
              {zonas.slice(0, MAXIMO_ZONAS).map((z) => (
                <p key={z.lugar} className="mt-0.5 text-sm text-stone-400">
                  Zona crítica ({z.tipo}): {z.lugar}
                </p>
              ))}
              {zonas.length > MAXIMO_ZONAS && <p className="mt-0.5 text-sm text-stone-400">y {zonas.length - MAXIMO_ZONAS} zonas críticas más</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
