import { useState } from 'react'
import type { FormEvent } from 'react'
import Modal from './Modal'
import { enviarReporte } from '../lib/api'
import type { ReporteCreado } from '../lib/api'
import { CON_LARGO, TIPOS_REPORTE } from '../lib/reportes'
import type { TipoReporte } from '../lib/tipos'
import type { PuntoElegido } from '../lib/ruta'

interface Props {
  // Lugar exacto del reporte, elegido tocando el mapa o con la ubicacion del telefono.
  punto: PuntoElegido
  // Mientras se elige un punto en el mapa el formulario se esconde, pero conserva lo ya completado.
  oculto: boolean
  onCambiarPunto: () => void
  onMarcarFinal: () => void
  onQuitarFinal: () => void
  onCerrar: () => void
  onEnviado: (reporte: ReporteCreado) => void
}

const OTRO = 'otro'

export default function FormularioReporte({ punto, oculto, onCambiarPunto, onMarcarFinal, onQuitarFinal, onCerrar, onEnviado }: Props) {
  const [tipo, setTipo] = useState<string | null>(null)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const conLargo = CON_LARGO.includes(tipo as TipoReporte)

  const enviarFormulario = async (e: FormEvent) => {
    e.preventDefault()
    if (!tipo) return setError('Elegí qué está pasando.')
    if (tipo === OTRO && !comentario.trim()) return setError('Contanos qué está pasando.')
    setEnviando(true)
    setError(null)
    try {
      const final = conLargo && punto.fin ? { latFin: punto.fin.lat, lonFin: punto.fin.lon } : {}
      onEnviado(await enviarReporte({ tipo: tipo === OTRO ? undefined : tipo, tramoId: punto.tramoId, lat: punto.lat, lon: punto.lon, ...final, comentario: comentario.trim() || undefined }))
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

  if (oculto) return null

  return (
    <Modal titulo="Reportar un evento" onCerrar={onCerrar}>
      <form onSubmit={enviarFormulario} className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg border-2 border-stone-200 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Dónde</p>
            <p className="text-sm font-semibold">{punto.texto}</p>
          </div>
          <button type="button" onClick={onCambiarPunto} className="shrink-0 text-sm font-semibold text-orange-800 hover:underline">
            Cambiar punto
          </button>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">¿Qué está pasando?</legend>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS_REPORTE.map((t) => botonTipo(t.tipo, t.etiqueta))}
            {botonTipo(OTRO, 'Otra cosa')}
          </div>
        </fieldset>

        {conLargo && (
          <div className="flex items-center gap-2 rounded-lg border-2 border-stone-200 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Hasta dónde llega (opcional)</p>
              <p className="text-sm font-semibold">{punto.fin ? punto.fin.texto : 'Solo en el punto marcado'}</p>
            </div>
            <button type="button" onClick={punto.fin ? onQuitarFinal : onMarcarFinal} className="shrink-0 text-sm font-semibold text-orange-800 hover:underline">
              {punto.fin ? 'Quitar' : 'Marcar el final'}
            </button>
          </div>
        )}

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
            placeholder={tipo === OTRO ? 'Ej.: cayeron piedras sobre la calzada' : 'Ej.: mano al norte, pasa un vehículo por vez'}
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
