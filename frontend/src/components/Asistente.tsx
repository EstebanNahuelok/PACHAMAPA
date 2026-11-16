import { useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import Pacha from './Pacha'
import { asistenteDisponible, preguntarAsistente, type MensajeAsistente } from '../lib/api'

interface Props {
  sinSenal: boolean
  onCerrar: () => void
}

// Respuestas fijas: sirven sin conexión y cuando el asistente con IA no está configurado.
const FRECUENTES = [
  { pregunta: '¿Qué significan los colores?', respuesta: 'Verde: el tramo está bien. Ámbar: hay que prestar atención (neblina, lluvia, viento o un reporte sin confirmar). Rojo: hay problemas, como un corte, un derrumbe o muy poca visibilidad. Tocá un tramo para ver el motivo.' },
  { pregunta: '¿Cómo reporto un problema?', respuesta: 'Tocá "Reportar", elegí el punto de la ruta y qué pasa (corte, derrumbe, neblina, hielo…). Cuando otro conductor reporta lo mismo, queda confirmado. Necesita conexión.' },
  { pregunta: '¿A quién llamo en una emergencia?', respuesta: '911 emergencias y policía · 107 SAME (ambulancia) · 100 bomberos · 103 Defensa Civil · 0800-222-6272 Vialidad Nacional. El botón SOS muestra tu ubicación y arma un mensaje de ayuda; funciona sin datos.' },
  { pregunta: '¿Cómo recibo alertas por WhatsApp?', respuesta: 'Tocá "Recibir alertas por WhatsApp", poné tu número y elegí las localidades, el horario y el nivel. Cada mensaje trae un enlace para darte de baja.' },
  { pregunta: '¿Funciona sin señal?', respuesta: 'Sí: si la abriste antes con conexión, la aplicación muestra el mapa de la ruta y los últimos datos recibidos, con la hora a la que corresponden. No se puede reportar hasta que vuelva la señal.' },
]

export default function Asistente({ sinSenal, onCerrar }: Props) {
  const [mensajes, setMensajes] = useState<MensajeAsistente[]>([])
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const [conIA, setConIA] = useState(false)
  const fin = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sinSenal) asistenteDisponible().then(setConIA)
  }, [sinSenal])

  useEffect(() => {
    fin.current?.scrollIntoView({ block: 'end' })
  }, [mensajes, pensando])

  const libre = conIA && !sinSenal

  async function preguntar(pregunta: string) {
    const conversacion: MensajeAsistente[] = [...mensajes, { rol: 'user', texto: pregunta }]
    setMensajes(conversacion)
    setTexto('')
    setPensando(true)
    try {
      const { respuesta } = await preguntarAsistente(conversacion)
      setMensajes([...conversacion, { rol: 'assistant', texto: respuesta }])
    } catch (err) {
      const motivo = err instanceof Error && !/abort|timeout|fetch/i.test(err.message) ? err.message : 'No pude conectarme. Probá de nuevo cuando tengas señal.'
      setMensajes([...conversacion, { rol: 'assistant', texto: motivo }])
    } finally {
      setPensando(false)
    }
  }

  const responderFija = (f: (typeof FRECUENTES)[number]) =>
    setMensajes((actuales) => [...actuales, { rol: 'user', texto: f.pregunta }, { rol: 'assistant', texto: f.respuesta }])

  return (
    <Modal titulo="Pacha" onCerrar={onCerrar}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Pacha className="h-20 w-auto shrink-0" />
          <p className="rounded-2xl bg-stone-100 px-3.5 py-2 text-sm text-stone-800">
            {libre
              ? '¡Hola! Soy Pacha. Preguntame por el estado de la ruta o cómo usar la aplicación. Uso inteligencia artificial y no soy una fuente oficial: puedo equivocarme.'
              : sinSenal
                ? '¡Hola! Soy Pacha. Sin conexión solo puedo mostrarte estas respuestas guardadas.'
                : '¡Hola! Soy Pacha. Estas son las preguntas más frecuentes sobre la aplicación.'}
          </p>
        </div>

        {mensajes.length > 0 && (
          <div className="max-h-[45dvh] space-y-2 overflow-y-auto" aria-live="polite">
            {mensajes.map((m, i) => (
              <p
                key={i}
                className={`w-fit max-w-[88%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm ${m.rol === 'user' ? 'ml-auto bg-orange-700 text-white' : 'bg-stone-100 text-stone-800'}`}
              >
                {m.texto}
              </p>
            ))}
            {pensando && <p className="w-fit rounded-2xl bg-stone-100 px-3.5 py-2 text-sm text-stone-500">Escribiendo…</p>}
            <div ref={fin} />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {FRECUENTES.map((f) => (
            <button key={f.pregunta} type="button" onClick={() => responderFija(f)} className="rounded-full border border-stone-300 px-3 py-1.5 text-left text-sm font-medium text-stone-700 hover:bg-stone-100">
              {f.pregunta}
            </button>
          ))}
        </div>

        {libre && (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (texto.trim() && !pensando) preguntar(texto.trim())
            }}
          >
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={500}
              placeholder="¿Cómo está la ruta a Humahuaca?"
              aria-label="Tu pregunta"
              className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3 py-2.5 text-base"
            />
            <button type="submit" disabled={!texto.trim() || pensando} className="rounded-xl bg-orange-700 px-4 py-2.5 font-bold text-white disabled:opacity-60">
              Enviar
            </button>
          </form>
        )}
      </div>
    </Modal>
  )
}
