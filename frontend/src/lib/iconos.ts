import type { Icono } from './tipos'

const AMARILLO = '#f59e0b'
const NUBE = '#94a3b8'
const NUBE_OSCURA = '#64748b'
const AZUL = '#3b82f6'

const nube = (color: string, dx = 0, dy = 0) =>
  `<g fill="${color}" transform="translate(${dx} ${dy})"><circle cx="10" cy="17" r="5"/><circle cx="16.5" cy="13.5" r="6.5"/><circle cx="23" cy="17.5" r="4.5"/><rect x="10" y="15" width="13" height="7"/></g>`

function sol(cx: number, cy: number, r: number) {
  let rayos = ''
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    const p = (d: number) => `${(cx + Math.cos(a) * d).toFixed(1)} ${(cy + Math.sin(a) * d).toFixed(1)}`
    rayos += `M${p(r + 2.5)}L${p(r + 5)}`
  }
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${AMARILLO}"/><path d="${rayos}" stroke="${AMARILLO}" stroke-width="2" stroke-linecap="round"/>`
}

const luna = (dx = 0, dy = 0, escala = 1) =>
  `<path transform="translate(${dx} ${dy}) scale(${escala})" d="M21.9 21A8 8 0 1 1 13.6 9.1 8.5 8.5 0 0 0 21.9 21z" fill="#6366f1"/>`

const lineas = (puntos: [number, number, number][], color: string, ancho = 2.2) =>
  `<path d="${puntos.map(([x, y, largo]) => `M${x} ${y}l${-largo * 0.35} ${largo}`).join('')}" stroke="${color}" stroke-width="${ancho}" stroke-linecap="round"/>`

const DIBUJOS: Record<Icono, string> = {
  sol: sol(16, 16, 6),
  luna: luna(),
  parcial: sol(11.5, 11.5, 4.5) + nube(NUBE, 2, 4),
  'parcial-noche': luna(-3.5, -3.5, 0.8) + nube(NUBE, 2, 4),
  nublado: nube('#cbd5e1', 3, -3) + nube(NUBE, -1, 3),
  neblina:
    nube(NUBE, 0, -5) +
    `<path d="M6 21h20M9 25.5h17M6 30h14" stroke="${NUBE_OSCURA}" stroke-width="2.2" stroke-linecap="round"/>`,
  llovizna: nube(NUBE, 0, -4) + lineas([[11, 22, 2], [16.5, 25, 2], [22, 22, 2]], '#60a5fa'),
  lluvia: nube(NUBE_OSCURA, 0, -4) + lineas([[11, 21.5, 6], [16.5, 21.5, 6], [22, 21.5, 6]], AZUL),
  nieve:
    nube(NUBE, 0, -4) +
    `<g fill="#38bdf8"><circle cx="10.5" cy="22.5" r="1.7"/><circle cx="16.5" cy="25" r="1.7"/><circle cx="22.5" cy="22.5" r="1.7"/><circle cx="13" cy="29" r="1.7"/><circle cx="20" cy="29" r="1.7"/></g>`,
  tormenta:
    nube('#475569', 0, -4) + `<path d="M17.5 19l-6 7.5h4l-1.5 5 6.5-8h-4l2-4.5z" fill="${AMARILLO}"/>`,
  viento: `<path d="M4 12h13.5a3.2 3.2 0 1 0-3.2-3.2M4 17.5h20a3.2 3.2 0 1 1-3.2 3.2M4 23h9.5a2.6 2.6 0 1 1-2.6 2.6" fill="none" stroke="#0d9488" stroke-width="2.3" stroke-linecap="round"/>`,
}

export function svgClima(icono: Icono | undefined, tamano = 24) {
  const dibujo = icono ? DIBUJOS[icono] : `<circle cx="16" cy="16" r="3" fill="${NUBE}"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${tamano}" height="${tamano}" aria-hidden="true">${dibujo}</svg>`
}

export const ICONOS = Object.keys(DIBUJOS) as Icono[]
