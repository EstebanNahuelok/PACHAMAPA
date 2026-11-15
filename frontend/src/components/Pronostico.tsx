import IconoClima from './IconoClima'
import { ESTADOS, grados, hora } from '../lib/formato'
import type { Pronostico as DatosPronostico } from '../lib/tipos'

export default function Pronostico({ pronostico }: { pronostico: DatosPronostico }) {
  return (
    <ol className="mt-1 flex gap-1 overflow-x-auto pb-2">
      {pronostico.horas.map((h) => (
        <li
          key={h.hora}
          title={[h.descripcion, ...h.motivos].join(' · ')}
          className={`flex w-12 shrink-0 flex-col items-center rounded-lg px-1 py-1.5 text-xs ${h.estado === 'bien' ? 'bg-stone-100' : ESTADOS[h.estado].fondo}`}
        >
          <span className="text-stone-500">{hora(h.hora).slice(0, 2)} h</span>
          <IconoClima icono={h.icono} tamano={24} />
          <span className="font-bold tabular-nums">{grados(h.temperatura)}</span>
          <span className="mt-1 h-1.5 w-6 rounded-full" style={{ background: ESTADOS[h.estado].color }} />
          <span className="mt-0.5 text-[10px] text-blue-700">{h.probabilidad ? `${h.probabilidad}%` : '\u00a0'}</span>
        </li>
      ))}
    </ol>
  )
}
