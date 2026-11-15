import { ANTES_DE_ARRANCAR, consejosDelViaje } from '../lib/consejos'
import type { Recorrido } from '../lib/navegacion'

// Consejos de manejo: lo de siempre antes de arrancar y lo que pide este viaje (niebla, lluvia, cuesta, altura...).
export default function ConsejosViaje({ recorrido }: { recorrido: Recorrido | null }) {
  const delViaje = recorrido ? consejosDelViaje(recorrido) : []
  return (
    <div className="space-y-4">
      <section>
        <h3 className="mb-1.5 text-sm font-bold uppercase tracking-wide text-stone-400">Antes de arrancar</h3>
        <ul className="space-y-2">
          {ANTES_DE_ARRANCAR.map((c) => (
            <li key={c.titulo} className="flex gap-2.5">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
              <span>
                <span className="block text-base font-bold leading-tight">{c.titulo}</span>
                <span className="block text-sm text-stone-300">{c.texto}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {delViaje.length > 0 && (
        <section>
          <h3 className="mb-1.5 text-sm font-bold uppercase tracking-wide text-stone-400">En este viaje</h3>
          <ul className="space-y-2">
            {delViaje.map((c) => (
              <li key={c.titulo} className="rounded-xl bg-stone-800 px-3 py-2.5">
                <p className="text-base font-bold leading-tight">{c.titulo}</p>
                <p className="text-xs font-semibold text-amber-400">{c.donde}</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-stone-200">
                  {c.pasos.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-xs text-stone-400">Son recomendaciones generales de seguridad vial. Respetá siempre la señalización y las indicaciones de las autoridades.</p>
    </div>
  )
}
