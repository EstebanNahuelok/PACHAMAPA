import { useState } from 'react'
import { ANTES_DE_ARRANCAR, ANTES_DE_SALIR, GUIAS } from '../lib/consejos'
import { NUMEROS_OFICIALES, SEGUN_LO_QUE_PASA } from '../lib/emergencia'

const CLAVE = 'pm-lista-salida'
const LISTA = [...ANTES_DE_ARRANCAR, ...ANTES_DE_SALIR]
const tarjeta = 'rounded-2xl border border-stone-200 bg-white'

function leerMarcados(): string[] {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? '[]')
    return Array.isArray(guardado) ? guardado : []
  } catch {
    return []
  }
}

const numero = (n: string) => NUMEROS_OFICIALES.find((o) => o.numero === n)!

// Seccion de la portada: lista de control antes de salir, consejos segun el camino y a quien llamar.
// Es todo contenido fijo, asi que se ve y se puede llamar aunque no haya datos.
export default function Seguridad() {
  const [marcados, setMarcados] = useState(leerMarcados)

  function guardar(lista: string[]) {
    setMarcados(lista)
    localStorage.setItem(CLAVE, JSON.stringify(lista))
  }
  const alternar = (titulo: string) => guardar(marcados.includes(titulo) ? marcados.filter((t) => t !== titulo) : [...marcados, titulo])
  const hechos = LISTA.filter((c) => marcados.includes(c.titulo)).length

  return (
    <section id="seguridad" className="scroll-mt-4 py-6">
      <h2 className="pm-marca text-2xl">Antes de salir</h2>
      <p className="mt-1 text-stone-600">Repasá la lista antes de arrancar. Lo que marcás queda guardado en este teléfono.</p>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className={`${tarjeta} p-5`}>
          <div className="flex items-center gap-2">
            <h3 className="whitespace-nowrap text-lg font-bold">Lista de control</h3>
            <span className="whitespace-nowrap rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-stone-600">
              {hechos} de {LISTA.length}
            </span>
            {hechos > 0 && (
              <button type="button" onClick={() => guardar([])} className="ml-auto whitespace-nowrap text-sm font-semibold text-orange-800 underline">
                Desmarcar todo
              </button>
            )}
          </div>
          <ul className="mt-3 divide-y divide-stone-200">
            {LISTA.map((c) => (
              <li key={c.titulo}>
                <label className="flex cursor-pointer gap-3 py-2.5">
                  <input type="checkbox" checked={marcados.includes(c.titulo)} onChange={() => alternar(c.titulo)} className="mt-1 h-5 w-5 shrink-0 accent-orange-700" />
                  <span>
                    <span className="block font-bold leading-tight">{c.titulo}</span>
                    <span className="block text-sm text-stone-600">{c.texto}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className={`${tarjeta} p-5`}>
          <h3 className="text-lg font-bold">Según el camino</h3>
          <p className="mt-0.5 text-sm text-stone-600">Tocá cada caso para ver cómo manejar.</p>
          <div className="mt-3 divide-y divide-stone-200">
            {GUIAS.map((g) => (
              <details key={g.titulo} className="py-2.5">
                <summary className="cursor-pointer">
                  <span className="font-bold">{g.titulo}</span>
                  <span className="block pl-4 text-sm text-stone-600">{g.corto}</span>
                </summary>
                <ul className="mt-2 list-disc space-y-1 pl-9 text-sm text-stone-600">
                  {g.pasos.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>
      </div>

      <h2 id="a-quien-llamar" className="pm-marca mt-10 scroll-mt-4 text-2xl">A quién llamar</h2>
      <p className="mt-1 text-stone-600">Según lo que pase. Las llamadas a estos números funcionan aunque no tengas datos; desde un celular, tocá el número para llamar.</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {SEGUN_LO_QUE_PASA.map((s) => (
          <li key={s.titulo} className={`${tarjeta} flex flex-col p-5`}>
            <h3 className="text-lg font-bold">{s.titulo}</h3>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-stone-600">{s.texto}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {s.numeros.map(numero).map((n, i) => (
                <a
                  key={n.numero}
                  href={`tel:${n.numero.replace(/\D/g, '')}`}
                  className={`rounded-full px-4 py-2 text-sm font-bold ${i === 0 ? 'bg-red-700 text-white' : 'border-2 border-stone-300 text-stone-800'}`}
                >
                  {n.numero} · {n.nombre}
                </a>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-stone-500">
        Fuentes de los números:{' '}
        {NUMEROS_OFICIALES.map((n, i) => (
          <span key={n.numero}>
            {i > 0 && ' · '}
            <a href={n.fuente} target="_blank" rel="noreferrer" className="underline">
              {n.numero} ({n.nombre})
            </a>
          </span>
        ))}
        . Los consejos son recomendaciones generales de seguridad vial: respetá siempre la señalización y a las autoridades.
      </p>
    </section>
  )
}
