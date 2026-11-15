// Puntos (tramos) de las rutas de Jujuy. Coordenadas y altitudes aproximadas.
export const PUNTOS = [
  { id: 'san-salvador', nombre: 'San Salvador de Jujuy', ruta: 'RN 9', lat: -24.1858, lon: -65.2995, altitud: 1259 },
  { id: 'volcan', nombre: 'Volcán', ruta: 'RN 9', lat: -23.915, lon: -65.466, altitud: 2084 },
  { id: 'tumbaya', nombre: 'Tumbaya', ruta: 'RN 9', lat: -23.857, lon: -65.467, altitud: 2094 },
  { id: 'purmamarca', nombre: 'Purmamarca', ruta: 'RN 52', lat: -23.747, lon: -65.499, altitud: 2324 },
  { id: 'maimara', nombre: 'Maimará', ruta: 'RN 9', lat: -23.624, lon: -65.408, altitud: 2334 },
  { id: 'tilcara', nombre: 'Tilcara', ruta: 'RN 9', lat: -23.577, lon: -65.395, altitud: 2465 },
  { id: 'uquia', nombre: 'Uquía', ruta: 'RN 9', lat: -23.304, lon: -65.356, altitud: 2818 },
  { id: 'humahuaca', nombre: 'Humahuaca', ruta: 'RN 9', lat: -23.205, lon: -65.349, altitud: 2939 },
  { id: 'abra-pampa', nombre: 'Abra Pampa', ruta: 'RN 9', lat: -22.722, lon: -65.697, altitud: 3484 },
  { id: 'cuesta-de-lipan', nombre: 'Cuesta de Lipán', ruta: 'RN 52', lat: -23.6811, lon: -65.6454, altitud: 4170 },
  { id: 'salinas-grandes', nombre: 'Salinas Grandes', ruta: 'RN 52', lat: -23.6157, lon: -65.8754, altitud: 3450 },
];

export const puntoPorId = (id) => PUNTOS.find((p) => p.id === id);

const RAD = Math.PI / 180;
export function distanciaKm(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * RAD;
  const dLon = (lon2 - lon1) * RAD;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

export function puntoMasCercano(lat, lon) {
  let mejor = null;
  for (const p of PUNTOS) {
    const km = distanciaKm(lat, lon, p.lat, p.lon);
    if (!mejor || km < mejor.km) mejor = { punto: p, km };
  }
  return mejor;
}
