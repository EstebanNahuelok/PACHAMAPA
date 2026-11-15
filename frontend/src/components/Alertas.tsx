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
    <section aria-label="Alertas" className="border-b border-stone-200 px-4 pb-3 pt-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-stone-600">Alertas ({alertas.length})</h2>
      <ul className="mt-1.5 space-y-1.5">
        {(todas ? alertas : alertas.slice(0, VISIBLES)).map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => onSeleccionar(a.tramoId)}
              className={`flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm ${ESTADOS[a.nivel].fondo} ${ESTADOS[a.nivel].texto}`}
            >
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: ESTADOS[a.nivel].color }} />
              <span className="min-w-0">
                <span className="font-bold">{a.tramo}</span>
                {a.referencia && <span className="ml-1.5 text-xs opacity-80">{a.referencia}</span>}
                <span className="block">{textoAlerta(a)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {alertas.length > VISIBLES && (
        <button type="button" onClick={() => setTodas(!todas)} className="mt-2 text-sm font-medium text-orange-800 hover:underline">
          {todas ? 'Ver menos' : `Ver las ${alertas.length} alertas`}
        </button>
      )}
    </section>
  )
}
