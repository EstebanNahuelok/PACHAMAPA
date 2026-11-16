import L from 'leaflet'
import { ZOOM_GUARDADO, ZOOM_ZONA } from './offline'

const URL_TESELAS = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const VACIA = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='

// Capa de fondo de OpenStreetMap. Las teselas se piden con CORS para que el navegador las pueda guardar
// sin ocupar de mas. Sin conexion solo esta guardada toda la zona hasta ZOOM_ZONA y el entorno de la ruta
// hasta ZOOM_GUARDADO: al acercar mas se agrandan esas teselas en lugar de dejar el mapa vacio, con una
// capa de respaldo debajo para lo que queda lejos de la ruta.
export function capaBase(mapa: L.Map) {
  const opciones = { maxZoom: 19, crossOrigin: true, errorTileUrl: VACIA }
  const capa = L.tileLayer(URL_TESELAS, {
    ...opciones,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapa)
  const respaldo = L.tileLayer(URL_TESELAS, { ...opciones, maxNativeZoom: ZOOM_ZONA, zIndex: 0 })
  // navigator.onLine dice que hay red aunque el wifi no tenga salida: si falla una tesela tambien se pasa a lo guardado.
  let sinRed = !navigator.onLine
  let reintento: ReturnType<typeof setTimeout> | undefined
  const ajustar = () => {
    capa.options.maxNativeZoom = sinRed ? ZOOM_GUARDADO : 19
    if (sinRed) respaldo.addTo(mapa)
    else respaldo.remove()
    capa.redraw()
  }
  const conRed = () => {
    sinRed = false
    ajustar()
  }
  const sinConexion = () => {
    if (sinRed) return
    sinRed = true
    ajustar()
    clearTimeout(reintento)
    reintento = setTimeout(() => navigator.onLine && conRed(), 60_000)
  }
  ajustar()
  capa.on('tileerror', sinConexion)
  window.addEventListener('online', conRed)
  window.addEventListener('offline', sinConexion)
  mapa.on('unload', () => {
    clearTimeout(reintento)
    window.removeEventListener('online', conRed)
    window.removeEventListener('offline', sinConexion)
  })
  return capa
}
