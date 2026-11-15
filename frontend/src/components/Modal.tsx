import type { ReactNode } from 'react'

interface Props {
  titulo: string
  onCerrar: () => void
  children: ReactNode
}

export default function Modal({ titulo, onCerrar, children }: Props) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 sm:items-center" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 pb-6 shadow-xl sm:max-w-md sm:rounded-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="-mr-1 rounded-full px-3 py-1 text-2xl leading-none text-stone-500 hover:bg-stone-100">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
