import { Router } from 'express';
import { asistenteDisponible, responder, MAXIMO_MENSAJES, MAXIMO_LARGO } from '../services/asistente.js';

const router = Router();

// Limite por IP: cada pregunta consume cuota de Groq.
const VENTANA_MS = 10 * 60 * 1000;
const MAXIMO_POR_VENTANA = 20;
const usos = new Map();
function limitar(req, res, next) {
  const ahora = Date.now();
  const recientes = (usos.get(req.ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (recientes.length >= MAXIMO_POR_VENTANA) return res.status(429).json({ error: 'Hiciste muchas preguntas seguidas. Probá de nuevo en unos minutos.' });
  recientes.push(ahora);
  usos.set(req.ip, recientes);
  next();
}

// Deja solo los ultimos mensajes validos, con roles conocidos y texto acotado.
export function limpiarMensajes(mensajes) {
  if (!Array.isArray(mensajes)) return [];
  return mensajes
    .filter((m) => m && ['user', 'assistant'].includes(m.rol) && typeof m.texto === 'string' && m.texto.trim())
    .slice(-MAXIMO_MENSAJES)
    .map((m) => ({ role: m.rol, content: m.texto.trim().slice(0, MAXIMO_LARGO) }));
}

router.get('/', (_req, res) => res.json({ disponible: asistenteDisponible }));

router.post('/', limitar, async (req, res) => {
  if (!asistenteDisponible) return res.status(503).json({ error: 'El asistente no está disponible en este momento.' });
  const mensajes = limpiarMensajes(req.body?.mensajes);
  if (mensajes.at(-1)?.role !== 'user') return res.status(400).json({ error: 'Falta la pregunta.' });
  try {
    res.json({ respuesta: await responder(mensajes) });
  } catch (err) {
    console.error('[asistente] no se pudo responder:', err.message);
    res.status(502).json({ error: 'El asistente no pudo responder. Probá de nuevo.' });
  }
});

export default router;
