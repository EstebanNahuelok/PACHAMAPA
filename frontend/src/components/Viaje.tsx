import { useEffect, useMemo, useRef, useState } from 'react'
import MapaViaje from './MapaViaje'
import IconoClima from './IconoClima'
import { ESTADOS, hora } from '../lib/formato'
import { decir } from '../lib/navegacion'
import { acumulado, buscarLugares, detalleDe, duracionDe, guardarReciente, leerRecientes, metros, obtenerProvincias, pedirViaje, puntoEnCamino, ubicarEnCamino } from '../lib/viaje'
import type { Indicacion, Lugar, TramoViaje, Viaje as DatosViaje } from '../lib/viaje'

interface Props {
  sinSenal: boolean
  onCerrar: () => void
  onEmergencia: () => void
  // La navegacion por tramos de 5 km de la Quebrada, con reportes de la gente.
  onQuebrada: () => void
}

type Etapa = 'planear' | 'ver' | 'navegando'
interface Posicion {
  lat: number
  lon: number
  rumbo: number | null
  velocidad: number | null
}

const MI_UBICACION: Lugar = { id: 'gps', tipo: 'gps', nombre: 'Mi ubicación', municipio: null, departamento: null, provincia: null, lat: 0, lon: 0 }
const DESVIO_PARA_RECALCULAR_KM = 0.15
const ESPERA_RECALCULO_MS = 20000
const PASO_SIMULACION_KM = 0.06
const horaDe = (ms: number) => hora(new Date(ms).toISOString())
const redondo = 'flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg ring-1 ring-white/20 disabled:opacity-50'

const GIRO: Record<string, number> = { derecho: 0, 'slight-right': 45, right: 90, 'sharp-right': 135, 'slight-left': -45, left: -90, 'sharp-left': -135 }

// Flecha de la maniobra, como la de un navegador.
export function Flecha({ tipo, tamano = 44 }: { tipo: string; tamano?: number }) {
  const props = { viewBox: '0 0 24 24', width: tamano, height: tamano, fill: 'none', stroke: 'currentColor', strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (tipo === 'llegada') return <svg {...props}><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z" /><circle cx="12" cy="10" r="2.2" /></svg>
  if (tipo === 'rotonda') return <svg {...props}><circle cx="12" cy="14" r="4" /><path d="M12 10V3M8.5 6.5L12 3l3.5 3.5M12 18v3" /></svg>
  if (tipo === 'u') return <svg {...props}><path d="M8 21V10a4 4 0 0 1 8 0v4M12 11l4 4 4-4" /></svg>
  return (
    <svg {...props} style={{ transform: `rotate(${GIRO[tipo] ?? 0}deg)` }}>
      <path d="M12 21V5M6 11l6-6 6 6" />
    </svg>
  )
}

function Buscador({ titulo, conUbicacion, onElegir, onVolver }: { titulo: string; conUbicacion: boolean; onElegir: (l: Lugar) => void; onVolver: () => void }) {
  const [provincias, setProvincias] = useState<Lugar[]>([])
  const [provincia, setProvincia] = useState('')
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState<Lugar[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recientes = useMemo(() => leerRecientes(), [])

  useEffect(() => {
    obtenerProvincias().then(setProvincias, () => setError('No pudimos cargar las provincias. Revisá la conexión.'))
  }, [])

  useEffect(() => {
    const q = texto.trim()
    if (q.length < 2 && !provincia) return
    const id = setTimeout(() => {
      buscarLugares(q.length >= 2 ? q : '', provincia).then(
        (r) => {
          setResultados(r)
          setError(null)
        },
        () => setError('No pudimos buscar lugares. Revisá la conexión.'),
      )
    }, 300)
    return () => clearTimeout(id)
  }, [texto, provincia])

  const elegirProvincia = provincias.find((p) => p.nombre === provincia)
  const lista = texto.trim().length >= 2 || provincia ? resultados : null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-stone-700 px-3 py-2">
        <button type="button" onClick={onVolver} aria-label="Volver" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-700 text-xl">←</button>
        <h2 className="text-lg font-bold">{titulo}</h2>
      </header>
      <div className="shrink-0 space-y-2 px-3 py-3">
        <input autoFocus value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ciudad, pueblo o municipio" aria-label="Buscar lugar" className="w-full rounded-xl border border-stone-600 bg-stone-800 px-4 py-3 text-lg text-white placeholder:text-stone-400" />
        <select value={provincia} onChange={(e) => setProvincia(e.target.value)} aria-label="Provincia" className="w-full rounded-xl border border-stone-600 bg-stone-800 px-3 py-2.5 text-base text-white">
          <option value="">Todas las provincias</option>
          {provincias.map((p) => (
            <option key={p.id} value={p.nombre}>{p.nombre}</option>
          ))}
        </select>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {error && <li className="px-1 py-2 text-sm text-amber-300">{error}</li>}
        {conUbicacion && !lista && (
          <li>
            <button type="button" onClick={() => onElegir(MI_UBICACION)} className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-stone-800">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600">◎</span>
              <span className="text-base font-semibold">Mi ubicación</span>
            </button>
          </li>
        )}
        {elegirProvincia && !texto.trim() && (
          <li>
            <button type="button" onClick={() => onElegir(elegirProvincia)} className="w-full rounded-xl px-2 py-3 text-left text-base font-semibold text-emerald-400 hover:bg-stone-800">
              Toda la provincia de {elegirProvincia.nombre} (al centro)
            </button>
          </li>
        )}
        {!lista && recientes.length > 0 && <li className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Recientes</li>}
        {(lista ?? recientes).map((l) => (
          <li key={l.id}>
            <button type="button" onClick={() => onElegir(l)} className="flex w-full flex-col rounded-xl px-2 py-2.5 text-left hover:bg-stone-800">
              <span className="text-base font-semibold">{l.nombre}</span>
              <span className="text-sm text-stone-400">{[l.tipo === 'municipio' ? 'Municipio' : null, detalleDe(l)].filter(Boolean).join(' · ')}</span>
            </button>
          </li>
        ))}
        {lista && lista.length === 0 && <li className="px-2 py-3 text-sm text-stone-400">No encontramos ese lugar. Probá con otro nombre o elegí la provincia.</li>}
      </ul>
    </div>
  )
}

function ResumenClima({ tramos }: { tramos: TramoViaje[] }) {
  const malos = tramos.filter((t) => t.estado !== 'bien')
  if (malos.length === 0) return <p className="flex items-center gap-2 text-base font-semibold text-emerald-400"><span className="h-3 w-3 rounded-full bg-emerald-400" />Sin problemas de clima previstos en el camino</p>
  return (
    <ul className="space-y-1.5">
      {malos.slice(0, 6).map((t) => (
        <li key={t.kmInicio} className="flex items-center gap-2 text-sm">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: ESTADOS[t.estado].color }} />
          {t.clima && <IconoClima icono={t.clima.icono} tamano={24} />}
          <span className="min-w-0 flex-1">
            <span className="font-semibold">{t.motivos.join(', ')}</span>
            <span className="block text-xs text-stone-400">km {Math.round(t.kmInicio)}–{Math.round(t.kmFin)} · pasás a las {hora(t.llegada)}</span>
          </span>
        </li>
      ))}
      {malos.length > 6 && <li className="text-xs text-stone-400">y {malos.length - 6} tramos más con avisos</li>}
    </ul>
  )
}

function ListaIndicaciones({ indicaciones, desdeKm = 0 }: { indicaciones: Indicacion[]; desdeKm?: number }) {
  return (
    <ol className="divide-y divide-stone-800">
      {indicaciones.filter((i) => i.km >= desdeKm - 0.01).map((i, n) => (
        <li key={`${i.km}-${n}`} className="flex items-center gap-3 py-2.5">
          <span className="shrink-0 text-stone-300"><Flecha tipo={i.flecha} tamano={28} /></span>
          <span className="min-w-0 flex-1 text-base leading-tight">{i.texto}</span>
          <span className="shrink-0 text-sm tabular-nums text-stone-400">{i.distancia > 0 ? metros(i.distancia / 1000) : ''}</span>
        </li>
      ))}
    </ol>
  )
}

export default function Viaje({ sinSenal, onCerrar, onEmergencia, onQuebrada }: Props) {
  const [etapa, setEtapa] = useState<Etapa>('planear')
  const [desde, setDesde] = useState<Lugar>(MI_UBICACION)
  const [hasta, setHasta] = useState<Lugar | null>(null)
  const [buscando, setBuscando] = useState<'desde' | 'hasta' | null>('hasta')
  const [viaje, setViaje] = useState<DatosViaje | null>(null)
  const [calculando, setCalculando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gps, setGps] = useState<Posicion | null>(null)
  const [errorGps, setErrorGps] = useState<string | null>(null)
  const [simulando, setSimulando] = useState(false)
  const [kmSimulado, setKmSimulado] = useState(0)
  const [siguiendo, setSiguiendo] = useState(true)
  const [voz, setVoz] = useState(true)
  const [verIndicaciones, setVerIndicaciones] = useState(false)
  const [ahora, setAhora] = useState(() => Date.now())
  const avisados = useRef(new Set<string>())
  const fueraDeCamino = useRef(0)
  const ultimoRecalculo = useRef(0)
  const ultimoIndice = useRef(0)

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 15000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setGps({ lat: coords.latitude, lon: coords.longitude, velocidad: coords.speed == null ? null : coords.speed * 3.6, rumbo: coords.heading == null || Number.isNaN(coords.heading) ? null : coords.heading })
        setErrorGps(null)
      },
      () => setErrorGps('No pudimos obtener tu ubicación. Elegí desde dónde salís.'),
      { enableHighAccuracy: true, maximumAge: 5000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  useEffect(() => {
    if (etapa !== 'navegando') return
    let bloqueo: WakeLockSentinel | undefined
    navigator.wakeLock?.request('screen').then(
      (b) => (bloqueo = b),
      () => {},
    )
    return () => void bloqueo?.release()
  }, [etapa])

  const km = useMemo(() => (viaje ? acumulado(viaje.linea) : []), [viaje])

  const calcular = (de: { lat: number; lon: number }, a: Lugar, alRecalcular = false) => {
    setCalculando(true)
    setError(null)
    pedirViaje(de, a)
      .then((v) => {
        setViaje(v)
        ultimoIndice.current = 0
        if (!alRecalcular) setEtapa('ver')
      })
      .catch((err: Error) => setError(sinSenal ? 'Sin conexión no se puede calcular un viaje nuevo.' : err.message))
      .finally(() => setCalculando(false))
  }

  const elegir = (l: Lugar) => {
    guardarReciente(l)
    const [nuevoDesde, nuevoHasta] = buscando === 'desde' ? [l, hasta] : [desde, l]
    if (buscando === 'desde') setDesde(l)
    else setHasta(l)
    setBuscando(null)
    const de = nuevoDesde.tipo === 'gps' ? gps : nuevoDesde
    if (de && nuevoHasta) calcular(de, nuevoHasta)
  }

  // Si el destino se eligio antes de tener GPS, se calcula apenas llega la ubicacion.
  useEffect(() => {
    if (etapa === 'planear' && !viaje && !calculando && !buscando && hasta && desde.tipo === 'gps' && gps && !error) calcular(gps, hasta)
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [gps, hasta, buscando])

  // Simulacion: recorre el camino sin moverse, para probarlo o mostrarlo.
  useEffect(() => {
    if (!simulando || etapa !== 'navegando') return
    const id = setInterval(() => setKmSimulado((k) => k + PASO_SIMULACION_KM), 200)
    return () => clearInterval(id)
  }, [simulando, etapa])

  const posicion = useMemo((): Posicion | null => {
    if (etapa !== 'navegando' || !viaje) return gps
    if (simulando) return { ...puntoEnCamino(viaje.linea, km, Math.min(kmSimulado, viaje.total)), velocidad: 90 }
    return gps
  }, [etapa, viaje, simulando, km, kmSimulado, gps])

  const enCamino = useMemo(() => {
    if (!viaje || !posicion || etapa !== 'navegando') return null
    const lugar = ubicarEnCamino(viaje.linea, km, [posicion.lat, posicion.lon], ultimoIndice.current)
    return lugar
  }, [viaje, km, posicion, etapa])

  useEffect(() => {
    if (enCamino) ultimoIndice.current = enCamino.i
  }, [enCamino])

  // Fuera del camino por varios avisos seguidos del GPS: se recalcula desde donde se esta.
  useEffect(() => {
    if (!enCamino || simulando || !hasta || !gps) return
    fueraDeCamino.current = enCamino.desvio > DESVIO_PARA_RECALCULAR_KM ? fueraDeCamino.current + 1 : 0
    if (fueraDeCamino.current >= 3 && Date.now() - ultimoRecalculo.current > ESPERA_RECALCULO_MS && !sinSenal) {
      ultimoRecalculo.current = Date.now()
      fueraDeCamino.current = 0
      if (voz) decir('Recalculando.')
      calcular(gps, hasta, true)
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [enCamino])

  const kmActual = enCamino?.km ?? 0
  const proxima = viaje?.indicaciones.find((i) => i.km > kmActual + 0.005 && i.flecha !== undefined && i !== viaje.indicaciones[0])
  const luego = proxima && viaje?.indicaciones[viaje.indicaciones.indexOf(proxima) + 1]
  const aProxima = proxima ? proxima.km - kmActual : 0
  const restante = viaje ? Math.max(0, viaje.total - kmActual) : 0
  const velocidadMedia = viaje ? viaje.total / (viaje.duracion / 3600 || 1) : 60
  const llegada = ahora + (restante / velocidadMedia) * 3600000
  const llegaste = etapa === 'navegando' && viaje != null && restante < 0.05
  const climaAdelante = viaje?.tramos.find((t) => t.kmFin > kmActual && t.estado !== 'bien' && t.kmInicio - kmActual < 30)

  // Avisos por voz: cada maniobra a 500 m y al llegar, y el clima complicado a 5 km.
  useEffect(() => {
    if (!voz || etapa !== 'navegando' || !proxima) return
    const clave = (n: string) => `${proxima.km}:${n}`
    if (aProxima <= 0.08 && !avisados.current.has(clave('ya'))) {
      avisados.current.add(clave('ya'))
      avisados.current.add(clave('antes'))
      decir(proxima.texto)
    } else if (aProxima <= 0.5 && !avisados.current.has(clave('antes'))) {
      avisados.current.add(clave('antes'))
      decir(`En ${metros(aProxima).replace(' m', ' metros').replace(' km', ' kilómetros')}, ${proxima.texto.charAt(0).toLowerCase()}${proxima.texto.slice(1)}`)
    }
  }, [voz, etapa, proxima, aProxima])
  useEffect(() => {
    if (!voz || etapa !== 'navegando' || !climaAdelante) return
    const clave = `clima:${climaAdelante.kmInicio}`
    if (climaAdelante.kmInicio - kmActual <= 5 && !avisados.current.has(clave)) {
      avisados.current.add(clave)
      decir(`Atención: ${climaAdelante.motivos.join(', ')} en el camino.`)
    }
  }, [voz, etapa, climaAdelante, kmActual])

  const iniciar = (simular: boolean) => {
    setSimulando(simular)
    setKmSimulado(0)
    setSiguiendo(true)
    avisados.current.clear()
    setEtapa('navegando')
    if (voz && viaje) decir(viaje.indicaciones[0]?.texto ?? 'Arrancamos.')
  }

  const invertir = () => {
    if (!hasta || desde.tipo === 'gps') return
    setDesde(hasta)
    setHasta(desde)
    calcular(hasta, desde)
  }

  const noche = new Date(ahora).getHours() < 7 || new Date(ahora).getHours() >= 20

  const resumen = viaje && (
    <p className="text-sm text-stone-300">
      <span className="text-2xl font-bold tabular-nums text-emerald-400">{duracionDe(viaje.duracion)}</span> · {metros(viaje.total)} · llegás a las {horaDe(Date.now() + viaje.duracion * 1000)}
    </p>
  )

  return (
    <div className="pm-fijo fixed inset-0 z-[1100] overflow-hidden bg-stone-950 text-white">
      <MapaViaje viaje={viaje} posicion={posicion} navegando={etapa === 'navegando'} siguiendo={siguiendo} noche={noche} onMover={() => setSiguiendo(false)} />

      {etapa === 'planear' && (
        <div className="pm-nav-hoja absolute inset-0 z-[700] flex flex-col bg-stone-900">
          {buscando ? (
            <Buscador titulo={buscando === 'desde' ? '¿Desde dónde salís?' : '¿A dónde vamos?'} conUbicacion={buscando === 'desde'} onElegir={elegir} onVolver={() => (hasta || buscando === 'desde' ? setBuscando(null) : onCerrar())} />
          ) : (
            <>
              <header className="flex shrink-0 items-center gap-2 border-b border-stone-700 px-3 py-2">
                <button type="button" onClick={onCerrar} aria-label="Volver al mapa" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-700 text-xl">←</button>
                <h2 className="text-lg font-bold">Planear un viaje</h2>
              </header>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
                <div className="flex items-stretch gap-2">
                  <div className="min-w-0 flex-1 space-y-2">
                    <button type="button" onClick={() => setBuscando('desde')} className="flex w-full flex-col rounded-xl bg-stone-800 px-4 py-2.5 text-left">
                      <span className="text-xs text-stone-400">Desde</span>
                      <span className="truncate text-base font-semibold">{desde.nombre}</span>
                    </button>
                    <button type="button" onClick={() => setBuscando('hasta')} className="flex w-full flex-col rounded-xl bg-stone-800 px-4 py-2.5 text-left">
                      <span className="text-xs text-stone-400">Hasta</span>
                      <span className="truncate text-base font-semibold">{hasta ? hasta.nombre : 'Elegí el destino'}</span>
                    </button>
                  </div>
                  <button type="button" onClick={invertir} disabled={!hasta || desde.tipo === 'gps'} aria-label="Invertir origen y destino" className="w-12 shrink-0 rounded-xl bg-stone-800 text-xl disabled:opacity-40">⇅</button>
                </div>
                {calculando && <p className="text-base text-stone-300">Calculando el camino y el clima…</p>}
                {desde.tipo === 'gps' && !gps && hasta && <p className="text-base text-stone-300">{errorGps ?? 'Buscando tu ubicación…'}</p>}
                {error && <p className="rounded-xl bg-red-900/60 px-3 py-2 text-base">{error}</p>}
                <button type="button" onClick={onQuebrada} className="block w-full rounded-xl border border-stone-700 px-4 py-3 text-left">
                  <span className="block text-base font-semibold">Quebrada de Humahuaca, tramo por tramo</span>
                  <span className="block text-sm text-stone-400">RN 9 y RN 52 en tramos de 5 km, con reportes de la gente y la demo.</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {etapa === 'ver' && viaje && hasta && (
        <div className="absolute inset-x-0 bottom-0 z-[600] flex max-h-[60dvh] flex-col rounded-t-2xl bg-stone-900 shadow-[0_-4px_16px_rgb(0_0_0/0.4)] lg:bottom-4 lg:left-4 lg:right-auto lg:top-4 lg:max-h-none lg:w-[27rem] lg:rounded-2xl">
          <div className="shrink-0 space-y-1 px-4 pt-3">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-bold">Hacia {hasta.nombre}</h2>
                <p className="truncate text-sm text-stone-400">Desde {desde.nombre}{detalleDe(hasta) ? ` · ${detalleDe(hasta)}` : ''}</p>
              </div>
              <button type="button" onClick={() => setEtapa('planear')} className="shrink-0 rounded-full bg-stone-700 px-4 py-2 text-sm font-semibold">Cambiar</button>
            </div>
            {resumen}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Clima en el camino, a la hora en que pasás</h3>
            {viaje.errorClima ? <p className="text-sm text-amber-300">No pudimos consultar el clima del camino.</p> : <ResumenClima tramos={viaje.tramos} />}
            <h3 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-stone-400">Indicaciones</h3>
            <ListaIndicaciones indicaciones={viaje.indicaciones} />
          </div>
          <div className="flex shrink-0 gap-2 border-t border-stone-700 px-4 pb-4 pt-3">
            <button type="button" onClick={() => iniciar(true)} className="rounded-xl bg-stone-700 px-4 py-4 text-base font-semibold">Simular</button>
            <button type="button" onClick={() => iniciar(false)} disabled={!gps} className="flex-1 rounded-xl bg-emerald-600 py-4 text-xl font-bold disabled:opacity-50">{gps ? 'Iniciar' : 'Esperando el GPS…'}</button>
          </div>
        </div>
      )}

      {etapa === 'navegando' && viaje && (
        <>
          <div className="pm-nav-ui absolute inset-x-2 top-2 z-[500] space-y-1.5 lg:left-4 lg:right-auto lg:top-4 lg:w-[27rem]">
            {llegaste ? (
              <section className="flex items-center gap-3 rounded-2xl bg-emerald-700 px-4 py-3 shadow-xl">
                <Flecha tipo="llegada" />
                <p className="text-2xl font-bold">Llegaste a {hasta?.nombre}</p>
              </section>
            ) : (
              proxima && (
                <section aria-live="polite" className="rounded-2xl bg-emerald-800 px-4 py-3 shadow-xl">
                  <div className="flex items-center gap-3">
                    <Flecha tipo={proxima.flecha} tamano={52} />
                    <div className="min-w-0 flex-1">
                      <p className="text-3xl font-bold tabular-nums leading-none">{metros(aProxima)}</p>
                      <p className="mt-1 text-lg font-semibold leading-tight">{proxima.texto}</p>
                    </div>
                  </div>
                  {luego && <p className="mt-2 flex items-center gap-2 border-t border-white/20 pt-2 text-sm text-emerald-100"><span>Luego</span><Flecha tipo={luego.flecha} tamano={20} /><span className="min-w-0 truncate">{luego.texto}</span></p>}
                </section>
              )
            )}
            {calculando && <p className="rounded-xl bg-stone-900/95 px-3 py-2 text-base font-semibold">Recalculando…</p>}
            {climaAdelante && !llegaste && (
              <p className="flex items-center gap-2 rounded-xl px-3 py-2 text-base font-semibold shadow-lg" style={{ background: climaAdelante.estado === 'problemas' ? '#b91c1c' : '#b45309' }}>
                {climaAdelante.clima && <IconoClima icono={climaAdelante.clima.icono} tamano={28} />}
                <span className="min-w-0 flex-1">{climaAdelante.kmInicio <= kmActual ? 'Ahora' : `En ${metros(climaAdelante.kmInicio - kmActual)}`}: {climaAdelante.motivos.join(', ')}</span>
              </p>
            )}
            {simulando && <p className="rounded-xl bg-blue-700 px-3 py-1.5 text-sm font-semibold">Simulación: la posición avanza sola por el camino.</p>}
            {!simulando && !gps && <p className="rounded-xl bg-stone-900/95 px-3 py-2 text-sm">{errorGps ?? 'Buscando tu ubicación…'}</p>}
          </div>

          <div className="pm-nav-ui absolute bottom-28 right-3 z-[500] flex flex-col gap-3 lg:bottom-6 lg:right-6">
            <button type="button" onClick={onEmergencia} aria-label="Emergencia: a quién llamar" className={`${redondo} !bg-red-700 text-sm font-black`}>SOS</button>
            {!siguiendo && <button type="button" onClick={() => setSiguiendo(true)} aria-label="Volver a mi posición" className={redondo}>◎</button>}
            <button type="button" onClick={() => { if (voz) window.speechSynthesis?.cancel(); setVoz(!voz) }} aria-pressed={voz} aria-label={voz ? 'Apagar las indicaciones por voz' : 'Activar las indicaciones por voz'} className={`${redondo} ${voz ? '!bg-blue-600' : ''} `}>
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={voz ? 'M4 9v6h4l5 4V5L8 9H4zM16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11' : 'M4 9v6h4l5 4V5L8 9H4zM17 9.5l5 5M22 9.5l-5 5'} />
              </svg>
            </button>
          </div>

          <div className="pm-nav-ui absolute inset-x-0 bottom-0 z-[500] flex items-center gap-3 rounded-t-2xl bg-stone-900 px-3 pb-4 pt-3 shadow-[0_-4px_16px_rgb(0_0_0/0.4)] lg:bottom-4 lg:left-4 lg:right-auto lg:w-[27rem] lg:rounded-2xl lg:pb-3">
            <button type="button" onClick={() => { window.speechSynthesis?.cancel(); setEtapa('ver') }} aria-label="Terminar la navegación" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-stone-700 text-xl">✕</button>
            <button type="button" onClick={() => setVerIndicaciones(true)} className="min-w-0 flex-1 text-left">
              <span className="block text-2xl font-bold leading-tight tabular-nums text-emerald-400">{horaDe(llegada)}</span>
              <span className="block truncate text-sm text-stone-300">{duracionDe((restante / velocidadMedia) * 3600)} · {metros(restante)} · {hasta?.nombre}</span>
            </button>
            <button type="button" onClick={() => setVerIndicaciones(true)} className="shrink-0 rounded-full bg-stone-700 px-4 py-3 text-base font-semibold">Pasos</button>
          </div>

          {verIndicaciones && (
            <div className="pm-nav-hoja absolute inset-0 z-[700] flex flex-col bg-stone-900">
              <header className="flex shrink-0 items-center gap-2 border-b border-stone-700 px-3 py-2">
                <h2 className="text-lg font-bold">Lo que viene</h2>
                <button type="button" onClick={() => setVerIndicaciones(false)} aria-label="Volver al mapa" className="ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-stone-700">✕</button>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
                <h3 className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Clima en el camino</h3>
                <ResumenClima tramos={viaje.tramos.filter((t) => t.kmFin > kmActual)} />
                <h3 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-stone-400">Indicaciones</h3>
                <ListaIndicaciones indicaciones={viaje.indicaciones} desdeKm={kmActual} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
