import { Router } from 'express';
import { buscarLugares, provincias } from '../services/lugares.js';
import { calcularViaje } from '../services/viaje.js';

const router = Router();

// Limite simple por IP: el servicio publico de rutas pide no abusar.
const pedidos = new Map();
function limitar(req, res, next) {
  const ahora = Date.now();
  const lista = (pedidos.get(req.ip) ?? []).filter((t) => ahora - t < 10 * 60 * 1000);
  if (lista.length >= 40) return res.status(429).json({ error: 'Demasiados pedidos de viaje. Esperá unos minutos.' });
  lista.push(ahora);
  pedidos.set(req.ip, lista);
  next();
}

const coordenada = (texto) => {
  const [lat, lon] = String(texto ?? '').split(',').map(Number);
  // Rectangulo amplio que contiene a la Argentina continental y Tierra del Fuego.
  return lat >= -56 && lat <= -21 && lon >= -74 && lon <= -53 ? { lat, lon } : null;
};

router.get('/provincias', async (_req, res, next) => {
  try {
    res.json(await provincias());
  } catch (err) {
    next(err);
  }
});

router.get('/lugares', async (req, res, next) => {
  try {
    const texto = String(req.query.q ?? '').trim().slice(0, 60);
    const provincia = String(req.query.provincia ?? '').trim().slice(0, 60);
    if (!texto && !provincia) return res.json([]);
    res.json(await buscarLugares(texto, provincia));
  } catch (err) {
    next(err);
  }
});

router.get('/viaje', limitar, async (req, res, next) => {
  try {
    const [desde, hasta] = [coordenada(req.query.desde), coordenada(req.query.hasta)];
    if (!desde || !hasta) return res.status(400).json({ error: 'Origen o destino fuera de la Argentina.' });
    res.json(await calcularViaje({ desde, hasta }));
  } catch (err) {
    next(err);
  }
});

export default router;
