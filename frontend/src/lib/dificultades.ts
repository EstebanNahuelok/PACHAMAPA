import { haceCuanto, mm, rangoHoras } from './formato'
import { etiquetaReporte } from './reportes'
import type { Estado, HoraPronostico, TipoReporte, Tramo } from './tipos'

// Dificultades viales de un tramo: lo que reporta la gente, lo que se deduce del clima, el riesgo por lluvia
// y lo que se espera para las proximas horas. Es lo que se marca sobre el mapa y en el modo navegacion.
export type TipoDificultad = TipoReporte | 'lluvia' | 'tormenta' | 'viento' | 'riesgo'

export interface Dificultad {
  clave: string
  tipo: TipoDificultad
  titulo: string
  detalle: string
  nivel: Estado
  origen: 'reporte' | 'clima' | 'riesgo' | 'previsto'
}

// Motivos que calcula el servidor a partir del clima (backend/src/services/estado.js).
const POR_MOTIVO: Record<string, { tipo: TipoDificultad; nivel: Estado; detalle: string }> = {
  'Visibilidad muy reducida': { tipo: 'neblina', nivel: 'problemas', detalle: 'Menos de 200 m de visibilidad. Bajá la velocidad y prendé las luces bajas.' },
  Neblina: { tipo: 'neblina', nivel: 'atencion', detalle: 'Visibilidad reducida. Prendé las luces bajas.' },
  Tormenta: { tipo: 'tormenta', nivel: 'problemas', detalle: 'Tormenta en la zona: puede haber agua, barro o piedras sobre la calzada.' },
  'Lluvia fuerte': { tipo: 'lluvia', nivel: 'problemas', detalle: 'Lluvia fuerte: posible agua sobre la calzada y arroyos crecidos.' },
  'Calzada mojada': { tipo: 'lluvia', nivel: 'atencion', detalle: 'Lluvia o llovizna: la calzada está mojada.' },
  'Nevada fuerte': { tipo: 'nevada', nivel: 'problemas', detalle: 'Nevada fuerte: puede haber restricciones para circular.' },
  Nevada: { tipo: 'nevada', nivel: 'atencion', detalle: 'Está nevando: calzada resbaladiza.' },
  'Ráfagas muy fuertes': { tipo: 'viento', nivel: 'problemas', detalle: 'Ráfagas de más de 80 km/h.' },
  'Viento fuerte': { tipo: 'viento', nivel: 'atencion', detalle: 'Ráfagas de más de 50 km/h.' },
  'Bajo cero: posible hielo': { tipo: 'hielo', nivel: 'atencion', detalle: 'Temperatura bajo cero: puede haber hielo sobre la calzada.' },
}

const NIVEL: Record<Estado, number> = { bien: 0, atencion: 1, problemas: 2 }

const delClima = (motivos: string[], origen: 'clima' | 'previsto', cuando = ''): Dificultad[] =>
  motivos.flatMap((m) => {
    const d = POR_MOTIVO[m]
    return d ? [{ ...d, clave: `${origen}:${d.tipo}`, titulo: cuando ? `${m} ${cuando}` : m, origen }] : []
  })

// Con `prevista` se usa el clima de esa hora del pronostico en lugar del actual (llegada estimada al tramo).
export function dificultadesDe(t: Tramo, prevista?: HoraPronostico): Dificultad[] {
  const lista: Dificultad[] = t.reportes.map((r) => ({
    clave: `reporte:${r.tipo}`,
    tipo: r.tipo,
    titulo: etiquetaReporte(r.tipo),
    detalle: `${r.confirmado ? 'Confirmado' : 'Sin confirmar'} · ${r.cantidad} ${r.cantidad === 1 ? 'reporte' : 'reportes'} · ${haceCuanto(r.ultimo)}${r.comentarios[0] ? ` · “${r.comentarios[0]}”` : ''}`,
    nivel: r.confirmado && r.grave !== false ? 'problemas' : 'atencion',
    origen: 'reporte',
  }))
  const tipos = new Set<TipoDificultad>(lista.map((d) => d.tipo))
  const sumar = (nuevas: Dificultad[]) => {
    for (const d of nuevas) {
      if (tipos.has(d.tipo)) continue
      lista.push(d)
      tipos.add(d.tipo)
    }
  }
  sumar(delClima(prevista ? prevista.motivos : t.motivos, 'clima'))
  if (t.riesgo?.nivel === 'alto') {
    sumar([{ clave: 'riesgo', tipo: 'riesgo', titulo: 'Riesgo alto de aludes o crecidas', detalle: `Llovió ${mm(t.riesgo.lluvia24)} en 24 h y se esperan ${mm(t.riesgo.prevista24)} más.`, nivel: 'atencion', origen: 'riesgo' }])
  }
  const aviso = t.pronostico?.aviso
  if (!prevista && aviso && NIVEL[aviso.estado] > NIVEL[t.estado]) sumar(delClima(aviso.motivos, 'previsto', rangoHoras(aviso.desde, aviso.hasta)))
  return lista.sort((a, b) => NIVEL[b.nivel] - NIVEL[a.nivel])
}
