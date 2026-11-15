import { etiquetaReporte } from './reportes'
import type { Alerta, AvisoPronostico, Estado, HoraPronostico, RespuestaTramos, Tramo } from './tipos'

// Sin señal en la ruta: se guarda la ultima respuesta del servidor y, mientras no haya conexion, se estima
// el estado de cada tramo con el pronostico por hora que venia en esos datos.
const CLAVE = 'pm-ultimos-datos'
const HORA_MS = 60 * 60 * 1000
// Pasado este tiempo los reportes de la gente ya pueden haber expirado: dejan de contar para el estado.
const VIGENCIA_REPORTES_MS = 2 * HORA_MS
const HORIZONTE_AVISO = 12
const NIVEL: Record<Estado, number> = { bien: 0, atencion: 1, problemas: 2 }
const peor = (a: Estado, b: Estado) => (NIVEL[a] >= NIVEL[b] ? a : b)

export function guardarDatos(datos: RespuestaTramos) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos))
  } catch {
    // Sin espacio o almacenamiento bloqueado: la aplicacion sigue funcionando con conexion.
  }
}

export function leerDatos(): RespuestaTramos | null {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) ?? 'null')
    return datos?.actualizado && Array.isArray(datos.tramos) ? datos : null
  } catch {
    return null
  }
}

function avisoProximo(horas: HoraPronostico[]): AvisoPronostico | null {
  const proximas = horas.slice(0, HORIZONTE_AVISO)
  const estado = proximas.reduce<Estado>((p, h) => peor(p, h.estado), 'bien')
  if (estado === 'bien') return null
  const inicio = proximas.findIndex((h) => h.estado === estado)
  let fin = inicio
  while (fin + 1 < proximas.length && proximas[fin + 1].estado === estado) fin += 1
  const motivos = [...new Set(proximas.slice(inicio, fin + 1).flatMap((h) => h.motivos))]
  return { estado, desde: proximas[inicio].hora, hasta: proximas[fin].hora, motivos }
}

function estimarTramo(t: Tramo, ahora: number, reportesVigentes: boolean): Tramo {
  const horas = t.pronostico?.horas ?? []
  const actual = horas.findLast((h) => new Date(h.hora).getTime() <= ahora && ahora - new Date(h.hora).getTime() < HORA_MS)
  const futuras = horas.filter((h) => new Date(h.hora).getTime() > ahora)
  const porReportes = reportesVigentes ? t.estadoReportes : { estado: 'bien' as Estado, motivos: [] }
  const base = { ...t, estimado: true, restriccion: reportesVigentes ? t.restriccion : null, pronostico: { horas: futuras, aviso: avisoProximo(futuras) } }
  // Todavia no empezo la primera hora del pronostico: vale el ultimo clima recibido.
  if (!actual && horas.length > 0 && ahora < new Date(horas[0].hora).getTime()) return { ...base, estimado: false, estado: t.estado, estadoLinea: t.estadoLinea, motivos: t.motivos }
  if (!actual) return { ...base, clima: null, estadoLinea: 'atencion', estado: peor('atencion', porReportes.estado), motivos: [...porReportes.motivos, 'Sin estimación: el pronóstico guardado ya venció'] }
  return {
    ...base,
    clima: {
      temperatura: actual.temperatura ?? NaN,
      sensacion: actual.temperatura ?? NaN,
      codigo: 0,
      nubosidad: NaN,
      visibilidad: actual.visibilidad,
      viento: actual.viento,
      rafagas: actual.rafagas,
      precipitacion: actual.precipitacion,
      lluvia: actual.precipitacion,
      nieve: 0,
      esDia: actual.esDia,
      medido: actual.hora,
      descripcion: actual.descripcion,
      icono: actual.icono,
    },
    estado: peor(actual.estado, porReportes.estado),
    estadoLinea: actual.estado,
    motivos: [...porReportes.motivos, ...actual.motivos],
  }
}

function alertasDe(tramos: Tramo[]): Alerta[] {
  const alertas: Alerta[] = []
  for (const t of tramos) {
    const base = { tramoId: t.id, tramoIds: [t.id], tramo: t.nombre, referencia: `${t.ruta} · ${t.kmInicio}–${t.kmFin} km` }
    if (t.restriccion) alertas.push({ ...base, id: `${t.id}:restriccion:${t.restriccion.tipo}:${t.restriccion.confirmado}`, clase: 'restriccion', nivel: t.restriccion.confirmado ? 'problemas' : 'atencion', mensaje: t.restriccion.mensaje })
    else if (t.estado === 'problemas') alertas.push({ ...base, id: `${t.id}:actual`, clase: 'actual', nivel: 'problemas', mensaje: t.motivos.join(' · ') })
    const otros = t.reportes.filter((g) => g.tipo !== t.restriccion?.tipo)
    if (otros.length > 0 && (t.restriccion || t.estado !== 'problemas')) alertas.push({ ...base, id: `${t.id}:reporte:${otros.map((g) => `${g.tipo}${g.confirmado}`).join(',')}`, clase: 'reporte', nivel: 'atencion', mensaje: otros.map((g) => `${etiquetaReporte(g.tipo)}${g.confirmado ? '' : ' (sin confirmar)'}`).join(' · ') })
    const aviso = t.pronostico?.aviso
    if (aviso && NIVEL[aviso.estado] > NIVEL[t.estado]) alertas.push({ ...base, id: `${t.id}:previsto:${aviso.estado}`, clase: 'previsto', nivel: aviso.estado, mensaje: aviso.motivos.join(' · '), desde: aviso.desde, hasta: aviso.hasta })
    if (t.riesgo?.nivel === 'alto') alertas.push({ ...base, id: `${t.id}:riesgo`, clase: 'riesgo', nivel: 'atencion', mensaje: 'Riesgo alto de aludes o crecidas por lluvia' })
  }
  return agrupar(alertas, tramos).sort((a, b) => NIVEL[b.nivel] - NIVEL[a.nivel])
}

// Igual que en el servidor: los tramos vecinos con la misma alerta se juntan en una sola.
function agrupar(alertas: Alerta[], tramos: Tramo[]): Alerta[] {
  const orden = new Map(tramos.map((t, i) => [t.id, i]))
  const clave = (a: Alerta) => `${a.id.slice(a.tramoId.length)}|${a.mensaje}|${a.desde}|${a.hasta}`
  const grupos: Alerta[] = []
  for (const a of [...alertas].sort((x, y) => orden.get(x.tramoId)! - orden.get(y.tramoId)!)) {
    const t = tramos[orden.get(a.tramoId)!]
    const previo = tramos[orden.get(a.tramoId)! - 1]
    const abierto = previo?.rutaId === t.rutaId ? grupos.find((g) => g.tramoIds.at(-1) === previo.id && clave(g) === clave(a)) : undefined
    if (!abierto) {
      grupos.push({ ...a })
      continue
    }
    abierto.tramoIds = [...abierto.tramoIds, t.id]
    const primero = tramos[orden.get(abierto.tramoId)!]
    const localidades = abierto.tramoIds.map((id) => tramos[orden.get(id)!]).filter((x) => x.localidad).map((x) => x.nombre)
    abierto.tramo = localidades.length > 1 ? `${localidades[0]} – ${localidades.at(-1)}` : (localidades[0] ?? primero.nombre)
    abierto.referencia = `${primero.ruta} · ${primero.kmInicio}–${t.kmFin} km`
  }
  return grupos
}

// Lleva los ultimos datos recibidos a la hora actual usando el pronostico que traian.
export function estimar(datos: RespuestaTramos, ahora = Date.now()): RespuestaTramos {
  const edad = ahora - new Date(datos.actualizado ?? 0).getTime()
  const tramos = datos.tramos.map((t) => estimarTramo(t, ahora, edad <= VIGENCIA_REPORTES_MS))
  return { ...datos, tramos, alertas: alertasDe(tramos) }
}

// Guarda de antemano el mapa de fondo de toda la ruta (unas 80 teselas), para que se vea sin conexion
// aunque no se haya recorrido antes. Lo guarda el service worker al pasar el pedido por el.
const CLAVE_MAPA = 'pm-mapa-guardado'
const SEMANA_MS = 7 * 24 * HORA_MS
const ZONA = { norte: -22.7, sur: -24.22, oeste: -65.92, este: -65.25 }

const columna = (lon: number, z: number) => Math.floor(((lon + 180) / 360) * 2 ** z)
const fila = (lat: number, z: number) => Math.floor(((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** z)

export async function precargarMapa() {
  const conexion = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (!navigator.onLine || conexion?.saveData || !navigator.serviceWorker?.controller) return
  if (Date.now() - Number(localStorage.getItem(CLAVE_MAPA) ?? 0) < SEMANA_MS) return
  const teselas: string[] = []
  for (let z = 8; z <= 11; z += 1) {
    for (let x = columna(ZONA.oeste, z); x <= columna(ZONA.este, z); x += 1) {
      for (let y = fila(ZONA.norte, z); y <= fila(ZONA.sur, z); y += 1) teselas.push(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`)
    }
  }
  try {
    // De a pocas a la vez, para no cargar el servidor de OpenStreetMap ni la conexion del telefono.
    for (let i = 0; i < teselas.length; i += 4) await Promise.all(teselas.slice(i, i + 4).map((url) => fetch(url, { mode: 'no-cors' })))
    localStorage.setItem(CLAVE_MAPA, String(Date.now()))
  } catch {
    // Se corto la conexion a mitad de camino: se reintenta la proxima vez que se abra la aplicacion.
  }
}
