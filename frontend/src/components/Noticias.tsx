import { useState } from 'react'
import { haceCuanto } from '../lib/formato'
import type { Noticia } from '../lib/tipos'

interface Props {
  noticias: Noticia[]
  titulo?: string
}

const VISIBLES = 3

// Lo que publican los diarios sobre la ruta. Cada nota lleva el nombre del medio y el enlace a la nota original.
export default function Noticias({ noticias, titulo = 'En los diarios' }: Props) {
  const [todas, setTodas] = useState(false)
  if (noticias.length === 0) return null
  return (
    <section aria-label={titulo} className="border-b border-stone-200 px-4 pb-3 pt-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-stone-600">
        {titulo} ({noticias.length})
      </h2>
      <ul className="mt-1.5 space-y-1.5">
        {(todas ? noticias : noticias.slice(0, VISIBLES)).map((n) => (
          <li key={n.id}>
            <a href={n.enlace} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm hover:bg-stone-100">
              <span className="flex flex-wrap items-center gap-x-1.5 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-bold ${n.resuelto ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{n.etiqueta}</span>
                {n.lugar && <span className="font-semibold text-stone-600">{n.lugar}</span>}
                <span className="text-stone-500">{haceCuanto(n.publicado)}</span>
              </span>
              <span className="mt-1 block font-semibold leading-snug">{n.titulo}</span>
              <span className="mt-1 block text-xs text-stone-500">
                Fuente: <span className="font-semibold text-orange-800 underline">{n.fuente}</span> ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
      {noticias.length > VISIBLES && (
        <button type="button" onClick={() => setTodas(!todas)} className="mt-2 text-sm font-medium text-orange-800 hover:underline">
          {todas ? 'Ver menos' : `Ver las ${noticias.length} noticias`}
        </button>
      )}
      <p className="mt-2 text-xs text-stone-500">Titulares de Google Noticias. No cambian el estado de los tramos.</p>
    </section>
  )
}
