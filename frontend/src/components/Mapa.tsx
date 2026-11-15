import { useEffect, useRef } from 'react'
import L from 'leaflet'
import rutas from '../data/rutas.json'
import { svgClima } from '../lib/iconos'
import { grados } from '../lib/formato'
import type { Tramo } from '../lib/tipos'

// Lado en que se dibuja la etiqueta de cada punto, para que no se pisen entre vecinos.
const LADO: Record<string, 'izq' | 'der' | 'arriba'> = {
  'san-salvador': 'izq',
  volcan: 'izq',
  purmamarca: 'izq',
  tilcara: 'izq',
  humahuaca: 'izq',
  'cuesta-de-lipan': 'izq',
  'salinas-grandes': 'arriba',
}

const LIMITES: L.LatLngBoundsExpression = [
  [-24.22, -65.92],
  [-22.7, -65.25],
]

function iconoMarcador(tramo: Tramo, seleccionado: boolean) {
  const reportes = tramo.reportes.reduce((total, r) => total + r.cantidad, 0)
  const html = `<div class="pm-marcador pm-${LADO[tramo.id] ?? 'der'} pm-${tramo.estado}${seleccionado ? ' pm-sel' : ''}">
    <span class="pm-punto"></span>
    <span class="pm-pildora">${svgClima(tramo.clima?.icono, 22)}<b>${grados(tramo.clima?.temperatura)}</b>${reportes ? `<i>${reportes}</i>` : ''}</span>
  </div>`
  return L.divIcon({ html, className: '', iconSize: [0, 0] })
}

interface Props {
  tramos: Tramo[]
  seleccionado: string | null
  onSeleccionar: (id: string) => void
}

export default function Mapa({ tramos, seleccionado, onSeleccionar }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const capa = useRef<L.LayerGroup | null>(null)
  const alSeleccionar = useRef(onSeleccionar)
  const ultimosTramos = useRef(tramos)

  useEffect(() => {
    alSeleccionar.current = onSeleccionar
    ultimosTramos.current = tramos
  })

  useEffect(() => {
    const m = L.map(contenedor.current!, { zoomControl: false, minZoom: 7, maxZoom: 15 })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(m)
    L.control.zoom({ position: 'topright' }).addTo(m)
    for (const ruta of rutas) {
      const linea = ruta.linea as [number, number][]
      L.polyline(linea, { color: '#ffffff', weight: 8, opacity: 0.9, interactive: false }).addTo(m)
      L.polyline(linea, { color: '#c2410c', weight: 4, opacity: 0.9, interactive: false }).addTo(m)
    }
    // En pantallas chicas el encuadre completo queda demasiado lejos: se prioriza que se lean los puntos.
    if (m.getBoundsZoom(LIMITES, false, L.point(48, 48)) < 8) m.setView([-23.56, -65.52], 8)
    else m.fitBounds(LIMITES, { padding: [24, 24] })
    const ajustarTamano = () => m.getContainer().classList.toggle('pm-compacto', m.getZoom() <= 8)
    m.on('zoomend', ajustarTamano)
    ajustarTamano()
    capa.current = L.layerGroup().addTo(m)
    mapa.current = m
    return () => {
      m.remove()
      mapa.current = null
    }
  }, [])

  useEffect(() => {
    const grupo = capa.current
    if (!grupo) return
    grupo.clearLayers()
    for (const tramo of tramos) {
      const activo = tramo.id === seleccionado
      L.marker([tramo.lat, tramo.lon], {
        icon: iconoMarcador(tramo, activo),
        title: tramo.nombre,
        alt: tramo.nombre,
        zIndexOffset: activo ? 1000 : tramo.estado === 'problemas' ? 200 : tramo.estado === 'atencion' ? 100 : 0,
      })
        .on('click', () => alSeleccionar.current(tramo.id))
        .addTo(grupo)
    }
  }, [tramos, seleccionado])

  useEffect(() => {
    const m = mapa.current
    const tramo = ultimosTramos.current.find((t) => t.id === seleccionado)
    if (m && tramo) m.flyTo([tramo.lat, tramo.lon], Math.max(m.getZoom(), 11), { duration: 0.6 })
  }, [seleccionado])

  return <div ref={contenedor} className="h-full w-full" />
}
