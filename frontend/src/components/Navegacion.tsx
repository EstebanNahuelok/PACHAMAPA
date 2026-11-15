import { useEffect, useMemo, useRef, useState } from 'react'
import CaminoPorDelante from './CaminoPorDelante'
import IconoDificultad from './IconoDificultad'
import MapaNavegacion from './MapaNavegacion'
import { ESTADOS, hora } from '../lib/formato'
import { VELOCIDAD_SUPUESTA, armarRecorrido, decir, distancia, duracion, fraseDe } from '../lib/navegacion'
import type { Ubicacion } from '../lib/navegacion'
import { DEMO_ALERTAS, tramosDemo } from '../lib/demo'
import { puntoEnRuta } from '../lib/ruta'
import type { Tramo } from '../lib/tipos'

interface Props {
  tramos: Tramo[]
  sinSenal: boolean
  origenInicial?: string
  onCerrar: () => void
  onReportar: (tramoId: string) => void
}

const GPS = 'gps'
const DEMO = 'demo'
const DEMO_FLUIDA = 'demo-alertas'
const AVISAR_A_KM = 5
const PASO_DEMO_MS = 2500
const selector = 'min-w-0 flex-1 rounded-lg border border-stone-600 bg-stone-800 px-2 py-2.5 text-base text-white'
const redondo = 'flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg ring-1 ring-white/20 disabled:opacity-50'
const horaDe = (ms: number) => hora(new Date(ms).toISOString())

const TRAZOS = {
  cerrar: 'M6 6l12 12M18 6L6 18',
  lista: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  mas: 'M12 5v14M5 12h14',
  centrar: 'M12 2v4M12 18v4M2 12h4M18 12h4M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8z',
  voz: 'M4 9v6h4l5 4V5L8 9H4zM16.500 9a4 4 0 0 1 0 6M19 6.500a8 8 0 0 1 0 11',
  silencio: 'M4 9v6h4l5 4V5L8 9H4zM17 9.500l5 5M22 9.500l-5 5',
}

function Trazo({ nombre, tamano = 26 }: { nombre: keyof typeof TRAZOS; tamano?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={TRAZOS[nombre]} />
    </svg>
  )
}

export default function Navegacion({ tramos, sinSenal, origenInicial = GPS, onCerrar, onReportar }: Props) {
  const localidad = (id: string) => tramos.find((t) => t.localidad === id)?.id ?? ''
  const [origenId, setOrigenId] = useState(origenInicial)
  const [destinoElegido, setDestinoId] = useState<string | null>(null)
  // Por defecto se va hacia el norte; si se sale de Abra Pampa, hacia San Salvador.
  const [avance, setAvance] = useState(0)
  const conAlertasSimuladas = origenId === DEMO_FLUIDA
  const destinoId = conAlertasSimuladas ? localidad(DEMO_ALERTAS.hasta) : destinoElegido ?? (origenInicial === localidad('abra-pampa') ? localidad('san-salvador') : localidad('abra-pampa'))
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null)
  const [errorGps, setErrorGps] = useState<string | null>(null)
  const [voz, setVoz] = useState(false)
  const [siguiendo, setSiguiendo] = useState(true)
  const [verCamino, setVerCamino] = useState(false)
  const [pasoDemo, setPasoDemo] = useState(0)
  const [ahora, setAhora] = useState(() => Date.now())
  const avisados = useRef(new Set<string>())

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (origenId !== GPS || !navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setUbicacion({ lat: coords.latitude, lon: coords.longitude, velocidad: coords.speed == null ? null : coords.speed * 3.6, rumbo: coords.heading == null || Number.isNaN(coords.heading) ? null : coords.heading })
        setErrorGps(null)
      },
      () => setErrorGps('No pudimos obtener tu ubicación.'),
      { enableHighAccuracy: true, maximumAge: 5000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [origenId])

  // Mantiene la pantalla prendida mientras el modo navegacion esta abierto.
  useEffect(() => {
    let bloqueo: WakeLockSentinel | undefined
    navigator.wakeLock?.request('screen').then(
      (b) => (bloqueo = b),
      () => {},
    )
    return () => void bloqueo?.release()
  }, [])

  // En la demo con alertas se reemplazan los datos reales de esos tramos por dificultades inventadas.
  const datos = useMemo(() => (conAlertasSimuladas ? tramosDemo(tramos) : tramos), [conAlertasSimuladas, tramos])
  const destino = datos.find((t) => t.id === destinoId)

  // Demo fluida: la posicion avanza de forma continua sobre el trazado, como con un GPS real.
  useEffect(() => {
    if (!conAlertasSimuladas) return
    const inicio = performance.now()
    const id = setInterval(() => setAvance(Math.min(1, (performance.now() - inicio) / DEMO_ALERTAS.duracionMs)), 100)
    return () => clearInterval(id)
  }, [conAlertasSimuladas])

  // Simulacion para mostrar la navegacion sin estar en la ruta: avanza un tramo de 5 km cada pocos segundos.
  const rutaDemo = useMemo(() => {
    const salida = tramos.find((t) => t.id === (destinoId === localidad('san-salvador') ? localidad('abra-pampa') : localidad('san-salvador')))
    return salida && destino ? armarRecorrido(tramos, salida, destino, 0).pasos.map((p) => p.tramo.id) : []
    // Solo cambia con el destino: los datos nuevos no deben reiniciar la simulacion.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [destinoId, tramos.length])
  useEffect(() => {
    if (origenId !== DEMO) return
    const id = setInterval(() => setPasoDemo((n) => n + 1), PASO_DEMO_MS)
    return () => clearInterval(id)
  }, [origenId])

  const enDemo = tramos.find((t) => t.id === rutaDemo[Math.min(pasoDemo, rutaDemo.length - 1)])
  const origen = useMemo((): Ubicacion | Tramo | null | undefined => {
    if (origenId === GPS) return ubicacion
    if (origenId === DEMO) return enDemo && { lat: enDemo.lat, lon: enDemo.lon, velocidad: 80, rumbo: null }
    if (origenId === DEMO_FLUIDA) {
      const [salida, llegada] = [DEMO_ALERTAS.desde, DEMO_ALERTAS.hasta].map((id) => tramos.find((t) => t.localidad === id))
      if (!salida || !llegada) return null
      const medio = (t: Tramo) => (t.kmInicio + t.kmFin) / 2
      return { ...puntoEnRuta('rn9', medio(salida) + (medio(llegada) - medio(salida)) * avance), velocidad: avance < 1 ? DEMO_ALERTAS.velocidad : 0 }
    }
    return tramos.find((t) => t.id === origenId)
  }, [origenId, ubicacion, enDemo, tramos, avance])
  const recorrido = useMemo(() => (origen && destino ? armarRecorrido(datos, origen, destino, ahora) : null), [datos, origen, destino, ahora])
  const enRuta = recorrido && !recorrido.fueraDeRuta ? recorrido : null
  const posicion = useMemo(() => (origen ? { lat: origen.lat, lon: origen.lon, rumbo: 'rumbo' in origen ? origen.rumbo : null } : null), [origen])

  const actual = enRuta?.trechos[0]
  const tramoActual = enRuta?.pasos[0]?.tramo
  const despues = enRuta?.trechos.slice(1).find((t) => t.dificultades.length > 0)
  const velocidad = origen && 'velocidad' in origen && origen.velocidad != null ? Math.round(origen.velocidad) : null

  // Avisa por voz, una sola vez, cada trecho con dificultades cuando queda a pocos kilometros.
  useEffect(() => {
    if (!voz || !enRuta) return
    const proximo = enRuta.trechos.find((t) => t.dificultades.length > 0 && t.km <= AVISAR_A_KM && !avisados.current.has(t.clave))
    if (!proximo) return
    avisados.current.add(proximo.clave)
    decir(fraseDe(proximo))
  }, [voz, enRuta])

  const alternarVoz = () => {
    if (voz) window.speechSynthesis?.cancel()
    else {
      const primero = enRuta?.trechos.find((t) => t.dificultades.length > 0)
      if (primero) avisados.current.add(primero.clave)
      decir(primero ? fraseDe(primero) : 'Avisos por voz activados. No hay dificultades en el camino.')
    }
    setVoz(!voz)
  }

  const elegirOrigen = (id: string) => {
    setOrigenId(id)
    setPasoDemo(0)
    setAvance(0)
    setSiguiendo(true)
  }

  const selectores = (
    <div className="flex items-center gap-2">
      <select aria-label="Desde" value={origenId} onChange={(e) => elegirOrigen(e.target.value)} className={selector}>
        <option value={GPS}>Mi ubicación</option>
        <option value={DEMO}>Simulación (demo)</option>
        <option value={DEMO_FLUIDA}>Demo fluida con alertas simuladas</option>
        {tramos.filter((t) => t.localidad || t.id === origenId).map((t) => (
          <option key={t.id} value={t.id}>{t.nombre}</option>
        ))}
      </select>
      <span aria-hidden="true">→</span>
      <select aria-label="Hasta" value={destinoId} disabled={conAlertasSimuladas} onChange={(e) => setDestinoId(e.target.value)} className={selector}>
        {tramos.filter((t) => t.localidad).map((t) => (
          <option key={t.id} value={t.id}>{t.nombre}</option>
        ))}
      </select>
    </div>
  )

  const conProblema = actual && actual.dificultades.length > 0
  const fondo = conProblema ? (actual.estado === 'problemas' ? '#b91c1c' : '#b45309') : '#1c1917'

  return (
    <div className="pm-fijo fixed inset-0 z-[1100] overflow-hidden bg-stone-950 text-white">
      <MapaNavegacion recorrido={enRuta} posicion={enRuta ? posicion : null} siguiendo={siguiendo} fluido={conAlertasSimuladas} noche={tramoActual?.clima?.esDia === false} onMover={() => setSiguiendo(false)} />

      {/* Tarjeta superior, como la de la proxima maniobra: lo que pasa en el tramo que se esta recorriendo. */}
      <div className="absolute inset-x-2 top-2 z-[500] space-y-1.5 landscape:right-auto landscape:w-[26rem]">
        {actual && tramoActual ? (
          <>
            <section aria-live="polite" className="rounded-2xl px-4 py-3 shadow-xl" style={{ background: fondo }}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
                En este tramo · {tramoActual.ruta} km {tramoActual.kmInicio}–{tramoActual.kmFin}
              </p>
              <p className="text-2xl font-bold leading-tight">{tramoActual.nombre}</p>
              {conProblema ? (
                <ul className="mt-1.5 space-y-1">
                  {actual.dificultades.map((d) => (
                    <li key={d.clave} className="flex items-center gap-2 text-xl font-semibold leading-tight">
                      <span className="flex rounded-full bg-black/30 p-0.5">
                        <IconoDificultad dificultad={d} tamano={30} />
                      </span>
                      {d.titulo}
                    </li>
                  ))}
                  {actual.largo > 7 && <li className="text-sm font-medium opacity-90">Sigue por {Math.round(actual.largo)} km</li>}
                </ul>
              ) : (
                <p className="mt-0.5 flex items-center gap-2 text-lg font-semibold text-emerald-400">
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  Sin dificultades{actual.largo > 7 && ` por ${Math.round(actual.largo)} km`}
                </p>
              )}
            </section>
            {/* Tarjeta chica de "despues", como la segunda maniobra de Google Maps. */}
            {despues && (
              <section className="flex items-center gap-2 rounded-xl bg-stone-900/95 px-3 py-2 shadow-lg">
                <span className="shrink-0 text-sm font-semibold text-stone-300">En {distancia(despues.km)}</span>
                {despues.dificultades.slice(0, 3).map((d) => (
                  <IconoDificultad key={d.clave} dificultad={d} tamano={26} />
                ))}
                <span className="min-w-0 truncate text-base font-semibold">{despues.dificultades.map((d) => d.titulo).join(' · ')}</span>
              </section>
            )}
          </>
        ) : (
          <section className="space-y-2 rounded-2xl bg-stone-900 px-4 py-3 shadow-xl">
            <p className="text-base font-semibold">
              {recorrido?.fueraDeRuta
                ? `Estás a ${Math.round(recorrido.desvio)} km de la RN 9 y la RN 52.`
                : origenId === GPS && !navigator.geolocation
                  ? 'Este navegador no permite usar la ubicación.'
                  : (errorGps ?? 'Buscando tu ubicación…')}
            </p>
            <p className="text-sm text-stone-300">Podés elegir desde dónde salís o ver una simulación del recorrido.</p>
            {selectores}
          </section>
        )}
        {conAlertasSimuladas && <p className="rounded-xl bg-blue-700 px-3 py-1.5 text-sm font-semibold">Demostración: estas alertas son simuladas, no reales.</p>}
        {sinSenal && <p className="rounded-xl bg-stone-900/95 px-3 py-2 text-sm">Sin datos nuevos: se estima con el último pronóstico recibido.</p>}
      </div>

      {/* Barra de progreso del viaje: de abajo (donde estas) hacia arriba (el destino), con el color de cada tramo. */}
      {enRuta && enRuta.pasos.length > 1 && (
        <div aria-hidden="true" className="absolute bottom-32 left-2 top-48 z-[400] flex w-3 flex-col-reverse overflow-hidden rounded-full border-2 border-white bg-white shadow-lg landscape:top-44">
          {enRuta.pasos.map((p) => (
            <span key={p.tramo.id} className="min-h-0 flex-1" style={{ background: ESTADOS[p.estado].color }} />
          ))}
        </div>
      )}

      <div className="absolute bottom-28 right-3 z-[500] flex flex-col gap-3">
        {!siguiendo && (
          <button type="button" onClick={() => setSiguiendo(true)} aria-label="Volver a mi posición" className={redondo}>
            <Trazo nombre="centrar" />
          </button>
        )}
        <button type="button" onClick={alternarVoz} aria-pressed={voz} aria-label={voz ? 'Apagar los avisos por voz' : 'Activar los avisos por voz'} className={`${redondo} ${voz ? '!bg-blue-600' : ''}`}>
          <Trazo nombre={voz ? 'voz' : 'silencio'} />
        </button>
        <button type="button" disabled={sinSenal || !tramoActual || origenId === DEMO || conAlertasSimuladas} onClick={() => tramoActual && onReportar(tramoActual.id)} aria-label="Reportar algo en este tramo" className={`${redondo} !bg-orange-600`}>
          <Trazo nombre="mas" tamano={30} />
        </button>
      </div>

      {velocidad != null && (
        <div className="absolute bottom-28 left-8 z-[500] flex h-16 w-16 flex-col items-center justify-center rounded-full bg-stone-900 shadow-lg ring-1 ring-white/20">
          <span className="text-2xl font-bold leading-none tabular-nums">{velocidad}</span>
          <span className="text-[10px] text-stone-300">km/h</span>
        </div>
      )}

      {/* Barra inferior: hora de llegada, tiempo y distancia que faltan, salir y ver el camino. */}
      <div className="absolute inset-x-0 bottom-0 z-[500] flex items-center gap-3 rounded-t-2xl bg-stone-900 px-3 pb-4 pt-3 shadow-[0_-4px_16px_rgb(0_0_0/0.4)]">
        <button type="button" onClick={onCerrar} aria-label="Salir de la navegación" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-stone-700">
          <Trazo nombre="cerrar" />
        </button>
        <button type="button" onClick={() => setVerCamino(true)} className="min-w-0 flex-1 text-left">
          {enRuta ? (
            <>
              <span className="block text-2xl font-bold leading-tight tabular-nums text-emerald-400">{horaDe(enRuta.llegada)}</span>
              <span className="block truncate text-sm text-stone-300">
                {duracion(enRuta.llegada - ahora)} · {Math.round(enRuta.total)} km · {destino?.nombre}
              </span>
            </>
          ) : (
            <span className="text-base text-stone-300">Elegí el recorrido</span>
          )}
        </button>
        <button type="button" onClick={() => setVerCamino(true)} className="flex shrink-0 items-center gap-2 rounded-full bg-stone-700 px-4 py-3 text-base font-semibold">
          <Trazo nombre="lista" tamano={22} />
          Camino
        </button>
      </div>

      {verCamino && (
        <div className="absolute inset-0 z-[600] flex flex-col bg-stone-900">
          <header className="flex shrink-0 items-center gap-2 border-b border-stone-700 px-3 py-2">
            <h2 className="text-lg font-bold">Camino por delante</h2>
            <button type="button" onClick={() => setVerCamino(false)} aria-label="Volver al mapa" className="ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-stone-700">
              <Trazo nombre="cerrar" tamano={22} />
            </button>
          </header>
          <div className="shrink-0 px-3 py-2">{selectores}</div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-2">
            {enRuta ? (
              <>
                <CaminoPorDelante recorrido={enRuta} />
                <p className="text-xs text-stone-400">
                  Llegadas calculadas a {Math.round(enRuta.velocidad)} km/h{enRuta.velocidadMedida ? ' (tu velocidad actual)' : ` (supuesto: ${VELOCIDAD_SUPUESTA} km/h)`}. Dejá el teléfono en un soporte y no lo toques mientras manejás.
                </p>
              </>
            ) : (
              <p className="text-base text-stone-300">Elegí desde dónde salís para ver el camino.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
