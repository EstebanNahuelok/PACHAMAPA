import { useState } from 'react'
import type { FormEvent } from 'react'
import Modal from './Modal'
import { sumarListaEspera } from '../lib/api'

const RUBROS = [
  { valor: 'agencia', etiqueta: 'Agencia de turismo' },
  { valor: 'transportista', etiqueta: 'Transportista' },
  { valor: 'guia', etiqueta: 'Guía' },
  { valor: 'otro', etiqueta: 'Otro' },
]

const CAMPO = 'w-full rounded-lg border-2 border-stone-200 bg-white px-3 py-2.5 text-base'

export default function ListaEspera({ onCerrar }: { onCerrar: () => void }) {
  const [nombre, setNombre] = useState('')
  const [contacto, setContacto] = useState('')
  const [rubro, setRubro] = useState('agencia')
  const [mensaje, setMensaje] = useState('')
  const [estado, setEstado] = useState<'inicial' | 'enviando' | 'listo'>('inicial')
  const [error, setError] = useState<string | null>(null)

  const enviarFormulario = async (e: FormEvent) => {
    e.preventDefault()
    setEstado('enviando')
    setError(null)
    try {
      await sumarListaEspera({ nombre, contacto, rubro, mensaje: mensaje.trim() || undefined })
      setEstado('listo')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar.')
      setEstado('inicial')
    }
  }

  return (
    <Modal titulo="Alertas para tu trabajo" onCerrar={onCerrar}>
      {estado === 'listo' ? (
        <div className="py-4 text-center">
          <p className="text-lg font-bold text-emerald-700">¡Listo, quedaste en la lista!</p>
          <p className="mt-1 text-sm text-stone-600">Te vamos a escribir cuando abramos las alertas por tramo y horario.</p>
          <button type="button" onClick={onCerrar} className="mt-4 rounded-lg bg-stone-900 px-5 py-2.5 font-semibold text-white">Volver al mapa</button>
        </div>
      ) : (
        <form onSubmit={enviarFormulario} className="space-y-3">
          <p className="text-sm text-stone-600">
            Estamos armando alertas por tramo y horario para agencias de turismo, transportistas y guías: te avisamos antes de salir si hay neblina, nieve o cortes en tu recorrido.
          </p>
          <input required minLength={2} maxLength={80} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre o empresa" aria-label="Nombre o empresa" className={CAMPO} />
          <input required minLength={5} maxLength={120} value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="Email o WhatsApp" aria-label="Email o WhatsApp" className={CAMPO} />
          <select value={rubro} onChange={(e) => setRubro(e.target.value)} aria-label="Rubro" className={CAMPO}>
            {RUBROS.map((r) => (
              <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
            ))}
          </select>
          <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} maxLength={500} rows={2} placeholder="¿Qué tramos y horarios te interesan? (opcional)" aria-label="Mensaje" className={CAMPO} />
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
          <button type="submit" disabled={estado === 'enviando'} className="w-full rounded-lg bg-orange-700 px-4 py-3 text-base font-bold text-white active:bg-orange-800 disabled:opacity-60">
            {estado === 'enviando' ? 'Enviando…' : 'Sumarme a la lista de espera'}
          </button>
        </form>
      )}
    </Modal>
  )
}
