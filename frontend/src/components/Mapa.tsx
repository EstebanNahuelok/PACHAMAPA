import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import rutas from '../data/rutas.json'
import geo from '../data/tramos-geo.json'
import { svgClima } from '../lib/iconos'
import { ESTADOS, grados, haceCuanto } from '../lib/formato'
import { etiquetaReporte } from '../lib/reportes'
import { dificultadesDe } from '../lib/dificultades'
import { svgDificultad } from '../lib/iconosDificultad'
import { trechoDe } from '../lib/ruta'
import { svgEfecto, zonasDeEfecto } from '../lib/efectosMapa'
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

const LIMITES_SALTA: L.LatLngBoundsExpression = [
  [-24.93, -65.56],
  [-24.67, -65.36],
]

const MAXIMO_DIFICULTADES = 3
const escapar = (texto: string) => texto.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)

const LINEAS = geo as unknown as Record<string, [number, number][]>
// En el mapa va lo que pasa a la hora elegida; lo previsto para despues se ve cambiando la hora.
// Los reportes con punto exacto se marcan en su lugar, no sobre todo el tramo.
const visibles = (tramo: Tramo) => dificultadesDe(tramo).filter((d) => d.origen !== 'previsto' && !d.puntos?.length)
const firma = (tramo: Tramo | undefined) => (tramo ? visibles(tramo).map((d) => d.clave + d.titulo).join('|') : '')

// Las localidades llevan la pildora con el clima; el resto de los tramos de 5 km solo sus dificultades.
function iconoMarcador(tramo: Tramo, seleccionado: boolean, conDificultades: boolean) {
  const reportes = tramo.reportes.reduce((total, r) => total + r.cantidad, 0)
  const dificultades = conDificultades ? visibles(tramo) : []
  const primeras = dificultades.slice(0, MAXIMO_DIFICULTADES)
  const resto = dificultades.length - primeras.length
  const difs = primeras.map((d, i) => `<span class="pm-dif pm-dif-${d.origen === 'previsto' ? 'previsto' : d.nivel}" data-dif="${i}" title="${escapar(d.titulo)}">${svgDificultad(d.tipo, 14)}</span>`).join('')
  const html = `<div class="pm-marcador pm-${LADO[tramo.localidad ?? ''] ?? 'der'} pm-${tramo.estadoLinea ?? tramo.estado}${seleccionado ? ' pm-sel' : ''}${tramo.localidad ? '' : ' pm-solo'}">
    ${tramo.localidad ? `<span class="pm-punto"></span><span class="pm-pildora">${svgClima(tramo.clima?.icono, 22)}<b>${grados(tramo.clima?.temperatura)}</b>${reportes ? `<i>${reportes}</i>` : ''}</span>` : ''}
    ${difs ? `<span class="pm-difs">${difs}${resto > 0 ? `<span class="pm-dif pm-dif-mas">+${resto}</span>` : ''}</span>` : ''}
  </div>`
  return L.divIcon({ html, className: '', iconSize: [0, 0] })
}

interface Props {
  tramos: Tramo[]
  seleccionado: string | null
  onSeleccionar: (id: string) => void
  // Eligiendo el lugar de un reporte: un toque en el mapa devuelve esa coordenada en vez de abrir el tramo.
  eligiendo?: boolean
  onPunto?: (lat: number, lon: number) => void
  puntoElegido?: { lat: number; lon: number; fin?: { lat: number; lon: number } } | null
}

export default function Mapa({ tramos, seleccionado, onSeleccionar, eligiendo = false, onPunto, puntoElegido }: Props) {
  const eligiendoAhora = useRef(eligiendo)
  const alPunto = useRef(onPunto)
  const contenedor = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const capa = useRef<L.LayerGroup | null>(null)
  const capaEfectos = useRef<L.LayerGroup | null>(null)
  const alSeleccionar = useRef(onSeleccionar)
  const ultimosTramos = useRef(tramos)

  useEffect(() => {
    alSeleccionar.current = onSeleccionar
    eligiendoAhora.current = eligiendo
    alPunto.current = onPunto
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
      // Las rutas de prueba de Salta se dibujan con sus tramos, solo en el modo TEST EN SALTA.
      if ('prueba' in ruta) continue
      const linea = ruta.linea as [number, number][]
      L.polyline(linea, { color: '#ffffff', weight: 9, opacity: 0.9, interactive: false }).addTo(m)
      L.polyline(linea, { color: '#c2410c', weight: 4, opacity: 0.9, interactive: false }).addTo(m)
    }
    // En pantallas chicas el encuadre completo queda demasiado lejos: se prioriza que se lean los puntos.
    if (m.getBoundsZoom(LIMITES, false, L.point(48, 48)) < 8) m.setView([-23.56, -65.52], 8)
    else m.fitBounds(LIMITES, { padding: [24, 24] })
    const ajustarTamano = () => {
      m.getContainer().classList.toggle('pm-compacto', m.getZoom() <= 8)
      m.getContainer().classList.toggle('pm-medio', m.getZoom() === 9)
    }
    m.on('zoomend', ajustarTamano)
    ajustarTamano()
    // Los efectos van en su propia capa: por encima de la ruta, por debajo de los marcadores y sin recibir toques.
    const panel = m.createPane('pm-efectos')
    panel.style.zIndex = '450'
    panel.style.pointerEvents = 'none'
    capaEfectos.current = L.layerGroup().addTo(m)
    capa.current = L.layerGroup().addTo(m)
    m.on('click', (evento) => {
      if (eligiendoAhora.current) alPunto.current?.(evento.latlng.lat, evento.latlng.lng)
    })
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
        L.polyline(linea, { color: ESTADOS[tramo.estadoLinea ?? tramo.estado].color, weight: 5, interactive: false }).addTo(grupo)
        L.polyline(linea, { opacity: 0, weight: 22 }).on('click', () => !eligiendoAhora.current && alSeleccionar.current(tramo.id)).addTo(grupo)
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
          if (eligiendoAhora.current) return alPunto.current?.(evento.latlng.lat, evento.latlng.lng)
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
    // Reportes con punto exacto: se pinta solo el pedazo de ruta que ocupan (unos cientos de metros, o de su
    // inicio a su fin) y va un pictograma en el lugar.
    const enPrueba = tramos.some((t) => t.prueba)
    for (const tramo of tramos) {
      for (const g of tramo.reportes) {
        for (const p of g.puntos ?? []) {
          if (p.lat == null || p.lon == null) continue
          const nivel = p.confirmado && g.grave !== false ? 'problemas' : 'atencion'
          const marca = trechoDe({ lat: p.lat, lon: p.lon, fin: p.fin }, enPrueba)
          const largo = marca.largoKm ? ` · ${marca.largoKm < 1 ? `${Math.round(marca.largoKm * 10) * 100} m` : `${marca.largoKm.toFixed(1).replace('.', ',')} km`} de largo` : ''
          const detalle = `${p.confirmado ? 'Confirmado' : 'Sin confirmar'} · ${p.cantidad} ${p.cantidad === 1 ? 'reporte' : 'reportes'} · ${haceCuanto(p.ultimo)}${largo}${p.comentarios[0] ? ` · “${p.comentarios[0]}”` : ''}`
          L.polyline(marca.linea, { color: '#fff', weight: 12, interactive: false }).addTo(grupo)
          L.polyline(marca.linea, { color: ESTADOS[nivel].color, weight: 8, interactive: false }).addTo(grupo)
          L.marker(marca.centro, {
            icon: L.divIcon({ className: '', iconSize: [0, 0], html: `<span class="pm-dif pm-dif-${nivel} pm-en-punto">${svgDificultad(g.tipo, 16)}</span>` }),
            title: etiquetaReporte(g.tipo),
            zIndexOffset: 600,
          })
            .on('click', (evento) => {
              if (eligiendoAhora.current) return alPunto.current?.(evento.latlng.lat, evento.latlng.lng)
              if (!mapa.current) return
              L.popup({ offset: [0, -8], className: 'pm-globo' })
                .setLatLng(marca.centro)
                .setContent(`<b>${escapar(etiquetaReporte(g.tipo))}</b><span>${escapar(tramo.nombre)} · ${escapar(detalle)}</span><small>Reporte de la gente, en este punto</small>`)
                .openOn(mapa.current)
            })
            .addTo(grupo)
        }
      }
    }
    if (puntoElegido?.fin) {
      const marca = trechoDe(puntoElegido, enPrueba)
      L.polyline(marca.linea, { color: '#c2410c', weight: 8, interactive: false }).addTo(grupo)
      L.marker([puntoElegido.fin.lat, puntoElegido.fin.lon], { interactive: false, zIndexOffset: 3000, icon: L.divIcon({ className: '', iconSize: [0, 0], html: '<div class="pm-destino pm-elegido"></div>' }) }).addTo(grupo)
    }
    if (puntoElegido) L.marker([puntoElegido.lat, puntoElegido.lon], { interactive: false, zIndexOffset: 3000, icon: L.divIcon({ className: '', iconSize: [0, 0], html: '<div class="pm-destino pm-elegido"></div>' }) }).addTo(grupo)
  }, [tramos, seleccionado, puntoElegido])

  useEffect(() => {
    mapa.current?.getContainer().classList.toggle('pm-eligiendo', eligiendo)
  }, [eligiendo])

  // Solo se vuelven a dibujar cuando cambia alguna zona, asi las animaciones no arrancan de nuevo en cada actualizacion.
  const zonas = useMemo(() => zonasDeEfecto(tramos, visibles, LINEAS), [tramos])
  const firmaZonas = zonas.map((z) => z.id).join('#')
  const ultimasZonas = useRef(zonas)
  useEffect(() => {
    ultimasZonas.current = zonas
  })
  useEffect(() => {
    const grupo = capaEfectos.current
    if (!grupo) return
    grupo.clearLayers()
    for (const zona of ultimasZonas.current) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('viewBox', '0 0 200 200')
      svg.setAttribute('preserveAspectRatio', 'none')
      svg.innerHTML = svgEfecto(zona)
      L.svgOverlay(svg, zona.limites, { pane: 'pm-efectos', interactive: false, className: 'pm-efecto' }).addTo(grupo)
      // La burbuja va al costado de la ruta, del lado contrario a la etiqueta de la localidad.
      const lado = LADO[zona.ancla.localidad ?? ''] === 'izq' ? 'der' : 'izq'
      L.marker([zona.ancla.lat, zona.ancla.lon], {
        icon: L.divIcon({
          html: `<div class="pm-burbuja pm-burbuja-${lado} pm-burbuja-${zona.nivel}"><b>${escapar(zona.titulo)}</b><span>${escapar(zona.lugar)}</span></div>`,
          className: '',
          iconSize: [0, 0],
        }),
        title: `${zona.titulo}: ${zona.lugar}`,
        zIndexOffset: zona.nivel === 'problemas' ? 150 : 50,
      })
        .on('click', () => alSeleccionar.current(zona.tramoId))
        .addTo(grupo)
    }
  }, [firmaZonas])

  useEffect(() => {
    const m = mapa.current
    const tramo = ultimosTramos.current.find((t) => t.id === seleccionado)
    if (m && tramo) m.flyTo([tramo.lat, tramo.lon], Math.max(m.getZoom(), 11), { duration: 0.6 })
  }, [seleccionado])

  // Al entrar o salir del modo TEST EN SALTA el mapa se encuadra en la zona que corresponde.
  const conPrueba = tramos.some((t) => t.prueba)
  const encuadrado = useRef(false)
  useEffect(() => {
    if (conPrueba !== encuadrado.current) mapa.current?.fitBounds(conPrueba ? LIMITES_SALTA : LIMITES, { padding: [24, 24] })
    encuadrado.current = conPrueba
  }, [conPrueba])

  return <div ref={contenedor} className="h-full w-full" />
}
