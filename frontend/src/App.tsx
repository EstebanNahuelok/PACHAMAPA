import { useCallback, useEffect, useRef, useState } from 'react'
import Mapa from './components/Mapa'
import ListaTramos from './components/ListaTramos'
import DetalleTramo from './components/DetalleTramo'
import { obtenerTramos } from './lib/api'
import { ESTADOS, hora } from './lib/formato'
import type { Estado, RespuestaTramos } from './lib/tipos'

const INTERVALO_MS = 2 * 60 * 1000

export default function App() {
  const [datos, setDatos] = useState<RespuestaTramos | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const panel = useRef<HTMLElement>(null)

  const cargar = useCallback(async () => {
    try {
      setDatos(await obtenerTramos())
      setError(null)
    } catch {
      setError('No se pudo conectar con el servidor. Reintentando…')
    }
  }, [])

  useEffect(() => {
    cargar()
    const id = setInterval(cargar, INTERVALO_MS)
    const alVolver = () => document.visibilityState === 'visible' && cargar()
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [cargar])

  const tramos = datos?.tramos ?? []
  const tramo = tramos.find((t) => t.id === seleccionado)
  const cuenta = (estado: Estado) => tramos.filter((t) => t.estado === estado).length

  const seleccionar = (id: string | null) => {
    setSeleccionado(id)
    panel.current?.scrollTo({ top: 0 })
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 bg-orange-800 px-3 text-white">
        <img src="/favicon.svg" alt="" className="h-7 w-7 rounded-md ring-1 ring-white/30" />
        <h1 className="text-lg font-bold tracking-tight">Pachamapa</h1>
        <span className="hidden text-sm text-orange-100 sm:inline">Clima y ruta en Jujuy, tramo por tramo</span>
        <span className="ml-auto text-xs text-orange-100">
          {datos?.actualizado ? `Actualizado ${hora(datos.actualizado)}` : 'Cargando…'}
        </span>
      </header>

      <main className="flex min-h-0 flex-1 flex-col md:flex-row-reverse">
        <div className="relative min-h-0 flex-1">
          <Mapa tramos={tramos} seleccionado={seleccionado} onSeleccionar={seleccionar} />
          <div className="pointer-events-none absolute left-2 top-2 z-[500] flex gap-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium shadow">
            {(['bien', 'atencion', 'problemas'] as const).map((e) => (
              <span key={e} className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: ESTADOS[e].color }} />
                {ESTADOS[e].etiqueta}
              </span>
            ))}
          </div>
        </div>

        <aside ref={panel} className="h-[44dvh] shrink-0 overflow-y-auto border-t border-stone-300 bg-white md:h-auto md:w-96 md:border-r md:border-t-0">
          {(error || datos?.error) && (
            <p className="bg-amber-100 px-4 py-2 text-sm text-amber-900">{error ?? 'El clima puede estar desactualizado.'}</p>
          )}
          {tramo ? (
            <DetalleTramo tramo={tramo} onVolver={() => seleccionar(null)} />
          ) : (
            <>
              <div className="flex items-baseline justify-between px-4 pb-1 pt-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-stone-600">Estado por tramo</h2>
                {datos && (
                  <span className="text-xs text-stone-500">
                    {cuenta('problemas')} con problemas · {cuenta('atencion')} con atención
                  </span>
                )}
              </div>
              {datos ? <ListaTramos tramos={tramos} onSeleccionar={seleccionar} /> : !error && <p className="px-4 py-6 text-sm text-stone-500">Consultando el clima de cada tramo…</p>}
            </>
          )}
        </aside>
      </main>
    </div>
  )
}
