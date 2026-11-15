import { useEffect, useState } from 'react'

export type Tema = 'claro' | 'oscuro'
const CLAVE = 'pm-tema'
const COLOR_BARRA: Record<Tema, string> = { claro: '#9a3412', oscuro: '#6f2a12' }

// El tema elegido se guarda; sin eleccion se usa el del telefono. index.html lo aplica antes de pintar.
export function temaInicial(): Tema {
  const guardado = localStorage.getItem(CLAVE)
  if (guardado === 'claro' || guardado === 'oscuro') return guardado
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(temaInicial)
  useEffect(() => {
    document.documentElement.dataset.tema = tema
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_BARRA[tema])
  }, [tema])
  const alternar = () =>
    setTema((actual) => {
      const nuevo = actual === 'oscuro' ? 'claro' : 'oscuro'
      localStorage.setItem(CLAVE, nuevo)
      return nuevo
    })
  return { tema, alternar }
}
