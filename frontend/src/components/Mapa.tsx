import { useEffect, useRef } from 'react'
import L from 'leaflet'
import rutas from '../data/rutas.json'
import geo from '../data/tramos-geo.json'
import { svgClima } from '../lib/iconos'
import { ESTADOS, grados } from '../lib/formato'
import { dificultadesDe } from '../lib/dificultades'
import { svgDificultad } from '../lib/iconosDificultad'
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

const MAXIMO_DIFICULTADES = 3
const escapar = (texto: string) => texto.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)

const LINEAS = geo as unknown as Record<string, [number, number][]>
// En el mapa va lo que pasa a la hora elegida; lo previsto para despues se ve cambiando la hora.
const visibles = (tramo: Tramo) => dificultadesDe(tramo).filter((d) => d.origen !== 'previsto')
const firma = (tramo: Tramo | undefined) => (tramo ? visibles(tramo).map((d) => d.clave + d.titulo).join('|') : '')

// Las localidades llevan la pildora con el clima; el resto de los tramos de 5 km solo sus dificultades.
function iconoMarcador(tramo: Tramo, seleccionado: boolean, conDificultades: boolean) {
  const reportes = tramo.reportes.reduce((total, r) => total + r.cantidad, 0)
  const dificultades = conDificultades ? visibles(tramo) : []
  const primeras = dificultades.slice(0, MAXIMO_DIFICULTADES)
  const resto = dificultades.length - primeras.length
  const difs = primeras.map((d, i) => `<span class="pm-dif pm-dif-${d.origen === 'previsto' ? 'previsto' : d.nivel}" data-dif="${i}" title="${escapar(d.titulo)}">${svgDificultad(d.tipo, 14)}</span>`).join('')
  const html = `<div class="pm-marcador pm-${LADO[tramo.localidad ?? ''] ?? 'der'} pm-${tramo.estado}${seleccionado ? ' pm-sel' : ''}${tramo.localidad ? '' : ' pm-solo'}">
    ${tramo.localidad ? `<span class="pm-punto"></span><span class="pm-pildora">${svgClima(tramo.clima?.icono, 22)}<b>${grados(tramo.clima?.temperatura)}</b>${reportes ? `<i>${reportes}</i>` : ''}</span>` : ''}
    ${difs ? `<span class="pm-difs">${difs}${resto > 0 ? `<span class="pm-dif pm-dif-mas">+${resto}</span>` : ''}</span>` : ''}
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
      L.polyline(linea, { color: '#ffffff', weight: 9, opacity: 0.9, interactive: false }).addTo(m)
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
    tramos.forEach((tramo, i) => {
      const activo = tramo.id === seleccionado
      const linea = LINEAS[tramo.id]
      // La ruta se pinta tramo por tramo con el color de su estado; una linea ancha invisible la hace facil de tocar.
      if (linea) {
        if (activo) L.polyline(linea, { color: '#1c1917', weight: 11, interactive: false }).addTo(grupo)
        L.polyline(linea, { color: ESTADOS[tramo.estado].color, weight: 5, interactive: false }).addTo(grupo)
        L.polyline(linea, { opacity: 0, weight: 22 }).on('click', () => alSeleccionar.current(tramo.id)).addTo(grupo)
      }
      // Si la misma dificultad sigue por varios tramos, el pictograma va solo en el primero.
      const anterior = tramos[i - 1]?.rutaId === tramo.rutaId ? tramos[i - 1] : undefined
      const conDificultades = firma(tramo) !== '' && firma(tramo) !== firma(anterior)
      if (!tramo.localidad && !conDificultades) return
      L.marker([tramo.lat, tramo.lon], {
        icon: iconoMarcador(tramo, activo, conDificultades),
        title: tramo.nombre,
        alt: tramo.nombre,
        zIndexOffset: activo ? 1000 : tramo.estado === 'problemas' ? 200 : tramo.estado === 'atencion' ? 100 : 0,
      })
        .on('click', (evento) => {
          // Tocar un pictograma abre su explicacion; tocar el resto del marcador abre el tramo.
          const indice = (evento.originalEvent.target as HTMLElement).closest<HTMLElement>('[data-dif]')?.dataset.dif
          const d = indice == null ? null : visibles(tramo)[Number(indice)]
          if (!d || !mapa.current) return alSeleccionar.current(tramo.id)
          L.popup({ offset: [0, 6], className: 'pm-globo' })
            .setLatLng([tramo.lat, tramo.lon])
            .setContent(`<b>${escapar(d.titulo)}</b><span>${escapar(tramo.nombre)} · ${escapar(d.detalle)}</span><small>${d.origen === 'previsto' ? 'Previsto' : d.origen === 'reporte' ? 'Reporte de la gente' : d.origen === 'riesgo' ? 'Estimación por lluvia' : 'Según el clima'}</small>`)
            .openOn(mapa.current)
        })
        .addTo(grupo)
    })
  }, [tramos, seleccionado])

  useEffect(() => {
    const m = mapa.current
    const tramo = ultimosTramos.current.find((t) => t.id === seleccionado)
    if (m && tramo) m.flyTo([tramo.lat, tramo.lon], Math.max(m.getZoom(), 11), { duration: 0.6 })
  }, [seleccionado])

  return <div ref={contenedor} className="h-full w-full" />
}
