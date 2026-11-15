import { useState } from 'react'
import type { FormEvent } from 'react'
import Modal from './Modal'
import { suscribirAlertas } from '../lib/api'
import type { SuscripcionCreada } from '../lib/api'
import type { Tramo } from '../lib/tipos'

const CAMPO = 'w-full rounded-lg border-2 border-stone-200 bg-white px-3 py-2.5 text-base'
const HORAS = Array.from({ length: 24 }, (_, h) => h)

interface Props {
  tramos: Tramo[]
  tramoInicial: string | null
  onCerrar: () => void
}

export default function AlertasWhatsApp({ tramos, tramoInicial, onCerrar }: Props) {
  const [telefono, setTelefono] = useState('')
  const [nombre, setNombre] = useState('')
  const [elegidos, setElegidos] = useState<string[]>(tramoInicial ? [tramoInicial] : [])
  const [nivel, setNivel] = useState<'problemas' | 'atencion'>('problemas')
  const [todoElDia, setTodoElDia] = useState(true)
  const [desdeHora, setDesdeHora] = useState(6)
  const [hastaHora, setHastaHora] = useState(20)
  const [enviando, setEnviando] = useState(false)
  const [creada, setCreada] = useState<SuscripcionCreada | null>(null)
  const [error, setError] = useState<string | null>(null)

  const alternar = (id: string) => setElegidos((actuales) => (actuales.includes(id) ? actuales.filter((t) => t !== id) : [...actuales, id]))

  const enviarFormulario = async (e: FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      setCreada(
        await suscribirAlertas({
          telefono,
          nombre: nombre.trim() || undefined,
          tramos: elegidos,
          nivel,
          desdeHora: todoElDia ? 0 : desdeHora,
          hastaHora: todoElDia ? 0 : hastaHora,
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal titulo="Alertas por WhatsApp" onCerrar={onCerrar}>
      {creada ? (
        <div className="py-4 text-center">
          <p className="text-lg font-bold text-emerald-700">¡Listo, quedaste suscripto!</p>
          <p className="mt-1 text-sm text-stone-600">
            {creada.confirmacion
              ? `Te mandamos un WhatsApp de confirmación al ${creada.telefono}.`
              : `Vamos a avisarte al ${creada.telefono} cuando cambie el estado de tus tramos.`}
          </p>
          <button type="button" onClick={onCerrar} className="mt-4 rounded-lg bg-stone-900 px-5 py-2.5 font-semibold text-white">Volver al mapa</button>
        </div>
      ) : (
        <form onSubmit={enviarFormulario} className="space-y-3">
          <p className="text-sm text-stone-600">Te avisamos por WhatsApp cuando haya neblina, nieve, hielo, cortes u otros problemas en los tramos que elijas.</p>
          <input required type="tel" inputMode="tel" minLength={8} maxLength={24} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Tu WhatsApp (ej. 388 4123456)" aria-label="Número de WhatsApp" className={CAMPO} />
          <input maxLength={80} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre o empresa (opcional)" aria-label="Nombre o empresa" className={CAMPO} />

          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">Tramos {elegidos.length === 0 && <span className="font-normal text-stone-500">(sin elegir = todos)</span>}</legend>
            <div className="flex flex-wrap gap-1.5">
              {tramos.map((t) => {
                const activo = elegidos.includes(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => alternar(t.id)}
                    className={`rounded-full border-2 px-3 py-1.5 text-sm font-medium ${activo ? 'border-orange-700 bg-orange-700 text-white' : 'border-stone-200 bg-white text-stone-700'}`}
                  >
                    {t.nombre}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <select value={nivel} onChange={(e) => setNivel(e.target.value as 'problemas' | 'atencion')} aria-label="Cuándo avisar" className={CAMPO}>
            <option value="problemas">Avisarme solo si hay problemas</option>
            <option value="atencion">Avisarme también si hay que prestar atención</option>
          </select>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={todoElDia} onChange={(e) => setTodoElDia(e.target.checked)} className="h-4 w-4" />
            A cualquier hora
          </label>
          {!todoElDia && (
            <div className="flex items-center gap-2 text-sm">
              <span>De</span>
              <select value={desdeHora} onChange={(e) => setDesdeHora(Number(e.target.value))} aria-label="Desde la hora" className={CAMPO}>
                {HORAS.map((h) => <option key={h} value={h}>{h}:00</option>)}
              </select>
              <span>a</span>
              <select value={hastaHora} onChange={(e) => setHastaHora(Number(e.target.value))} aria-label="Hasta la hora" className={CAMPO}>
                {HORAS.map((h) => <option key={h} value={h}>{h}:00</option>)}
              </select>
            </div>
          )}

          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
          <button type="submit" disabled={enviando} className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-base font-bold text-white active:bg-emerald-800 disabled:opacity-60">
            {enviando ? 'Enviando…' : 'Recibir alertas por WhatsApp'}
          </button>
          <p className="text-center text-xs text-stone-500">Podés darte de baja cuando quieras desde el enlace que viene en cada mensaje.</p>
        </form>
      )}
    </Modal>
  )
}
