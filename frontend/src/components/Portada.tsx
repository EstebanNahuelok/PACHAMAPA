import BotonTema from './BotonTema'
import { ESTADOS } from '../lib/formato'
import type { Tema } from '../lib/tema'

interface Props {
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

const BOTON = 'rounded-xl px-6 py-3.5 text-center text-base font-bold shadow-sm'

export default function Portada({ tema, onAlternarTema }: Props) {
  return (
    <div className="min-h-dvh">
      <header className="pm-portada-cielo relative overflow-hidden">
        <nav className="relative z-10 mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
          <img src="/favicon.svg" alt="" className="h-8 w-8 rounded-lg" />
          <span className="text-lg font-bold tracking-tight">Pachamapa</span>
          <BotonTema tema={tema} onAlternar={onAlternarTema} className="ml-auto bg-white/90 text-stone-700 shadow-sm" />
          <a href="#mapa" className="rounded-full bg-orange-700 px-4 py-2 text-sm font-bold text-white">Abrir el mapa</a>
        </nav>

        <div className="relative z-10 mx-auto max-w-5xl px-4 pb-44 pt-8 sm:pb-56 sm:pt-14">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-800">Quebrada de Humahuaca · Salinas Grandes</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">Clima y estado de la ruta en Jujuy, tramo por tramo</h1>
          <p className="mt-4 max-w-xl text-lg text-stone-600">
            En la Quebrada el clima cambia en pocos kilómetros: puede estar despejado en Tilcara y haber neblina cerrada en Volcán. Pachamapa te muestra en un solo mapa qué pasa en cada tramo.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href="#mapa" className={`${BOTON} bg-orange-700 text-white`}>Ver el mapa ahora</a>
            <a href="#como-funciona" className={`${BOTON} border-2 border-stone-300 bg-white/90 text-stone-800`}>Cómo funciona</a>
          </div>
          <p className="mt-3 text-sm text-stone-500">Gratis, sin instalar nada y sin registrarte.</p>
        </div>

        {/* Cerros de la Quebrada: franjas de colores como los de Purmamarca. */}
        <span aria-hidden="true" className="absolute bottom-28 right-[16%] h-11 w-11 rounded-full sm:bottom-36 sm:h-14 sm:w-14" style={{ background: tema === 'oscuro' ? '#f3e7c9' : '#fbbf24', opacity: 0.9 }} />
        <svg viewBox="0 0 1200 260" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-x-0 bottom-0 h-40 w-full sm:h-52">
          <path d="M0 150 180 70 330 130 520 40 700 125 860 60 1040 120 1200 75V260H0z" fill="#7c5a8a" opacity="0.55" />
          <path d="M0 185 150 120 320 170 480 100 660 165 840 105 1010 160 1200 120V260H0z" fill="#b4533a" opacity="0.8" />
          <path d="M0 215 170 165 340 205 520 150 700 200 880 155 1050 198 1200 170V260H0z" fill="#d98a3d" opacity="0.9" />
          <path d="M0 240 200 205 380 232 560 198 760 230 940 204 1200 226V260H0z" fill="#e3b96a" />
          <path d="M0 252C300 236 600 262 900 244S1150 250 1200 246V260H0z" fill="var(--pm-fondo)" />
        </svg>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <section id="como-funciona" className="scroll-mt-4 py-10">
          <h2 className="text-2xl font-extrabold tracking-tight">Todo lo que necesitás antes de salir</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FUNCIONES.map((f) => (
              <li key={f.titulo} className="rounded-2xl border border-stone-200 bg-white p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-orange-800">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={f.icono} />
                  </svg>
                </span>
                <h3 className="mt-3 text-lg font-bold">{f.titulo}</h3>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">{f.texto}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="py-6">
          <h2 className="text-2xl font-extrabold tracking-tight">Tres estados, a simple vista</h2>
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

        <section className="py-6">
          <h2 className="text-2xl font-extrabold tracking-tight">Rutas cubiertas</h2>
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
          <h2 className="text-2xl font-extrabold tracking-tight">¿Trabajás en la ruta?</h2>
          <p className="mx-auto mt-2 max-w-xl text-orange-100">Agencias de turismo, transportistas y guías: recibí por WhatsApp las alertas de tus tramos antes de salir.</p>
          <a href="#mapa" className={`${BOTON} mt-6 inline-block bg-white text-orange-800`}>Entrar a Pachamapa</a>
        </section>
      </main>

      <footer className="border-t border-stone-200 px-4 py-6 text-center text-xs text-stone-500">
        <p>Datos del clima: Open-Meteo (CC BY 4.0). Mapa base: © colaboradores de OpenStreetMap.</p>
        <p className="mt-1">Pachamapa · Pre-Hackatón Tren Solar, Jujuy 2026</p>
      </footer>
    </div>
  )
}
