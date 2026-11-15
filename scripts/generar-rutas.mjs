// Genera la geometria de las rutas (una sola vez) con OSRM sobre datos de OpenStreetMap.
// Uso: node scripts/generar-rutas.mjs > frontend/src/data/rutas.json
// Con ids (node scripts/generar-rutas.mjs cerrillos-vaqueros libertad-san-luis) genera solo esas rutas, para sumarlas sin rehacer las demas.
const RUTAS = [
  {
    id: 'rn9',
    nombre: 'Ruta Nacional 9',
    paradas: [[-65.2995, -24.1858], [-65.466, -23.915], [-65.467, -23.857], [-65.408, -23.624], [-65.395, -23.577], [-65.356, -23.304], [-65.349, -23.205], [-65.697, -22.722]],
  },
  {
    id: 'rn52',
    nombre: 'Ruta Nacional 52',
    paradas: [[-65.467, -23.742], [-65.499, -23.747], [-65.6454, -23.6811], [-65.8754, -23.6157]],
  },
  // Rutas de prueba para desarrollar con GPS real desde Salta capital. No estan unidas entre si ni con las de Jujuy.
  {
    id: 'cerrillos-vaqueros',
    nombre: 'Cerrillos – Vaqueros (prueba)',
    prueba: true,
    paradas: [[-65.487, -24.9], [-65.4104, -24.7892], [-65.408, -24.697]],
  },
  {
    id: 'libertad-san-luis',
    nombre: 'Hiper Libertad – San Luis (prueba)',
    prueba: true,
    paradas: [[-65.4276, -24.8321], [-65.516, -24.845]],
  },
];

const distancia = ([lon1, lat1], [lon2, lat2]) => {
  const rad = Math.PI / 180;
  const x = (lon2 - lon1) * rad * Math.cos(((lat1 + lat2) / 2) * rad);
  const y = (lat2 - lat1) * rad;
  return Math.hypot(x, y) * 6371000;
};

const salida = [];
for (const ruta of RUTAS.filter((r) => process.argv.length < 3 || process.argv.slice(2).includes(r.id))) {
  const coords = ruta.paradas.map((p) => p.join(',')).join(';');
  const res = await fetch(`http://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`);
  const json = await res.json();
  if (json.code !== 'Ok') throw new Error(`OSRM fallo en ${ruta.id}: ${json.code}`);
  const completa = json.routes[0].geometry.coordinates;
  const puntos = [completa[0]];
  for (const c of completa) if (distancia(puntos[puntos.length - 1], c) >= 120) puntos.push(c);
  puntos.push(completa[completa.length - 1]);
  salida.push({
    id: ruta.id,
    nombre: ruta.nombre,
    km: Math.round(json.routes[0].distance / 1000),
    ...(ruta.prueba ? { prueba: true } : {}),
    linea: puntos.map(([lon, lat]) => [Number(lat.toFixed(5)), Number(lon.toFixed(5))]),
  });
}
console.log(JSON.stringify(salida));
