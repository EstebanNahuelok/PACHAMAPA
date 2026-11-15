import { useState } from 'react'
import type { FormEvent } from 'react'
import Modal from './Modal'
import { enviarReporte } from '../lib/api'
import type { ReporteCreado } from '../lib/api'
import { TIPOS_REPORTE } from '../lib/reportes'
import type { Tramo } from '../lib/tipos'

interface Props {
  tramos: Tramo[]
  tramoInicial: string | null
  onCerrar: () => void
  onEnviado: (reporte: ReporteCreado) => void
}

const OTRO = 'otro'

function masCercano(tramos: Tramo[], lat: number, lon: number) {
  const distancia = (t: Tramo) => Math.hypot(t.lat - lat, (t.lon - lon) * Math.cos((lat * Math.PI) / 180))
  return tramos.reduce((mejor, t) => (distancia(t) < distancia(mejor) ? t : mejor))
}

export default function FormularioReporte({ tramos, tramoInicial, onCerrar, onEnviado }: Props) {
  const [tipo, setTipo] = useState<string | null>(null)
  const [tramoId, setTramoId] = useState(tramoInicial ?? '')
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ubicando, setUbicando] = useState(false)

  const usarUbicacion = () => {
    if (!navigator.geolocation) return setError('Tu navegador no permite usar la ubicación.')
    setUbicando(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setTramoId(masCercano(tramos, coords.latitude, coords.longitude).id)
        setUbicando(false)
      },
      () => {
        setError('No pudimos obtener tu ubicación. Elegí el tramo de la lista.')
        setUbicando(false)
      },
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }

  const enviarFormulario = async (e: FormEvent) => {
    e.preventDefault()
    if (!tipo) return setError('Elegí qué está pasando.')
    if (!tramoId) return setError('Elegí el tramo donde está pasando.')
    if (tipo === OTRO && !comentario.trim()) return setError('Contanos qué está pasando.')
    setEnviando(true)
    setError(null)
    try {
      onEnviado(await enviarReporte({ tipo: tipo === OTRO ? undefined : tipo, tramoId, comentario: comentario.trim() || undefined }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el reporte.')
      setEnviando(false)
    }
  }

  const botonTipo = (valor: string, etiqueta: string) => (
    <button
      key={valor}
      type="button"
      aria-pressed={tipo === valor}
      onClick={() => setTipo(valor)}
      className={`rounded-lg border-2 px-3 py-3 text-sm font-semibold ${tipo === valor ? 'border-orange-700 bg-orange-700 text-white' : 'border-stone-200 bg-white text-stone-800 hover:border-stone-400'}`}
    >
      {etiqueta}
    </button>
  )

  return (
    <Modal titulo="Reportar un evento" onCerrar={onCerrar}>
      <form onSubmit={enviarFormulario} className="space-y-4">
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">¿Qué está pasando?</legend>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS_REPORTE.map((t) => botonTipo(t.tipo, t.etiqueta))}
            {botonTipo(OTRO, 'Otra cosa')}
          </div>
        </fieldset>

        <div>
          <label htmlFor="reporte-tramo" className="mb-1.5 block text-sm font-semibold">¿Dónde?</label>
          <div className="flex gap-2">
            <select id="reporte-tramo" value={tramoId} onChange={(e) => setTramoId(e.target.value)} className="min-w-0 flex-1 rounded-lg border-2 border-stone-200 bg-white px-3 py-2.5 text-base">
              <option value="">Elegí un tramo…</option>
              {tramos.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
            <button type="button" onClick={usarUbicacion} disabled={ubicando} className="shrink-0 rounded-lg border-2 border-stone-200 px-3 text-sm font-semibold text-orange-800 disabled:opacity-60">
              {ubicando ? 'Buscando…' : 'Mi ubicación'}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="reporte-comentario" className="mb-1.5 block text-sm font-semibold">
            {tipo === OTRO ? 'Contanos qué pasa' : 'Comentario (opcional)'}
          </label>
          <textarea
            id="reporte-comentario"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={280}
            rows={2}
            placeholder={tipo === OTRO ? 'Ej.: cayeron piedras sobre la calzada' : 'Ej.: a la altura del puente, mano al norte'}
            className="w-full rounded-lg border-2 border-stone-200 px-3 py-2 text-base"
          />
        </div>

        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

        <button type="submit" disabled={enviando} className="w-full rounded-lg bg-orange-700 px-4 py-3 text-base font-bold text-white active:bg-orange-800 disabled:opacity-60">
          {enviando ? 'Enviando…' : 'Enviar reporte'}
        </button>
        <p className="text-center text-xs text-stone-500">El reporte es anónimo y se borra solo después de unas horas.</p>
      </form>
    </Modal>
  )
}
