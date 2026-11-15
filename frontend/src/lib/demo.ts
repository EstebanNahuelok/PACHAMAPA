import { etiquetaReporte } from './reportes'
import type { Estado, GrupoReportes, TipoReporte, Tramo } from './tipos'

// Demo con alertas: un viaje simulado de Maimara a Huacalera con dificultades inventadas en cada tramo,
// para mostrar como se ve la navegacion cuando la ruta esta complicada. Nada de esto se guarda ni se envia.
export const DEMO_ALERTAS = { desde: 'maimara', hasta: 'huacalera', duracionMs: 75000, velocidad: 70 }

interface Escena {
  reportes?: [tipo: TipoReporte, confirmado: boolean, comentario: string][]
  clima?: string
  estado: Estado
}

// Una escena por tramo de 5 km, en orden desde la salida.
const ESCENAS: Escena[] = [
  { estado: 'bien' },
  { estado: 'problemas', reportes: [['crecida', true, 'Baja agua del Huasamayo sobre la calzada']] },
  { estado: 'atencion', reportes: [['barro', false, 'Barro y piedras en la mano al norte']] },
  { estado: 'problemas', reportes: [['derrumbe', true, 'Media calzada, pasa un vehículo por vez'], ['fila', false, '']] },
  { estado: 'problemas', clima: 'Visibilidad muy reducida' },
  { estado: 'atencion', reportes: [['obras', true, 'Banderillero, desvío por banquina'], ['bache', false, '']] },
]

export function tramosDemo(tramos: Tramo[]): Tramo[] {
  const inicio = tramos.findIndex((t) => t.localidad === DEMO_ALERTAS.desde)
  const ahora = new Date().toISOString()
  return tramos.map((t, i) => {
    const escena = ESCENAS[i - inicio]
    if (!escena) return t
    const reportes: GrupoReportes[] = (escena.reportes ?? []).map(([tipo, confirmado, comentario]) => ({ tipo, grave: !['barro', 'bache', 'obras', 'fila'].includes(tipo), cantidad: confirmado ? 3 : 1, confirmado, ultimo: ahora, comentarios: comentario ? [comentario] : [], puntos: [{ lat: t.lat, lon: t.lon, cantidad: confirmado ? 3 : 1, confirmado, ultimo: ahora, comentarios: comentario ? [comentario] : [] }] }))
    const deReportes = reportes.map((r) => `Reporte ${r.confirmado ? 'confirmado' : 'sin confirmar'}: ${etiquetaReporte(r.tipo).toLowerCase()}`)
    // Sin pronostico: en la demo vale lo inventado, no lo que se espera de verdad para la hora de llegada.
    return { ...t, reportes, estado: escena.estado, estadoLinea: escena.clima ? escena.estado : 'bien', motivos: [...deReportes, ...(escena.clima ? [escena.clima] : [])], estadoReportes: { estado: reportes.length ? escena.estado : 'bien', motivos: deReportes }, pronostico: null, riesgo: null, restriccion: null }
  })
}
