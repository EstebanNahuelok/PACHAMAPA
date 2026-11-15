import { useCallback, useEffect, useRef, useState } from 'react'
import Mapa from './components/Mapa'
import ListaTramos from './components/ListaTramos'
import DetalleTramo from './components/DetalleTramo'
import FormularioReporte from './components/FormularioReporte'
import ListaEspera from './components/ListaEspera'
import AlertasWhatsApp from './components/AlertasWhatsApp'
import { obtenerMetricas, obtenerTramos, registrarVisita } from './lib/api'
import type { Metricas, ReporteCreado } from './lib/api'
import { ESTADOS, hora } from './lib/formato'
import type { Estado, RespuestaTramos } from './lib/tipos'

const INTERVALO_MS = 2 * 60 * 1000
let visitaRegistrada = false

export default function App() {
  const [datos, setDatos] = useState<RespuestaTramos | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [reportando, setReportando] = useState(false)
  const [enListaEspera, setEnListaEspera] = useState(false)
  const [suscribiendo, setSuscribiendo] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const panel = useRef<HTMLElement>(null)

  const cargar = useCallback(async () => {
    try {
      setDatos(await obtenerTramos())
      setError(null)
      obtenerMetricas().then(setMetricas, () => {})
    } catch {
      setError('No se pudo conectar con el servidor. Reintentando…')
    }
  }, [])

  useEffect(() => {
    if (!visitaRegistrada) {
      visitaRegistrada = true
      registrarVisita().catch(() => {})
    }
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

  useEffect(() => {
    if (!aviso) return
    const id = setTimeout(() => setAviso(null), 5000)
    return () => clearTimeout(id)
  }, [aviso])

  const alEnviarReporte = (reporte: ReporteCreado) => {
    setReportando(false)
    seleccionar(reporte.tramoId)
    setAviso(`Gracias. ${reporte.etiqueta} en ${reporte.tramo}${reporte.confirmado ? ': ya quedó confirmado' : ': se confirma con otro reporte igual'}.`)
    cargar()
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

      <main className="flex min-h-0 flex-1 flex-col landscape:flex-row-reverse">
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
          {aviso && (
            <p role="status" className="absolute inset-x-2 top-12 z-[500] mx-auto max-w-md rounded-lg bg-stone-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg">{aviso}</p>
          )}
          <button
            type="button"
            onClick={() => setReportando(true)}
            disabled={!datos}
            className="absolute bottom-7 right-3 z-[500] flex items-center gap-1.5 rounded-full bg-orange-700 py-3 pl-4 pr-5 text-base font-bold text-white shadow-lg ring-2 ring-white active:bg-orange-800 disabled:opacity-60"
          >
            <span className="text-xl leading-none">+</span> Reportar
          </button>
        </div>

        <aside ref={panel} className="h-[40dvh] shrink-0 overflow-y-auto border-t border-stone-300 bg-white landscape:h-auto landscape:w-80 landscape:border-r landscape:border-t-0 landscape:lg:w-96">
          {(error || datos?.error) && (
            <p className="bg-amber-100 px-4 py-2 text-sm text-amber-900">{error ?? 'El clima puede estar desactualizado.'}</p>
          )}
          {tramo ? (
            <DetalleTramo tramo={tramo} onVolver={() => seleccionar(null)} onReportar={() => setReportando(true)} />
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
              <div className="m-4 rounded-xl bg-stone-100 p-4">
                <p className="text-sm font-bold">¿Trabajás en la ruta?</p>
                <p className="mt-0.5 text-sm text-stone-600">Alertas por tramo y horario para agencias, transportistas y guías.</p>
                <button type="button" onClick={() => setSuscribiendo(true)} disabled={!datos} className="mt-3 w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                  Recibir alertas por WhatsApp
                </button>
                <button type="button" onClick={() => setEnListaEspera(true)} className="mt-2 w-full rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white">
                  Sumarme a la lista de espera
                </button>
                {metricas && (
                  <p className="mt-3 text-center text-xs text-stone-500">
                    {metricas.visitas} visitas · {metricas.reportes} reportes de la gente · {metricas.suscriptores} con alertas · {metricas.listaEspera} en lista de espera
                  </p>
                )}
              </div>
            </>
          )}
        </aside>
      </main>

      {reportando && <FormularioReporte tramos={tramos} tramoInicial={seleccionado} onCerrar={() => setReportando(false)} onEnviado={alEnviarReporte} />}
      {suscribiendo && <AlertasWhatsApp tramos={tramos} tramoInicial={seleccionado} onCerrar={() => { setSuscribiendo(false); obtenerMetricas().then(setMetricas, () => {}) }} />}
      {enListaEspera && <ListaEspera onCerrar={() => { setEnListaEspera(false); obtenerMetricas().then(setMetricas, () => {}) }} />}
    </div>
  )
}
