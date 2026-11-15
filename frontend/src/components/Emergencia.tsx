import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Modal from './Modal'
import { NUMEROS_OFICIALES, coordenadas, enlaceWhatsApp, guardarContacto, leerContacto, mensajeDeAyuda, telefonoValido } from '../lib/emergencia'
import type { Contacto, Lugar } from '../lib/emergencia'
import { puntoSobreRuta } from '../lib/ruta'
import type { Tramo } from '../lib/tipos'

interface Props {
  tramos: Tramo[]
  onCerrar: () => void
}

const boton = 'flex items-center justify-center rounded-lg px-3 py-3 text-center text-base font-bold'
const campo = 'w-full rounded-lg border-2 border-stone-200 px-3 py-2.5 text-base'

// Emergencia: primero a quien llamar y donde estoy. No pide nada antes de mostrar los numeros y funciona sin datos.
export default function Emergencia({ tramos, onCerrar }: Props) {
  const [contacto, setContacto] = useState<Contacto | null>(leerContacto)
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(contacto?.nombre ?? '')
  const [telefono, setTelefono] = useState(contacto?.telefono ?? '')
  const [error, setError] = useState<string | null>(null)
  const [lugar, setLugar] = useState<Lugar | null>(null)
  const [sinLugar, setSinLugar] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setLugar({ lat: coords.latitude, lon: coords.longitude, texto: puntoSobreRuta(tramos, coords.latitude, coords.longitude)?.texto ?? null })
        setSinLugar(null)
      },
      () => setSinLugar('No pudimos obtener tu ubicación. Decí por teléfono la ruta y la localidad más cercana.'),
      { enableHighAccuracy: true, maximumAge: 15000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [tramos])

  const guardar = (e: FormEvent) => {
    e.preventDefault()
    if (!telefonoValido(telefono)) return setError('Escribí el teléfono con código de área. Ejemplo: 387 4123456.')
    const nuevo = { nombre: nombre.trim() || 'Mi contacto', telefono: telefono.trim() }
    guardarContacto(nuevo)
    setContacto(nuevo)
    setEditando(false)
    setError(null)
  }

  const quitar = () => {
    guardarContacto(null)
    setContacto(null)
    setNombre('')
    setTelefono('')
    setEditando(false)
  }

  const copiar = async () => {
    if (!lugar) return
    await navigator.clipboard?.writeText(mensajeDeAyuda(lugar)).catch(() => {})
    setCopiado(true)
  }

  const sinGps = !navigator.geolocation ? 'Este navegador no permite usar la ubicación. Decí por teléfono la ruta y la localidad más cercana.' : sinLugar

  return (
    <Modal titulo="Emergencia" onCerrar={onCerrar}>
      <div className="space-y-4">
        <section className="rounded-lg bg-stone-100 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Dónde estás (para decirlo por teléfono)</p>
          {lugar ? (
            <>
              {lugar.texto && <p className="text-base font-bold">{lugar.texto}</p>}
              <p className="text-sm font-semibold tabular-nums">{coordenadas(lugar)}</p>
              <button type="button" onClick={copiar} className="mt-1 text-sm font-semibold text-orange-800 hover:underline">
                {copiado ? 'Copiado' : 'Copiar mi ubicación'}
              </button>
            </>
          ) : (
            <p className="text-sm font-semibold">{sinGps ?? 'Buscando tu ubicación…'}</p>
          )}
        </section>

        <section>
          <h3 className="mb-1.5 text-sm font-bold">Números de emergencia</h3>
          <ul className="space-y-1.5">
            {NUMEROS_OFICIALES.map((n) => (
              <li key={n.numero} className="flex items-center gap-3 rounded-lg border-2 border-stone-200 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{n.nombre}</p>
                  <p className="text-xs text-stone-600">
                    {n.detalle}{' '}
                    <a href={n.fuente} target="_blank" rel="noreferrer" className="underline">
                      Fuente
                    </a>
                  </p>
                </div>
                <a href={`tel:${n.numero.replace(/\D/g, '')}`} className={`${boton} shrink-0 bg-red-700 text-white`}>
                  Llamar {n.numero}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-1.5 text-sm font-bold">Tu contacto de emergencia</h3>
          {contacto && !editando ? (
            <div className="rounded-lg border-2 border-stone-200 px-3 py-2.5">
              <p className="text-base font-bold">{contacto.nombre}</p>
              <p className="text-sm text-stone-600">{contacto.telefono}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <a href={`tel:${contacto.telefono.replace(/[^\d+]/g, '')}`} className={`${boton} bg-red-700 text-white`}>
                  Llamar
                </a>
                <a href={enlaceWhatsApp(contacto.telefono, mensajeDeAyuda(lugar))} target="_blank" rel="noreferrer" className={`${boton} bg-emerald-700 text-white`}>
                  Enviar mi ubicación
                </a>
              </div>
              <p className="mt-1.5 text-xs text-stone-500">"Enviar mi ubicación" abre WhatsApp con el mensaje listo; necesita internet. Sin datos, llamá.</p>
              <button type="button" onClick={() => setEditando(true)} className="mt-1.5 text-sm font-semibold text-orange-800 hover:underline">
                Cambiar contacto
              </button>
            </div>
          ) : (
            <form onSubmit={guardar} className="space-y-2">
              <p className="text-sm text-stone-600">Cargá a quién avisar si te pasa algo en la ruta. Queda guardado solo en este teléfono.</p>
              <input aria-label="Nombre del contacto" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} placeholder="Nombre (ej.: Mamá)" className={campo} />
              <input aria-label="Teléfono del contacto" value={telefono} onChange={(e) => setTelefono(e.target.value)} maxLength={25} inputMode="tel" placeholder="Teléfono con código de área" className={campo} />
              {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
              <div className="flex gap-2">
                <button type="submit" className={`${boton} flex-1 bg-stone-900 text-white`}>
                  Guardar contacto
                </button>
                {contacto && (
                  <button type="button" onClick={quitar} className={`${boton} border-2 border-stone-200 text-stone-700`}>
                    Quitar
                  </button>
                )}
              </div>
            </form>
          )}
        </section>

        <p className="text-center text-xs text-stone-500">Pachamapa no avisa a ninguna autoridad por su cuenta: en una emergencia, llamá.</p>
      </div>
    </Modal>
  )
}
