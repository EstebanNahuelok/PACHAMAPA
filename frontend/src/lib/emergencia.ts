// Seccion Emergencia: un contacto propio (guardado solo en este telefono) y los numeros oficiales.
// Todo vive en el frontend para que funcione sin datos: en la ruta suele haber señal de voz y no de internet.

export interface Contacto {
  nombre: string
  telefono: string
}

// Numeros de emergencia vigentes en Jujuy y Salta, cada uno con la pagina oficial de donde sale.
export const NUMEROS_OFICIALES = [
  { numero: '911', nombre: 'Emergencias', detalle: 'Policía. Accidentes, incendios, delitos o alguien descompuesto.', fuente: 'https://policia.jujuy.gob.ar/numeros-utiles/' },
  { numero: '107', nombre: 'SAME', detalle: 'Ambulancia y emergencias médicas, gratis y las 24 horas.', fuente: 'https://www.same107.jujuy.gob.ar/' },
  { numero: '100', nombre: 'Bomberos', detalle: 'Incendios y rescates.', fuente: 'https://www.argentina.gob.ar/tema/emergencias' },
  { numero: '103', nombre: 'Defensa Civil', detalle: 'Derrumbes, aludes, crecidas e inundaciones.', fuente: 'https://www.argentina.gob.ar/tema/emergencias' },
  { numero: '0800-222-6272', nombre: 'Vialidad Nacional', detalle: 'Estado de las rutas nacionales y auxilio en ruta.', fuente: 'https://www.argentina.gob.ar/transporte/vialidad-nacional/estado-de-rutas' },
]

const CLAVE = 'pm-contacto-emergencia'

export function leerContacto(): Contacto | null {
  try {
    const c = JSON.parse(localStorage.getItem(CLAVE) ?? 'null')
    return c?.telefono ? c : null
  } catch {
    return null
  }
}

export function guardarContacto(contacto: Contacto | null) {
  if (contacto) localStorage.setItem(CLAVE, JSON.stringify(contacto))
  else localStorage.removeItem(CLAVE)
}

export const telefonoValido = (telefono: string) => telefono.replace(/\D/g, '').length >= 8

// Numero en el formato que pide WhatsApp (codigo de pais, sin signos). Sin codigo de pais se asume un celular de Argentina.
export function paraWhatsApp(telefono: string) {
  let digitos = telefono.replace(/\D/g, '')
  if (!telefono.trim().startsWith('+')) {
    digitos = digitos.replace(/^0+/, '')
    if (digitos.length === 10) digitos = `549${digitos}`
  }
  if (digitos.startsWith('54') && !digitos.startsWith('549')) digitos = `549${digitos.slice(2)}`
  return digitos
}

export interface Lugar {
  lat: number
  lon: number
  // Referencia sobre la ruta ("Tilcara · RN 9, km 82,3"), si se esta cerca de una.
  texto: string | null
}

export const coordenadas = (l: Lugar) => `${l.lat.toFixed(5)}, ${l.lon.toFixed(5)}`
export const enlaceMapa = (l: Lugar) => `https://maps.google.com/?q=${l.lat.toFixed(5)},${l.lon.toFixed(5)}`

export const mensajeDeAyuda = (l: Lugar | null) =>
  l ? `Necesito ayuda. Estoy en ${l.texto ? `${l.texto} (${coordenadas(l)})` : coordenadas(l)}. ${enlaceMapa(l)}` : 'Necesito ayuda. No pude obtener mi ubicación: llamame.'

export const mensajeDeSalida = (destino: string, llegada: string) => `Salgo hacia ${destino}. Calculo llegar a las ${llegada}. Si no te aviso que llegué, llamame.`

export const enlaceWhatsApp = (telefono: string, texto: string) => `https://wa.me/${paraWhatsApp(telefono)}?text=${encodeURIComponent(texto)}`
