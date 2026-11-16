import { useEffect, useRef } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import BotonTema from './BotonTema'
import Pacha from './Pacha'
import { AntesDeSalir, AQuienLlamar } from './Seguridad'
import { ESTADOS } from '../lib/formato'
import { PAGINAS, type Pagina } from '../lib/paginas'
import type { Tema } from '../lib/tema'


interface Props {
  pagina: Pagina
  tema: Tema
  onAlternarTema: () => void
}

const FUNCIONES = [
  {
    titulo: 'Clima cada 5 km',
    texto: 'La RN 9 y la RN 52 divididas en 56 tramos, cada uno con su temperatura, visibilidad, viento, lluvia, nieve y altitud.',
    icono: 'M6 19a4 4 0 0 1-.5-8A6 6 0 0 1 17 9.5 4.5 4.5 0 0 1 17.5 19z',
  },
  {
    titulo: 'Lo que viene',
    texto: 'Pronóstico hora por hora y el mapa adelantado 3, 6 o 12 horas, para saber cómo va a estar cuando llegues.',
    icono: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  },
  {
    titulo: 'Reportes de la gente',
    texto: 'Neblina, cortes, derrumbes, hielo o filas, avisados por quien está en la ruta. Con dos reportes iguales queda confirmado.',
    icono: 'M4 5h16v11H9l-5 4z',
  },
  {
    titulo: 'Alertas por WhatsApp',
    texto: 'Elegís tus localidades y horario, y te avisamos cuando aparece un problema. Te das de baja desde el mismo mensaje.',
    icono: 'M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 0 0 4 0',
  },
  {
    titulo: 'Navegación con avisos',
    texto: 'Mientras manejás, la app te muestra qué dificultades tenés por delante y a cuántos kilómetros.',
    icono: 'M12 3l7 18-7-4-7 4z',
  },
  {
    titulo: 'Funciona sin señal',
    texto: 'Guarda el último pronóstico recibido y sigue estimando el estado de la ruta donde no hay cobertura.',
    icono: 'M3 9a14 14 0 0 1 18 0M6.5 12.5a9 9 0 0 1 11 0M10 16a4 4 0 0 1 4 0M12 19.5h.01',
  },
]

const ESTADO_DETALLE = {
  bien: 'Sin nada que avisar.',
  atencion: 'Neblina, calzada mojada, viento fuerte, bajo cero o un reporte sin confirmar.',
  problemas: 'Visibilidad muy reducida, nevada o lluvia fuerte, tormenta o un evento grave confirmado.',
} as const

const RUTAS = [
  { ruta: 'RN 9', recorrido: 'San Salvador de Jujuy – Abra Pampa', detalle: 'Volcán, Tumbaya, Purmamarca, Maimará, Tilcara, Uquía y Humahuaca. De 1.259 a 3.484 m.' },
  { ruta: 'RN 52', recorrido: 'Purmamarca – Salinas Grandes', detalle: 'Cuesta de Lipán, hasta 4.170 m de altura.' },
]

const CERROS = [
  { d: 'M0 150 180 70 330 130 520 40 700 125 860 60 1040 120 1200 75V260H0z', color: '#7c5a8a', opacidad: 0.55, prof: 6 },
  { d: 'M0 185 150 120 320 170 480 100 660 165 840 105 1010 160 1200 120V260H0z', color: '#b4533a', opacidad: 0.8, prof: 12 },
  { d: 'M0 215 170 165 340 205 520 150 700 200 880 155 1050 198 1200 170V260H0z', color: '#d98a3d', opacidad: 0.9, prof: 20 },
  { d: 'M0 240 200 205 380 232 560 198 760 230 940 204 1200 226V260H0z', color: '#e3b96a', opacidad: 1, prof: 30 },
]

const AVISOS = [
  { lugar: 'Humahuaca', dato: '17°', color: '#10b981', arriba: '12%', izquierda: '46%', z: 46 },
  { lugar: 'Tilcara', dato: 'Derrumbe', color: '#dc2626', arriba: '43%', izquierda: '8%', z: 70 },
  { lugar: 'Volcán', dato: 'Neblina', color: '#f59e0b', arriba: '70%', izquierda: '40%', z: 54 },
]

// Inclina la tarjeta hacia el puntero. Escribe variables de CSS directo en el elemento: no vuelve a renderizar.
function inclinar(e: PointerEvent<HTMLElement>) {
  if (e.pointerType !== 'mouse') return
  const caja = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--ry', (((e.clientX - caja.left) / caja.width - 0.5) * 10).toFixed(2))
  e.currentTarget.style.setProperty('--rx', (((e.clientY - caja.top) / caja.height - 0.5) * -10).toFixed(2))
}
function enderezar(e: PointerEvent<HTMLElement>) {
  e.currentTarget.style.setProperty('--rx', '0')
  e.currentTarget.style.setProperty('--ry', '0')
}

const BOTON = 'rounded-xl px-6 py-3.5 text-center text-base font-bold shadow-sm'

const MENU: { pagina: Pagina; nombre: string; texto: string }[] = [
  { pagina: 'inicio', nombre: 'Inicio', texto: '' },
  { pagina: 'como-funciona', nombre: 'Cómo funciona', texto: 'Clima cada 5 km, pronóstico, reportes y alertas: qué hace el mapa y cómo leerlo.' },
  { pagina: 'seguridad', nombre: 'Antes de salir', texto: 'La lista de control para repasar antes de arrancar y cómo manejar según el camino.' },
  { pagina: 'a-quien-llamar', nombre: 'A quién llamar', texto: 'Los números oficiales según lo que pase. Funciona sin datos.' },
  { pagina: 'pacha', nombre: 'Pacha', texto: 'Nuestro cardón asistente: preguntale por la ruta o por cómo usar la aplicación.' },
]

const PACHA_SABE = [
  { titulo: 'Cómo está la ruta', texto: 'Te cuenta qué tramos tienen dificultades ahora y qué se espera en las próximas horas, con la hora de los datos.' },
  { titulo: 'Cómo usar Pachamapa', texto: 'Reportar un problema, recibir alertas por WhatsApp, navegar con avisos o usar la aplicación sin señal.' },
  { titulo: 'A quién llamar', texto: 'Te dice el número oficial que corresponde según lo que pase. No inventa teléfonos.' },
]
const PREGUNTAS = ['¿Cómo está la ruta a Humahuaca?', '¿Hay neblina en Volcán?', '¿Cómo reporto un derrumbe?', '¿Qué significan los colores?']

const CAPAS = [
  { nombre: 'Tu ruta', fondo: '#e3b96a', nivel: 0 },
  { nombre: 'Reportes', fondo: '#d98a3d', nivel: 1 },
  { nombre: 'Clima', fondo: '#7c5a8a', nivel: 2 },
]
const FICHA = 'pm-ficha whitespace-nowrap rounded-full border-2 bg-white px-3 py-1.5 text-sm font-bold shadow-lg'

// Escena 3D de cada pagina: va al costado del titulo (debajo en celular) y es solo decorativa.
const ESCENAS: Record<Exclude<Pagina, 'inicio'>, ReactNode> = {
  'como-funciona': (
    <div className="pm-pila">
      {CAPAS.map((c) => (
        <span key={c.nombre} className="flex items-end p-3 text-sm font-extrabold text-white shadow-xl" style={{ background: c.fondo, opacity: 0.92, ['--nivel' as string]: c.nivel }}>
          {c.nombre}
        </span>
      ))}
    </div>
  ),
  seguridad: (
    <>
      <span className="absolute left-1/2 top-3 h-14 w-14 -translate-x-1/2 rounded-full bg-amber-400 opacity-90" />
      <div className="pm-camino" />
      <span className={`${FICHA} left-[4%] top-[34%] border-emerald-500`} style={{ ['--orden' as string]: 0 }}>✓ Cinturón</span>
      <span className={`${FICHA} right-[2%] top-[22%] border-emerald-500`} style={{ ['--orden' as string]: 1 }}>✓ Luces bajas</span>
      <span className={`${FICHA} right-[6%] top-[62%] border-emerald-500`} style={{ ['--orden' as string]: 2 }}>✓ Agua y abrigo</span>
    </>
  ),
  'a-quien-llamar': (
    <>
      <div className="pm-radar">
        {[0, 1, 2].map((i) => (
          <i key={i} style={{ ['--orden' as string]: i }} />
        ))}
      </div>
      <span className="absolute left-1/2 top-[38%] -translate-x-1/2 rounded-full bg-red-700 px-5 py-3 text-xl font-black text-white shadow-xl ring-4 ring-white">SOS</span>
      <span className={`${FICHA} left-[6%] top-[12%] border-red-600`} style={{ ['--orden' as string]: 0 }}>911</span>
      <span className={`${FICHA} right-[8%] top-[20%] border-red-600`} style={{ ['--orden' as string]: 1 }}>107 SAME</span>
      <span className={`${FICHA} left-[10%] top-[70%] border-red-600`} style={{ ['--orden' as string]: 2 }}>103 Defensa Civil</span>
    </>
  ),
  pacha: (
    <>
      <div className="pm-pacha-3d absolute inset-x-0 bottom-0 top-2 flex justify-center">
        <Pacha className="h-full w-auto drop-shadow-xl" />
      </div>
      <span className={`${FICHA} left-[2%] top-[10%] border-emerald-600`} style={{ ['--orden' as string]: 0 }}>¡Hola! Soy Pacha</span>
      <span className={`${FICHA} right-[0%] top-[74%] border-emerald-600`} style={{ ['--orden' as string]: 1 }}>¿A dónde vamos?</span>
    </>
  ),
}

const CABECERAS: Record<Exclude<Pagina, 'inicio'>, { cielo: string; etiqueta: string; titulo: string; texto: string }> = {
  'como-funciona': { cielo: 'pm-cielo-funciona', etiqueta: 'Cómo funciona', titulo: 'Todo lo que necesitás antes de salir', texto: 'Pachamapa junta tres capas en un solo mapa: tu ruta dividida en tramos, lo que avisa la gente y el clima de cada lugar.' },
  seguridad: { cielo: 'pm-cielo-salir', etiqueta: 'Antes de salir', titulo: 'Repasá la lista antes de arrancar', texto: 'Dos minutos que hacen la diferencia en la Quebrada y la Puna. Lo que marcás queda guardado en este teléfono.' },
  'a-quien-llamar': { cielo: 'pm-cielo-llamar', etiqueta: 'A quién llamar', titulo: 'El número correcto, según lo que pase', texto: 'Las llamadas a estos números funcionan aunque no tengas datos. Desde un celular, tocá el número para llamar.' },
  pacha: { cielo: 'pm-cielo-pacha', etiqueta: 'Asistente', titulo: 'Pacha te ayuda a viajar tranquilo', texto: 'Pacha es un cardón de la Quebrada que conoce el mapa. Preguntale cómo está la ruta o cómo usar la aplicación, y te responde con los datos del momento.' },
}

export default function Portada({ pagina, tema, onAlternarTema }: Props) {
  const escena = useRef<HTMLElement>(null)

  // Profundidad del encabezado: el puntero y el scroll mueven cada capa a distinta velocidad.
  useEffect(() => {
    const el = escena.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let cuadro = 0
    const programar = (aplicar: () => void) => {
      cancelAnimationFrame(cuadro)
      cuadro = requestAnimationFrame(aplicar)
    }
    const alMover = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      programar(() => {
        el.style.setProperty('--px', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3))
        el.style.setProperty('--py', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3))
      })
    }
    const alDesplazar = () => {
      if (window.scrollY < el.offsetHeight) programar(() => el.style.setProperty('--sy', String(Math.round(window.scrollY))))
    }
    window.addEventListener('pointermove', alMover, { passive: true })
    window.addEventListener('scroll', alDesplazar, { passive: true })
    return () => {
      cancelAnimationFrame(cuadro)
      window.removeEventListener('pointermove', alMover)
      window.removeEventListener('scroll', alDesplazar)
    }
  }, [])

  // Cada pagina empieza arriba.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pagina])

  const cabecera = pagina === 'inicio' ? null : CABECERAS[pagina]
  const siguiente = MENU[(PAGINAS.indexOf(pagina) + 1) % MENU.length]

  return (
    <div className="min-h-dvh">
      <header ref={escena} className={`pm-escena ${cabecera?.cielo ?? 'pm-portada-cielo'} relative overflow-hidden`}>
        <nav className="relative z-10 mx-auto flex max-w-5xl items-center gap-2 px-4 pt-3">
          <a href="#inicio" className="flex items-center gap-2" aria-label="Pachamapa, inicio">
            <img src={tema === 'oscuro' ? '/marca/pachamapa-pin-dark.svg' : '/marca/pachamapa-pin-original.svg'} alt="" className="h-11 w-auto" />
            <span className="pm-marca text-2xl leading-none text-orange-800">Pachamapa</span>
          </a>
          <BotonTema tema={tema} onAlternar={onAlternarTema} className="ml-auto bg-white/90 text-stone-700 shadow-sm" />
          <a href="#mapa" className="whitespace-nowrap rounded-full bg-orange-700 px-4 py-2 text-sm font-bold text-white">Abrir el mapa</a>
        </nav>
        <nav aria-label="Secciones" className="relative z-10 mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 py-2">
          {MENU.map((m) => (
            <a
              key={m.pagina}
              href={`#${m.pagina}`}
              aria-current={m.pagina === pagina ? 'page' : undefined}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-bold ${m.pagina === pagina ? 'bg-orange-800 text-white' : 'text-orange-800'}`}
            >
              {m.nombre}
            </a>
          ))}
        </nav>

        {cabecera && pagina !== 'inicio' ? (
          <div className="relative z-10 mx-auto grid max-w-5xl items-center gap-4 px-4 pb-8 pt-6 md:grid-cols-[1fr_20rem] md:pb-12 md:pt-10">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-orange-800">{cabecera.etiqueta}</p>
              <h1 className="pm-marca mt-3 text-4xl leading-tight sm:text-5xl">{cabecera.titulo}</h1>
              <p className="mt-4 max-w-xl text-lg text-stone-600">{cabecera.texto}</p>
              {pagina === 'pacha' && (
                <a href="#mapa-pacha" className={`${BOTON} mt-6 inline-block bg-orange-700 text-white`}>Hablar con Pacha</a>
              )}
            </div>
            <div aria-hidden="true" className="pm-caja-3d pointer-events-none mx-auto w-full max-w-xs">
              {ESCENAS[pagina]}
            </div>
          </div>
        ) : (
          <>
            <div className="relative z-10 mx-auto max-w-5xl px-4 pb-44 pt-6 sm:pb-56 sm:pt-10">
              <p className="text-sm font-bold uppercase tracking-widest text-orange-800">Quebrada de Humahuaca · Salinas Grandes</p>
              <h1 className="pm-marca mt-3 max-w-2xl text-4xl leading-tight sm:text-5xl">Clima y estado de la ruta en Jujuy, tramo por tramo</h1>
              <p className="mt-4 max-w-xl text-lg text-stone-600">
                En la Quebrada el clima cambia en pocos kilómetros: puede estar despejado en Tilcara y haber neblina cerrada en Volcán. Pachamapa te muestra en un solo mapa qué pasa en cada tramo.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a href="#mapa" className={`${BOTON} bg-orange-700 text-white`}>Ver el mapa ahora</a>
                <a href="#como-funciona" className={`${BOTON} border-2 border-stone-300 bg-white/90 text-stone-800`}>Cómo funciona</a>
              </div>
              <p className="mt-3 text-sm text-stone-500">Gratis, sin instalar nada y sin registrarte.</p>

              <div aria-hidden="true" className="pointer-events-none absolute right-6 top-6 hidden h-80 w-64 lg:block">
                <div className="pm-tablero relative h-full w-full rounded-3xl border border-stone-200 bg-white shadow-2xl">
                  <svg viewBox="0 0 256 320" className="absolute inset-0 h-full w-full" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 70h216M20 130h216M20 190h216M20 250h216M70 20v280M130 20v280M190 20v280" stroke="var(--pm-borde)" strokeWidth="1" />
                    <path className="pm-ruta-trazo" d="M150 22c-22 30 24 52 2 86s-70 30-92 62 30 52 62 70 40 34 34 58" stroke="#10b981" strokeWidth="7" />
                    <path className="pm-ruta-trazo" d="M77 150c-10 12-18 22-17 34" stroke="#dc2626" strokeWidth="7" />
                  </svg>
                  {AVISOS.map((a) => (
                    <span
                      key={a.lugar}
                      className="absolute flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 bg-white px-3 py-1.5 text-sm font-bold shadow-lg"
                      style={{ top: a.arriba, left: a.izquierda, borderColor: a.color, ['--z' as string]: `${a.z}px` }}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
                      {a.lugar} <span className="font-medium text-stone-600">{a.dato}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Cerros de la Quebrada: franjas de colores como los de Purmamarca. */}
            <span aria-hidden="true" className="absolute bottom-28 right-[16%] h-11 w-11 rounded-full sm:bottom-36 sm:h-14 sm:w-14" style={{ background: tema === 'oscuro' ? '#f3e7c9' : '#fbbf24', opacity: 0.9 }} />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-40 sm:h-52">
              {CERROS.map((c, i) => (
                <svg key={c.color} viewBox="0 0 1200 260" preserveAspectRatio="none" className="pm-capa h-full" style={{ ['--prof' as string]: c.prof, ['--orden' as string]: i }}>
                  <path d={c.d} fill={c.color} opacity={c.opacidad} />
                </svg>
              ))}
              <svg viewBox="0 0 1200 260" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-full w-full">
                <path d="M0 252C300 236 600 262 900 244S1150 250 1200 246V260H0z" fill="var(--pm-fondo)" />
              </svg>
            </div>
          </>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-4">
        {pagina === 'inicio' && (
          <>
            <section className="py-8">
              <h2 className="pm-marca text-2xl">Recorré Pachamapa</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {MENU.slice(1).map((m) => (
                  <li key={m.pagina} className="pm-inclinar" onPointerMove={inclinar} onPointerLeave={enderezar}>
                    <a href={`#${m.pagina}`} className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5">
                      {m.pagina === 'pacha' && <Pacha className="pm-relieve h-16 w-auto shrink-0" suelo={false} />}
                      <span>
                        <span className="block text-lg font-bold">{m.nombre} →</span>
                        <span className="mt-1 block text-sm leading-relaxed text-stone-600">{m.texto}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section className="py-6">
              <h2 className="pm-marca text-2xl">Rutas cubiertas</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {RUTAS.map((r) => (
                  <li key={r.ruta} className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-5">
                    <span className="flex h-12 shrink-0 items-center rounded-lg bg-orange-800 px-3 text-base font-extrabold text-white">{r.ruta}</span>
                    <div>
                      <h3 className="font-bold">{r.recorrido}</h3>
                      <p className="mt-0.5 text-sm text-stone-600">{r.detalle}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="my-8 rounded-3xl bg-orange-800 px-6 py-9 text-center text-white">
              <h2 className="pm-marca text-2xl">¿Trabajás en la ruta?</h2>
              <p className="mx-auto mt-2 max-w-xl text-orange-100">Agencias de turismo, transportistas y guías: recibí por WhatsApp las alertas de tus tramos antes de salir.</p>
              <a href="#mapa" className={`${BOTON} mt-6 inline-block bg-white text-orange-800`}>Entrar a Pachamapa</a>
            </section>
          </>
        )}

        {pagina === 'como-funciona' && (
          <>
            <section className="py-8">
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {FUNCIONES.map((f) => (
                  <li key={f.titulo} className="pm-inclinar" onPointerMove={inclinar} onPointerLeave={enderezar}>
                    <div className="rounded-2xl border border-stone-200 bg-white p-5">
                      <span className="pm-relieve flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-orange-800">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d={f.icono} />
                        </svg>
                      </span>
                      <h2 className="mt-3 text-lg font-bold">{f.titulo}</h2>
                      <p className="mt-1 text-sm leading-relaxed text-stone-600">{f.texto}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="py-6">
              <h2 className="pm-marca text-2xl">Tres estados, a simple vista</h2>
              <p className="mt-1 text-stone-600">Cada tramo se pinta con el peor estado entre el clima, los reportes y el riesgo por lluvia.</p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                {(['bien', 'atencion', 'problemas'] as const).map((e) => (
                  <li key={e} className={`rounded-2xl p-5 ${ESTADOS[e].fondo}`}>
                    <p className={`flex items-center gap-2 text-lg font-bold ${ESTADOS[e].texto}`}>
                      <span className="h-3.5 w-3.5 rounded-full" style={{ background: ESTADOS[e].color }} />
                      {ESTADOS[e].etiqueta}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{ESTADO_DETALLE[e]}</p>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {pagina === 'seguridad' && <AntesDeSalir />}
        {pagina === 'a-quien-llamar' && <AQuienLlamar />}

        {pagina === 'pacha' && (
          <section className="py-8">
            <ul className="grid gap-3 sm:grid-cols-3">
              {PACHA_SABE.map((p) => (
                <li key={p.titulo} className="pm-inclinar" onPointerMove={inclinar} onPointerLeave={enderezar}>
                  <div className="rounded-2xl border border-stone-200 bg-white p-5">
                    <h2 className="text-lg font-bold">{p.titulo}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-stone-600">{p.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
            <h2 className="pm-marca mt-8 text-2xl">Probá preguntarle</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {PREGUNTAS.map((p) => (
                <li key={p} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700">{p}</li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-stone-500">
              Pacha usa inteligencia artificial y puede equivocarse: es una ayuda, no una fuente oficial. Sin conexión responde solo las preguntas frecuentes. No guarda tus conversaciones.
            </p>
          </section>
        )}

        {pagina !== 'inicio' && (
          <a href={`#${siguiente.pagina}`} className="my-8 flex items-center justify-between gap-4 rounded-3xl bg-orange-800 px-6 py-6 text-white">
            <span>
              <span className="block text-sm text-orange-100">Seguí con</span>
              <span className="pm-marca block text-2xl">{siguiente.nombre}</span>
            </span>
            <span aria-hidden="true" className="text-3xl">→</span>
          </a>
        )}
      </main>

      <footer className="border-t border-stone-200 px-4 py-6 text-center text-xs text-stone-500">
        <p>Datos del clima: Open-Meteo (CC BY 4.0). Mapa base: © colaboradores de OpenStreetMap.</p>
        <p className="mt-1">Pachamapa · Pre-Hackatón Tren Solar, Jujuy 2026</p>
      </footer>
    </div>
  )
}
