import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { capaBase } from '../lib/mapaBase'
import { ESTADOS } from '../lib/formato'
import type { Viaje } from '../lib/viaje'

interface Props {
  viaje: Viaje | null
  posicion: { lat: number; lon: number; rumbo: number | null } | null
  // Navegando: el mapa sigue la posicion de cerca; si no, muestra el viaje entero.
  navegando: boolean
  siguiendo: boolean
  noche: boolean
  onMover: () => void
}

const flecha = (rumbo: number | null) =>
  L.divIcon({
    className: '',
    iconSize: [0, 0],
    html: `<div class="pm-puck"><svg viewBox="0 0 24 24" width="30" height="30" style="transform:rotate(${rumbo ?? 0}deg)">${rumbo == null ? '<circle cx="12" cy="12" r="6" fill="#fff"/>' : '<path d="M12 3l7 17-7-4-7 4z" fill="#fff"/>'}</svg></div>`,
  })

// Mapa de un viaje por la Argentina: el camino pintado con el estado previsto de cada tramo al pasar.
export default function MapaViaje({ viaje, posicion, navegando, siguiendo, noche, onMover }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const capa = useRef<L.LayerGroup | null>(null)
  const alMover = useRef(onMover)

  useEffect(() => {
    alMover.current = onMover
  })

  useEffect(() => {
    const m = L.map(contenedor.current!, { zoomControl: false, minZoom: 4, maxZoom: 18 })
    capaBase(m)
    m.setView([-38.4, -63.6], 4)
    m.on('dragstart', () => alMover.current())
    capa.current = L.layerGroup().addTo(m)
    mapa.current = m
    return () => {
      m.remove()
      mapa.current = null
    }
  }, [])

  useEffect(() => {
    const grupo = capa.current
    const m = mapa.current
    if (!grupo || !m) return
    grupo.clearLayers()
    if (!viaje) return
    L.polyline(viaje.linea, { color: '#fff', weight: 13, interactive: false }).addTo(grupo)
    for (const t of viaje.tramos) {
      L.polyline(viaje.linea.slice(t.desdePunto, t.hastaPunto + 1), { color: ESTADOS[t.estado].color, weight: 8, interactive: false }).addTo(grupo)
    }
    L.marker(viaje.linea.at(-1)!, { interactive: false, icon: L.divIcon({ className: '', iconSize: [0, 0], html: '<div class="pm-destino"></div>' }) }).addTo(grupo)
  }, [viaje])

  useEffect(() => {
    const m = mapa.current
    if (!m || !viaje || navegando) return
    m.fitBounds(L.latLngBounds(viaje.linea), { padding: [40, 40] })
  }, [viaje, navegando])

  const puck = useRef<L.Marker | null>(null)
  useEffect(() => {
    const m = mapa.current
    puck.current?.remove()
    puck.current = posicion && m ? L.marker([posicion.lat, posicion.lon], { interactive: false, zIndexOffset: 2000, icon: flecha(posicion.rumbo) }).addTo(m) : null
    if (m && posicion && navegando && siguiendo) m.setView([posicion.lat, posicion.lon], Math.max(m.getZoom(), 16), { animate: true })
  }, [posicion, navegando, siguiendo])

  return <div ref={contenedor} className={`pm-nav absolute inset-0 ${noche ? 'pm-noche' : ''}`} />
}
