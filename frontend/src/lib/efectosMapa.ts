import type { Dificultad, TipoDificultad } from './dificultades'
import type { Estado, Tramo } from './tipos'

// Efectos translucidos sobre el mapa: una zona por cada grupo de tramos seguidos con las mismas dificultades.
// Son SVG animados con CSS (index.css, clases pm-fx-*): no tapan la ruta ni reciben toques.

export interface ZonaEfecto {
  id: string
  tramoId: string
  nivel: Estado
  titulo: string
  lugar: string
  tipos: TipoDificultad[]
  // Tramo donde se ancla la burbuja de texto.
  ancla: Tramo
  limites: [[number, number], [number, number]]
}

const NIVEL: Record<Estado, number> = { bien: 0, atencion: 1, problemas: 2 }
const MARGEN = 0.05 // grados (~5 km) alrededor de la ruta
const firma = (lista: Dificultad[]) => lista.map((d) => d.clave + d.titulo).join('|')

export function zonasDeEfecto(tramos: Tramo[], visibles: (t: Tramo) => Dificultad[], lineas: Record<string, [number, number][]>): ZonaEfecto[] {
  const zonas: ZonaEfecto[] = []
  let grupo: Tramo[] = []
  const cerrar = () => {
    if (grupo.length === 0) return
    const dificultades = visibles(grupo[0])
    const puntos = grupo.flatMap((t) => lineas[t.id] ?? [[t.lat, t.lon] as [number, number]])
    const lats = puntos.map((p) => p[0])
    const lons = puntos.map((p) => p[1])
    const localidades = grupo.filter((t) => t.localidad).map((t) => t.nombre)
    const medio = grupo[Math.floor(grupo.length / 2)]
    zonas.push({
      id: `${grupo[0].id}:${grupo.length}:${firma(dificultades)}`,
      tramoId: grupo[0].id,
      nivel: dificultades.reduce<Estado>((peor, d) => (NIVEL[d.nivel] > NIVEL[peor] ? d.nivel : peor), 'atencion'),
      titulo: dificultades.slice(0, 2).map((d) => d.titulo).join(' · ') + (dificultades.length > 2 ? ` +${dificultades.length - 2}` : ''),
      lugar: localidades.length > 1 ? `${localidades[0]} – ${localidades.at(-1)}` : (localidades[0] ?? grupo[0].nombre),
      tipos: [...new Set(dificultades.map((d) => d.tipo))],
      ancla: medio,
      limites: [
        [Math.min(...lats) - MARGEN, Math.min(...lons) - MARGEN],
        [Math.max(...lats) + MARGEN, Math.max(...lons) + MARGEN],
      ],
    })
    grupo = []
  }
  for (const t of tramos) {
    const actual = firma(visibles(t))
    if (grupo.length > 0 && (grupo[0].rutaId !== t.rutaId || firma(visibles(grupo[0])) !== actual)) cerrar()
    if (actual !== '') grupo.push(t)
  }
  cerrar()
  return zonas
}

// Numeros fijos (no al azar) para repartir gotas, copos y nubes: el dibujo es igual en cada render.
const reparto = (cantidad: number, semilla: number) => Array.from({ length: cantidad }, (_, i) => ((i * 61 + semilla * 37) % 97) / 97)

const nubes = (clase: string, cantidad: number) =>
  reparto(cantidad, 3)
    .map((r, i) => {
      const cx = 40 + r * 120
      const cy = 55 + ((i * 43) % 90)
      const rx = 55 + ((i * 17) % 30)
      return `<ellipse class="pm-fx-sombra" cx="${cx + 7}" cy="${cy + 12}" rx="${rx}" ry="${rx * 0.42}" style="animation-delay:-${i * 3.1}s"/><ellipse class="pm-fx-nube ${clase}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.42}" style="animation-delay:-${i * 3.1}s;animation-duration:${11 + i * 3}s"/>`
    })
    .join('')

const caida = (clase: string, cantidad: number, forma: (x: number, y: number) => string) =>
  reparto(cantidad, 7)
    .map((r, i) => `<g class="${clase}" style="animation-delay:-${(r * 1.7).toFixed(2)}s">${forma(18 + ((i * 164) / cantidad), 30 + r * 110)}</g>`)
    .join('')

const pulso = (color: string) =>
  [0, 1].map((i) => `<circle class="pm-fx-pulso" cx="100" cy="100" r="78" fill="none" stroke="${color}" stroke-width="5" style="animation-delay:-${i * 1.2}s"/>`).join('') +
  `<circle cx="100" cy="100" r="78" fill="${color}" opacity="0.1"/>`

const DIBUJO: Partial<Record<TipoDificultad, (nivel: Estado) => string>> = {
  neblina: (nivel) => nubes('pm-fx-niebla', nivel === 'problemas' ? 6 : 4),
  lluvia: (nivel) => nubes('pm-fx-gris', 3) + caida('pm-fx-gota', nivel === 'problemas' ? 16 : 9, (x, y) => `<line x1="${x}" y1="${y}" x2="${x - 4}" y2="${y + 13}"/>`),
  tormenta: () => nubes('pm-fx-gris pm-fx-oscura', 4) + caida('pm-fx-gota', 16, (x, y) => `<line x1="${x}" y1="${y}" x2="${x - 4}" y2="${y + 13}"/>`) + '<path class="pm-fx-rayo" d="M108 52 88 100h16l-12 46 34-58h-17l13-36z"/>',
  nevada: (nivel) => nubes('pm-fx-niebla', 3) + caida('pm-fx-copo', nivel === 'problemas' ? 16 : 10, (x, y) => `<circle cx="${x}" cy="${y}" r="2.6"/>`),
  viento: () => [60, 88, 116, 144].map((y, i) => `<path class="pm-fx-viento" d="M10 ${y}c40-14 70 12 110 0s50-10 70 0" style="animation-delay:-${i * 0.6}s"/>`).join(''),
  hielo: () => '<ellipse class="pm-fx-hielo" cx="100" cy="100" rx="84" ry="70"/>' + reparto(7, 5).map((r, i) => `<path class="pm-fx-brillo" transform="translate(${30 + r * 140} ${45 + ((i * 53) % 110)})" d="M0-7 1.8-1.8 7 0 1.8 1.8 0 7-1.8 1.8-7 0-1.8-1.8z" style="animation-delay:-${i * 0.5}s"/>`).join(''),
}

// Lo que no es clima (cortes, derrumbes, accidentes, obras, riesgo...) se marca con un pulso del color del nivel.
export function svgEfecto(zona: ZonaEfecto) {
  const conClima = zona.tipos.filter((t) => DIBUJO[t])
  const partes = conClima.map((t) => DIBUJO[t]!(zona.nivel))
  if (conClima.length < zona.tipos.length) partes.unshift(pulso(zona.nivel === 'problemas' ? '#dc2626' : '#f59e0b'))
  return `<defs>
    <radialGradient id="pm-g-niebla"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".55" stop-color="#e2e8f0" stop-opacity=".6"/><stop offset="1" stop-color="#cbd5e1" stop-opacity="0"/></radialGradient>
    <radialGradient id="pm-g-gris"><stop offset="0" stop-color="#cbd5e1" stop-opacity=".9"/><stop offset=".6" stop-color="#94a3b8" stop-opacity=".5"/><stop offset="1" stop-color="#64748b" stop-opacity="0"/></radialGradient>
    <radialGradient id="pm-g-oscura"><stop offset="0" stop-color="#64748b" stop-opacity=".9"/><stop offset=".6" stop-color="#475569" stop-opacity=".5"/><stop offset="1" stop-color="#334155" stop-opacity="0"/></radialGradient>
    <radialGradient id="pm-g-sombra"><stop offset="0" stop-color="#0f172a" stop-opacity=".22"/><stop offset="1" stop-color="#0f172a" stop-opacity="0"/></radialGradient>
    <radialGradient id="pm-g-hielo"><stop offset="0" stop-color="#bae6fd" stop-opacity=".75"/><stop offset=".7" stop-color="#7dd3fc" stop-opacity=".35"/><stop offset="1" stop-color="#38bdf8" stop-opacity="0"/></radialGradient>
  </defs>${partes.join('')}`
}
