import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { capaBase } from '../lib/mapaBase'
import rutas from '../data/rutas.json'
import geo from '../data/tramos-geo.json'
import { ESTADOS } from '../lib/formato'
import { svgDificultad } from '../lib/iconosDificultad'
import type { Recorrido } from '../lib/navegacion'
import { trechoDe } from '../lib/ruta'

const LINEAS = geo as unknown as Record<string, [number, number][]>
const ZOOM_MANEJANDO = 13

interface Props {
  recorrido: Recorrido | null
  posicion: { lat: number; lon: number; rumbo: number | null } | null
  siguiendo: boolean
  fluido?: boolean
  noche: boolean
  onMover: () => void
}

const flecha = (rumbo: number | null) =>
  L.divIcon({
    className: '',
    iconSize: [0, 0],
    html: `<div class="pm-puck"><svg viewBox="0 0 24 24" width="30" height="30" style="transform:rotate(${rumbo ?? 0}deg)">${rumbo == null ? '<circle cx="12" cy="12" r="6" fill="#fff"/>' : '<path d="M12 3l7 17-7-4-7 4z" fill="#fff"/>'}</svg></div>`,
  })

// Mapa del modo navegacion: sigue la posicion y pinta el camino por delante con el estado esperado al llegar a cada tramo.
export default function MapaNavegacion({ recorrido, posicion, siguiendo, fluido = false, noche, onMover }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const capa = useRef<L.LayerGroup | null>(null)
  const alMover = useRef(onMover)

  useEffect(() => {
    alMover.current = onMover
  })

  useEffect(() => {
    const m = L.map(contenedor.current!, { zoomControl: false, minZoom: 7, maxZoom: 16 })
    capaBase(m)
    for (const ruta of rutas.filter((r) => !('prueba' in r))) L.polyline(ruta.linea as [number, number][], { color: '#a8a29e', weight: 6, opacity: 0.9, interactive: false }).addTo(m)
    m.setView([-23.56, -65.52], 9)
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
    if (!grupo) return
    grupo.clearLayers()
    for (const p of recorrido?.pasos ?? []) {
      const linea = LINEAS[p.tramo.id]
      if (!linea) continue
      L.polyline(linea, { color: '#fff', weight: 13, interactive: false }).addTo(grupo)
      L.polyline(linea, { color: ESTADOS[p.estadoLinea].color, weight: 8, interactive: false }).addTo(grupo)
    }
    for (const t of recorrido?.trechos ?? []) {
      // Los reportes con punto exacto van en su lugar (mas abajo); aca queda lo que afecta a todo el trecho.
      const delTrecho = t.dificultades.filter((d) => !d.puntos?.length)
      if (delTrecho.length === 0) continue
      const { tramo } = t.pasos[0]
      const difs = delTrecho.slice(0, 3).map((d) => `<span class="pm-dif pm-dif-${d.nivel}">${svgDificultad(d.tipo, 16)}</span>`).join('')
      L.marker([tramo.lat, tramo.lon], { interactive: false, icon: L.divIcon({ className: '', iconSize: [0, 0], html: `<div class="pm-marcador pm-solo pm-grande"><span class="pm-difs">${difs}</span></div>` }) }).addTo(grupo)
    }
    // Reportes con punto exacto: se pinta su pedazo de ruta y va el pictograma en el lugar.
    const enPrueba = (recorrido?.pasos ?? []).some((p) => p.tramo.prueba)
    for (const p of recorrido?.pasos ?? []) {
      for (const d of p.dificultades) {
        for (const lugar of d.puntos ?? []) {
          const marca = trechoDe(lugar, enPrueba)
          L.polyline(marca.linea, { color: ESTADOS[d.nivel].color, weight: 12, interactive: false }).addTo(grupo)
          L.marker(marca.centro, { interactive: false, zIndexOffset: 600, icon: L.divIcon({ className: '', iconSize: [0, 0], html: `<span class="pm-dif pm-dif-${d.nivel} pm-en-punto pm-en-punto-grande">${svgDificultad(d.tipo, 20)}</span>` }) }).addTo(grupo)
        }
      }
    }
    const destino = recorrido?.pasos.at(-1)?.tramo
    if (destino) L.marker([destino.lat, destino.lon], { interactive: false, icon: L.divIcon({ className: '', iconSize: [0, 0], html: '<div class="pm-destino"></div>' }) }).addTo(grupo)
    if (posicion) L.marker([posicion.lat, posicion.lon], { interactive: false, zIndexOffset: 2000, icon: flecha(posicion.rumbo) }).addTo(grupo)
  }, [recorrido, posicion])

  useEffect(() => {
    const m = mapa.current
    if (m && siguiendo && posicion) m.setView([posicion.lat, posicion.lon], Math.max(m.getZoom(), ZOOM_MANEJANDO), { animate: !fluido })
  }, [siguiendo, posicion, fluido])

  return <div ref={contenedor} className={`pm-nav absolute inset-0 ${noche ? 'pm-noche' : ''}`} />
}
