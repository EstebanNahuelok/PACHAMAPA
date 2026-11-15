import { useState } from 'react'
import { ESTADOS, textoAlerta } from '../lib/formato'
import type { Alerta } from '../lib/tipos'

interface Props {
  alertas: Alerta[]
  onSeleccionar: (tramoId: string) => void
}

const VISIBLES = 3

export default function Alertas({ alertas, onSeleccionar }: Props) {
  const [todas, setTodas] = useState(false)
  if (alertas.length === 0) return null
  return (
    <section aria-label="Alertas" className="px-3 pb-2 pt-4">
      <h2 className="pm-titulo">
        Alertas <span className="pm-contador">{alertas.length}</span>
      </h2>
      <ul className="pm-tarjeta mt-2 divide-y divide-stone-200 overflow-hidden">
        {(todas ? alertas : alertas.slice(0, VISIBLES)).map((a) => (
          <li key={a.id}>
            <button type="button" onClick={() => onSeleccionar(a.tramoId)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-stone-100 active:bg-stone-200">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-white" style={{ background: ESTADOS[a.nivel].color }}>
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 8v5M12 16.5h.01M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0z" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-1.5">
                  <span className="truncate font-semibold">{a.tramo}</span>
                  {a.referencia && <span className="shrink-0 text-xs text-stone-500">{a.referencia}</span>}
                </span>
                <span className={`block leading-snug ${ESTADOS[a.nivel].texto}`}>{textoAlerta(a)}</span>
              </span>
              <span aria-hidden="true" className="pm-flecha">›</span>
            </button>
          </li>
        ))}
      </ul>
      {alertas.length > VISIBLES && (
        <button type="button" onClick={() => setTodas(!todas)} className="ml-1 mt-2 text-sm font-medium text-orange-800 hover:underline">
          {todas ? 'Ver menos' : `Ver las ${alertas.length} alertas`}
        </button>
      )}
    </section>
  )
}
