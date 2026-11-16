import { useEffect, useState } from 'react'
import App from './App'
import Portada from './components/Portada'
import { PAGINAS, type Pagina } from './lib/paginas'
import { useTema } from './lib/tema'

const CLAVE = 'pm-entro'

// La portada se muestra la primera vez; quien ya entro al mapa vuelve directo a el (se abre en la ruta).
const paginaDelHash = () => PAGINAS.find((p) => `#${p}` === location.hash)

function enMapa() {
  if (location.hash.startsWith('#mapa')) return true
  if (paginaDelHash()) return false
  return localStorage.getItem(CLAVE) === '1'
}

export default function Raiz() {
  const [mapa, setMapa] = useState(enMapa)
  const [pagina, setPagina] = useState<Pagina>(() => paginaDelHash() ?? 'inicio')
  const { tema, alternar } = useTema()

  useEffect(() => {
    const alCambiar = () => {
      setMapa(enMapa())
      setPagina(paginaDelHash() ?? 'inicio')
    }
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  useEffect(() => {
    if (mapa) localStorage.setItem(CLAVE, '1')
  }, [mapa])

  return mapa ? <App tema={tema} onAlternarTema={alternar} /> : <Portada pagina={pagina} tema={tema} onAlternarTema={alternar} />
}
