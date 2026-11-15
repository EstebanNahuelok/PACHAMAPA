import type { TipoDificultad } from './dificultades'

// Pictogramas de las dificultades viales, en trazo blanco para ir sobre un circulo de color.
const T = 'fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
const R = 'fill="#fff"'

const DIBUJOS: Record<TipoDificultad, string> = {
  corte: `<circle cx="12" cy="12" r="8" ${T}/><path d="M7.5 12h9" ${T} stroke-width="3"/>`,
  derrumbe: `<path d="M3 20L14 6" ${T}/><circle cx="16.5" cy="11" r="2.2" ${R}/><circle cx="12.5" cy="16.5" r="2.8" ${R}/><circle cx="19" cy="17.5" r="2" ${R}/>`,
  crecida: `<path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" ${T}/>`,
  barro: `<path d="M3 19h18" ${T}/><circle cx="8" cy="14.5" r="2.6" ${R}/><circle cx="14.5" cy="13" r="3.6" ${R}/><circle cx="19" cy="16" r="1.6" ${R}/>`,
  neblina: `<path d="M4 7h16M4 12h11M18 12h2M4 17h4M11 17h9" ${T}/>`,
  hielo: `<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" ${T}/>`,
  nevada: `<circle cx="7" cy="7" r="1.8" ${R}/><circle cx="16" cy="6" r="1.8" ${R}/><circle cx="12" cy="12" r="1.8" ${R}/><circle cx="6" cy="17" r="1.8" ${R}/><circle cx="17" cy="17" r="1.8" ${R}/>`,
  accidente: `<path d="M12 4l9 16H3z" ${T}/><path d="M12 10v4" ${T}/><circle cx="12" cy="17" r="1.1" ${R}/>`,
  bache: `<path d="M2 9h20" ${T}/><ellipse cx="12" cy="15.5" rx="7" ry="3" ${T}/>`,
  obras: `<path d="M10 4h4l4.5 14h-13z" ${T}/><path d="M8.6 10h6.8M3.5 20.5h17" ${T}/>`,
  fila: `<rect x="3" y="5" width="7" height="5" rx="1.2" ${R}/><rect x="13" y="5" width="7" height="5" rx="1.2" ${R}/><rect x="3" y="14" width="7" height="5" rx="1.2" ${R}/><rect x="13" y="14" width="7" height="5" rx="1.2" ${R}/>`,
  lluvia: `<path d="M7 4l-2 5M13 4l-2 5M19 4l-2 5M9 14l-2 5M15 14l-2 5" ${T}/>`,
  tormenta: `<path d="M13 2L5 13h6l-1.5 9L19 10h-6z" ${R}/>`,
  viento: `<path d="M3 9h11a3 3 0 1 0-3-3M3 14h15a3 3 0 1 1-3 3M3 19h6" ${T}/>`,
  riesgo: `<path d="M12 3l9 15H3z" ${T}/><path d="M7.5 14c1.5-1.4 3-1.4 4.500 0s3 1.400 4.500 0" ${T} stroke-width="1.6"/>`,
}

export const svgDificultad = (tipo: TipoDificultad, tamano = 16) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${tamano}" height="${tamano}" aria-hidden="true">${DIBUJOS[tipo] ?? DIBUJOS.accidente}</svg>`
