import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Mapa from './components/Mapa'
import ListaTramos from './components/ListaTramos'
import DetalleTramo from './components/DetalleTramo'
import FormularioReporte from './components/FormularioReporte'
import { cantidadPendientes, enviarPendientes } from './lib/reportesPendientes'
import ListaEspera from './components/ListaEspera'
import Alertas from './components/Alertas'
import Noticias from './components/Noticias'
import AlertasWhatsApp from './components/AlertasWhatsApp'
import Asistente from './components/Asistente'
import Pacha from './components/Pacha'
import BotonTema from './components/BotonTema'
import Navegacion from './components/Navegacion'
import Viaje from './components/Viaje'
import Emergencia from './components/Emergencia'
import { obtenerMetricas, obtenerTramos, registrarVisita } from './lib/api'
import type { Metricas, ReporteCreado } from './lib/api'
import { puntoSobreRuta } from './lib/ruta'
import type { PuntoElegido } from './lib/ruta'
import { ESTADOS, haceCuanto, hora, textoAlerta } from './lib/formato'
import { estimar, guardarDatos, leerDatos, precargarMapa } from './lib/offline'
import type { Estado, RespuestaTramos } from './lib/tipos'
import type { Tema } from './lib/tema'

const INTERVALO_MS = 2 * 60 * 1000
const ADELANTOS = [0, 3, 6, 12]
const CLAVE_PRUEBA = 'pm-prueba'
const MAXIMO_LARGO_KM = 15
let visitaRegistrada = false

export default function App({ tema, onAlternarTema }: { tema: Tema; onAlternarTema: () => void }) {
  const [datos, setDatos] = useState<RespuestaTramos | null>(() => {
    const guardados = leerDatos()
    return guardados && estimar(guardados)
  })
  const [sinSenal, setSinSenal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  // Un reporte va en un punto exacto de la ruta: primero se elige el lugar (tocando el mapa o con el GPS) y despues se completa.
  // Los hechos con largo (obras, filas, cortes) pueden llevar un segundo punto: donde terminan.
  const [eligiendo, setEligiendo] = useState<'inicio' | 'fin' | null>(null)
  const [punto, setPunto] = useState<PuntoElegido | null>(null)
  const [navegando, setNavegando] = useState(false)
  const [viajando, setViajando] = useState(false)
  const [enEmergencia, setEnEmergencia] = useState(false)
  const [verTodos, setVerTodos] = useState(false)
  const [adelanto, setAdelanto] = useState(0)
  const [desdeVista, setDesdeVista] = useState(0)
  const [enListaEspera, setEnListaEspera] = useState(false)
  const [suscribiendo, setSuscribiendo] = useState(false)
  const [enAyuda, setEnAyuda] = useState(() => location.hash === '#mapa-pacha')
  const [aviso, setAviso] = useState<string | null>(null)
  const [pendientes, setPendientes] = useState(cantidadPendientes)
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const panel = useRef<HTMLElement>(null)
  const alertasVistas = useRef<Set<string> | null>(null)
  // TEST EN SALTA: suma una ruta de prueba en Salta capital para desarrollar con GPS real. Se activa desde
  // la navegacion o abriendo la aplicacion con ?prueba=salta, y queda guardado en el telefono.
  const [prueba, setPrueba] = useState(() => new URLSearchParams(location.search).get('prueba') === 'salta' || localStorage.getItem(CLAVE_PRUEBA) === '1')
  const alternarPrueba = (activo: boolean) => {
    if (activo) localStorage.setItem(CLAVE_PRUEBA, '1')
    else localStorage.removeItem(CLAVE_PRUEBA)
    // Las alertas de Salta que aparecen al activarlo no son novedades: no se anuncian.
    alertasVistas.current = null
    setPrueba(activo)
  }

  const cargar = useCallback(async () => {
    let nuevos: RespuestaTramos
    try {
      // Sin red no vale la pena esperar a que el pedido falle.
      if (!navigator.onLine) throw new Error('sin conexion')
      nuevos = await obtenerTramos(prueba)
      // El servidor puede responder sin clima (falla de Open-Meteo): no se pisa lo guardado con una respuesta vacia.
      if (!nuevos.climaDisponible && leerDatos()) throw new Error('sin clima')
      if (nuevos.climaDisponible) guardarDatos(nuevos)
      setSinSenal(false)
      setError(null)
      obtenerMetricas().then(setMetricas, () => {})
      // Volvio la conexion: salen los reportes que quedaron guardados sin señal.
      if (cantidadPendientes() > 0) {
        enviarPendientes().then((enviados) => {
          setPendientes(cantidadPendientes())
          if (enviados > 0) {
            setAviso(enviados === 1 ? 'Se envió el reporte que habías guardado sin señal.' : `Se enviaron los ${enviados} reportes que habías guardado sin señal.`)
            cargar()
          }
        })
      }
    } catch {
      // Sin conexion: se sigue con los ultimos datos recibidos, llevados a esta hora con su pronostico.
      const guardados = leerDatos()
      if (!guardados) return setError(navigator.onLine ? 'No se pudo conectar con el servidor. Reintentando…' : 'Sin conexión y todavía no hay datos guardados. Se van a cargar cuando vuelva la señal.')
      nuevos = estimar(guardados)
      setSinSenal(true)
    }
    setDatos(nuevos)
    // Avisa solo lo que aparece mientras la aplicacion esta abierta; la primera carga ya se ve en la lista.
    const vistas = alertasVistas.current
    const nuevas = nuevos.alertas.filter((a) => vistas && !vistas.has(a.id))
    alertasVistas.current = new Set(nuevos.alertas.map((a) => a.id))
    if (nuevas.length > 0) {
      setAviso(`Alerta nueva en ${nuevas[0].tramo}: ${textoAlerta(nuevas[0])}${nuevas.length > 1 ? ` (y ${nuevas.length - 1} más)` : ''}`)
      navigator.vibrate?.(200)
    }
  }, [prueba])

  useEffect(() => {
    if (!visitaRegistrada) {
      visitaRegistrada = true
      registrarVisita().catch(() => {})
    }
    cargar()
    const id = setInterval(cargar, INTERVALO_MS)
    const alVolver = () => document.visibilityState === 'visible' && cargar()
    document.addEventListener('visibilitychange', alVolver)
    window.addEventListener('online', cargar)
    window.addEventListener('offline', cargar)
    const precarga = setTimeout(precargarMapa, 5000)
    return () => {
      clearTimeout(precarga)
      window.removeEventListener('online', cargar)
      window.removeEventListener('offline', cargar)
      clearInterval(id)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [cargar])

  // Con una hora elegida, el mapa y la lista muestran lo previsto para ese momento en lugar de lo actual.
  const vista = useMemo(() => (datos && adelanto > 0 ? estimar(datos, desdeVista + adelanto * 60 * 60 * 1000) : datos), [datos, adelanto, desdeVista])
  const tramos = vista?.tramos ?? []
  const tramo = tramos.find((t) => t.id === seleccionado)
  const cuenta = (estado: Estado) => tramos.filter((t) => t.estado === estado).length * 5
  // Con un tramo cada 5 km la lista completa es larga: van las localidades y los tramos con algo para avisar.
  const enLista = verTodos ? tramos : tramos.filter((t) => t.localidad || t.estado !== 'bien')

  const seleccionar = (id: string | null) => {
    setSeleccionado(id)
    panel.current?.scrollTo({ top: 0 })
  }

  useEffect(() => {
    if (!aviso) return
    const id = setTimeout(() => setAviso(null), 8000)
    return () => clearTimeout(id)
  }, [aviso])

  const empezarReporte = () => {
    setPunto(null)
    setEligiendo('inicio')
    setNavegando(false)
  }
  const alElegir = (lat: number, lon: number) => {
    const elegido = puntoSobreRuta(datos?.tramos ?? [], lat, lon)
    if (!elegido) return setAviso('Ese punto está lejos de la ruta. Tocá sobre el camino, donde está el problema.')
    if (eligiendo === 'fin' && punto) {
      const largo = Math.abs(elegido.km - punto.km)
      if (elegido.ruta !== punto.ruta || largo < 0.1 || largo > MAXIMO_LARGO_KM) return setAviso(`El final tiene que estar sobre la misma ruta, a menos de ${MAXIMO_LARGO_KM} km del inicio.`)
      setPunto({ ...punto, fin: { lat: elegido.lat, lon: elegido.lon, texto: elegido.texto } })
    } else setPunto(elegido)
    setEligiendo(null)
  }
  const usarUbicacion = () => {
    if (!navigator.geolocation) return setAviso('Tu navegador no permite usar la ubicación. Tocá el punto en el mapa.')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => alElegir(coords.latitude, coords.longitude),
      () => setAviso('No pudimos obtener tu ubicación. Tocá el punto en el mapa.'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const alEnviarReporte = (reporte: ReporteCreado) => {
    setPunto(null)
    seleccionar(reporte.tramoId)
    setAviso(`Gracias. ${reporte.etiqueta} en ${reporte.tramo}${reporte.confirmado ? ': ya quedó confirmado' : ': se confirma con otro reporte igual'}.`)
    cargar()
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 bg-orange-800 px-3 text-white">
        <a href="#inicio" aria-label="Ir a la portada" className="flex items-center gap-2">
          <img src="/marca/pachamapa-pin-inverted-small.svg" alt="" className="h-8 w-auto" />
          <h1 className="pm-marca text-xl leading-none">Pachamapa</h1>
        </a>
        <span className="hidden text-sm text-orange-100 sm:inline">Clima y ruta en Jujuy, tramo por tramo</span>
        <span className="ml-auto text-xs text-orange-100">
          {datos?.actualizado ? `${sinSenal ? 'Sin datos nuevos · últimos de las' : 'Actualizado'} ${hora(datos.actualizado)}` : 'Cargando…'}
        </span>
        <BotonTema tema={tema} onAlternar={onAlternarTema} className="-mr-1 text-white hover:bg-white/15" />
      </header>

      <main className="flex min-h-0 flex-1 flex-col landscape:flex-row-reverse">
        <div className="relative min-h-0 flex-1">
          <Mapa tramos={tramos} seleccionado={seleccionado} onSeleccionar={seleccionar} eligiendo={eligiendo !== null} onPunto={alElegir} puntoElegido={punto} />
          {eligiendo && (
            <div role="status" className="absolute inset-x-2 top-2 z-[600] mx-auto max-w-md rounded-xl bg-stone-900 px-4 py-3 text-white shadow-xl">
              <p className="text-base font-bold">{eligiendo === 'fin' ? 'Tocá dónde termina' : 'Tocá el punto exacto de la ruta'}</p>
              <p className="text-sm text-stone-300">
                {eligiendo === 'fin' ? 'Se va a marcar el trecho entre el inicio y este punto.' : 'El reporte se marca en ese lugar, no en todo el tramo. Acercá el mapa para ser más preciso.'}
              </p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={usarUbicacion} className="flex-1 rounded-lg bg-orange-700 px-3 py-2 text-sm font-bold">
                  Estoy acá
                </button>
                <button type="button" onClick={() => setEligiendo(null)} className="flex-1 rounded-lg bg-stone-700 px-3 py-2 text-sm font-semibold">
                  Cancelar
                </button>
              </div>
            </div>
          )}
          <div className="pm-material pointer-events-none absolute left-2 top-2 z-[500] flex gap-3 rounded-full px-3 py-1.5 text-xs font-medium">
            {(['bien', 'atencion', 'problemas'] as const).map((e) => (
              <span key={e} className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: ESTADOS[e].color }} />
                {ESTADOS[e].etiqueta}
              </span>
            ))}
          </div>
          <div className="pm-material absolute left-2 top-11 z-[500] flex overflow-hidden rounded-full p-0.5 text-xs font-semibold">
            {ADELANTOS.map((h) => (
              <button key={h} type="button" aria-pressed={adelanto === h} onClick={() => {
                setAdelanto(h)
                setDesdeVista(Date.now())
              }} className={`rounded-full px-3 py-1 ${adelanto === h ? 'bg-stone-900 text-white shadow' : 'text-stone-700'}`}>
                {h === 0 ? 'Ahora' : `+${h} h`}
              </button>
            ))}
          </div>
          {prueba && (
            <button type="button" onClick={() => alternarPrueba(false)} className="absolute left-2 top-[5.25rem] z-[500] rounded-full bg-blue-700 px-3 py-1.5 text-xs font-bold text-white shadow">
              TEST EN SALTA · salir
            </button>
          )}
          {aviso && (
            <p role="status" className="absolute inset-x-2 top-12 z-[500] mx-auto max-w-md rounded-lg bg-stone-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg">{aviso}</p>
          )}
          <button type="button" onClick={() => setEnEmergencia(true)} aria-label="Emergencia: a quién llamar" className="absolute bottom-[5.25rem] left-3 z-[500] rounded-full bg-red-700 px-5 py-3 text-base font-black text-white shadow-lg ring-2 ring-white">
            SOS
          </button>
          <button type="button" onClick={() => setEnAyuda(true)} aria-label="Pacha, el asistente: preguntas sobre la ruta y la aplicación" className="pm-boton-pacha absolute bottom-[5.25rem] right-3 z-[500] flex items-center gap-1.5 rounded-full py-1.5 pl-2 pr-4 text-base font-bold shadow-lg ring-2 ring-emerald-600">
            <Pacha className="h-10 w-auto" suelo={false} />
            Pacha
          </button>
          <button type="button" onClick={() => setViajando(true)} className="absolute bottom-7 left-3 z-[500] rounded-full bg-stone-900 px-5 py-3 text-base font-bold text-white shadow-lg ring-2 ring-white disabled:opacity-60">
            Navegar
          </button>
          <button
            type="button"
            onClick={empezarReporte}
            disabled={!datos}
            className="absolute bottom-7 right-3 z-[500] flex items-center gap-1.5 rounded-full bg-orange-700 py-3 pl-4 pr-5 text-base font-bold text-white shadow-lg ring-2 ring-white active:bg-orange-800 disabled:opacity-60"
          >
            <span className="text-xl leading-none">+</span> Reportar
          </button>
        </div>

        <aside ref={panel} className="h-[40dvh] shrink-0 pm-panel overflow-y-auto border-t border-stone-300 landscape:h-auto landscape:w-80 landscape:border-r landscape:border-t-0 landscape:lg:w-96">
          {sinSenal && datos?.actualizado && (
            <p role="status" className="bg-stone-800 px-4 py-2 text-sm text-white">
              <span className="font-bold">Sin datos nuevos.</span> Lo que ves es una estimación con el pronóstico recibido {haceCuanto(datos.actualizado)}; los reportes pueden estar desactualizados.
              {pendientes > 0 && <> {pendientes === 1 ? 'Tenés 1 reporte guardado' : `Tenés ${pendientes} reportes guardados`}: se envía solo cuando vuelva la señal.</>}
            </p>
          )}
          {!sinSenal && (error || datos?.error) && (
            <p className="bg-amber-100 px-4 py-2 text-sm text-amber-900">{error ?? 'El clima puede estar desactualizado.'}</p>
          )}
          {tramo ? (
            <>
              <DetalleTramo tramo={tramo} parteOficial={datos?.parteOficial} onVolver={() => seleccionar(null)} onReportar={empezarReporte} />
              {tramo.localidad && <Noticias titulo={`${tramo.nombre} en los diarios`} noticias={(datos?.noticias ?? []).filter((n) => n.localidad === tramo.localidad)} />}
            </>
          ) : (
            <>
              <Alertas alertas={datos?.alertas ?? []} onSeleccionar={seleccionar} />
              <Noticias noticias={datos?.noticias ?? []} />
              {datos?.temporada && (
                <p className="border-b border-stone-200 px-4 py-2 text-xs text-stone-600">
                  <span className="font-bold text-stone-800">{datos.temporada.nombre}.</span> {datos.temporada.detalle}
                </p>
              )}
              <div className="flex items-baseline justify-between px-4 pb-2 pt-4">
                <h2 className="pm-titulo">{adelanto > 0 ? `Previsto en ${adelanto} h` : 'Estado por tramo'}</h2>
                {datos && (
                  <span className="text-xs text-stone-500">
                    {cuenta('problemas')} km con problemas · {cuenta('atencion')} km con atención
                  </span>
                )}
              </div>
              {datos ? <ListaTramos tramos={enLista} onSeleccionar={seleccionar} /> : !error && <p className="px-4 py-6 text-sm text-stone-500">Consultando el clima de cada tramo…</p>}
              {datos && (
                <button type="button" onClick={() => setVerTodos(!verTodos)} className="mx-4 mt-3 text-sm font-medium text-orange-800 hover:underline">
                  {verTodos ? 'Ver solo localidades y avisos' : `Ver los ${tramos.length} tramos de 5 km`}
                </button>
              )}
              <div className="pm-tarjeta m-3 p-4">
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

      {navegando && (
        <Navegacion
          tramos={datos?.tramos ?? []}
          sinSenal={sinSenal}
          prueba={prueba}
          onPrueba={alternarPrueba}
          origenInicial={seleccionado ?? undefined}
          onCerrar={() => setNavegando(false)}
          onReportar={alElegir}
          onEmergencia={() => setEnEmergencia(true)}
        />
      )}
      {viajando && (
        <Viaje
          sinSenal={sinSenal}
          onCerrar={() => setViajando(false)}
          onEmergencia={() => setEnEmergencia(true)}
          onQuebrada={() => {
            setViajando(false)
            setNavegando(true)
          }}
        />
      )}
      {enEmergencia && <Emergencia tramos={datos?.tramos ?? []} onCerrar={() => setEnEmergencia(false)} />}
      {punto && (
        <FormularioReporte
          punto={punto}
          oculto={eligiendo !== null}
          onCambiarPunto={() => {
            setEligiendo('inicio')
            setNavegando(false)
          }}
          onMarcarFinal={() => {
            setEligiendo('fin')
            setNavegando(false)
          }}
          onQuitarFinal={() => setPunto({ ...punto, fin: undefined })}
          onCerrar={() => setPunto(null)}
          onEnviado={alEnviarReporte}
          onGuardado={() => {
            setPunto(null)
            setEligiendo(null)
            setPendientes(cantidadPendientes())
            setAviso('Sin señal: el reporte quedó guardado y se envía solo cuando vuelva la conexión (hasta 2 horas).')
          }}
        />
      )}
      {enAyuda && <Asistente sinSenal={sinSenal} onCerrar={() => setEnAyuda(false)} />}
      {suscribiendo && <AlertasWhatsApp tramos={datos?.tramos ?? []} tramoInicial={seleccionado} onCerrar={() => { setSuscribiendo(false); obtenerMetricas().then(setMetricas, () => {}) }} />}
      {enListaEspera && <ListaEspera onCerrar={() => { setEnListaEspera(false); obtenerMetricas().then(setMetricas, () => {}) }} />}
    </div>
  )
}
