import { useEffect, useState } from 'react'
import App from './App'
import Portada from './components/Portada'
import { useTema } from './lib/tema'

const CLAVE = 'pm-entro'

// La portada se muestra la primera vez; quien ya entro al mapa vuelve directo a el (se abre en la ruta).
function enMapa() {
  if (location.hash === '#mapa') return true
  if (location.hash === '#inicio' || location.hash === '#como-funciona') return false
  return localStorage.getItem(CLAVE) === '1'
}

export default function Raiz() {
  const [mapa, setMapa] = useState(enMapa)
  const { tema, alternar } = useTema()

  useEffect(() => {
    const alCambiar = () => setMapa(enMapa())
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  useEffect(() => {
    if (mapa) localStorage.setItem(CLAVE, '1')
  }, [mapa])

  return mapa ? <App tema={tema} onAlternarTema={alternar} /> : <Portada tema={tema} onAlternarTema={alternar} />
}
