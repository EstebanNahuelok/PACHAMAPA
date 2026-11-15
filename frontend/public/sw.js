// Permite abrir Pachamapa sin señal: guarda la aplicacion y las teselas del mapa ya vistas.
// Los datos (/api) no pasan por aca: la aplicacion guarda la ultima respuesta y estima con el pronostico.
const APP = 'pachamapa-app-v2';
const MAPA = 'pachamapa-mapa-v1';
const MAXIMO_TESELAS = 400;

// Al instalarse guarda la pagina y sus archivos (JS, CSS, iconos), asi la aplicacion ya abre sin conexion
// desde la segunda visita aunque en la primera no se haya recorrido nada.
async function precargar() {
  const cache = await caches.open(APP);
  const pagina = await fetch('/', { cache: 'no-store' });
  if (!pagina.ok) return;
  const html = await pagina.clone().text();
  await cache.put('/', pagina);
  const archivos = [...html.matchAll(/(?:src|href)="(\/[^"]+\.(?:js|css|svg|png|webp|woff2?))"/g)].map((m) => m[1]);
  await Promise.all(archivos.map((url) => cache.add(url).catch(() => {})));
}

self.addEventListener('install', (evento) => {
  evento.waitUntil(precargar().catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n !== APP && n !== MAPA).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

async function recortar(cache) {
  const claves = await cache.keys();
  await Promise.all(claves.slice(0, Math.max(0, claves.length - MAXIMO_TESELAS)).map((c) => cache.delete(c)));
}

// Aplicacion: primero la red (para tomar versiones nuevas) y, si no hay conexion, lo guardado.
async function redPrimero(pedido) {
  const cache = await caches.open(APP);
  try {
    const respuesta = await fetch(pedido);
    if (respuesta.ok) cache.put(pedido, respuesta.clone());
    return respuesta;
  } catch (err) {
    const guardada = (await cache.match(pedido)) ?? (pedido.mode === 'navigate' ? await cache.match('/') : undefined);
    if (guardada) return guardada;
    throw err;
  }
}

// Teselas del mapa: primero lo guardado, porque no cambian y asi el mapa aparece sin conexion.
async function cachePrimero(pedido) {
  const cache = await caches.open(MAPA);
  const guardada = await cache.match(pedido);
  if (guardada) return guardada;
  const respuesta = await fetch(pedido);
  if (respuesta.ok || respuesta.type === 'opaque') cache.put(pedido, respuesta.clone()).then(() => recortar(cache));
  return respuesta;
}

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  if (pedido.method !== 'GET') return;
  const url = new URL(pedido.url);
  if (url.hostname === 'tile.openstreetmap.org') evento.respondWith(cachePrimero(pedido));
  else if (url.origin === self.location.origin && !url.pathname.startsWith('/api/')) evento.respondWith(redPrimero(pedido));
});
