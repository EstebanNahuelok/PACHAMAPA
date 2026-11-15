import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { TRAMOS, tramoPorId } from '../data/puntos.js';
import { prisma, dbConfigurada } from '../services/prisma.js';
import { NIVELES, enlaceBaja, revisarAlertas } from '../services/whatsappAlertas.js';
import { enviarWhatsApp, normalizarTelefono, whatsappConfigurado } from '../services/whatsapp.js';

const router = Router();

router.use((_req, res, next) => {
  if (!dbConfigurada) return res.status(503).json({ error: 'Las alertas no están disponibles en este momento.' });
  next();
});

// Limite por IP: cada alta manda un WhatsApp de confirmacion.
const VENTANA_MS = 60 * 60 * 1000;
const MAXIMO_POR_VENTANA = 5;
const altas = new Map();
function limitar(req, res, next) {
  const ahora = Date.now();
  const recientes = (altas.get(req.ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (recientes.length >= MAXIMO_POR_VENTANA) return res.status(429).json({ error: 'Demasiados intentos. Probá de nuevo más tarde.' });
  recientes.push(ahora);
  altas.set(req.ip, recientes);
  next();
}

const hora = (valor, porDefecto) => (Number.isInteger(valor) && valor >= 0 && valor <= 23 ? valor : porDefecto);

router.post('/suscripciones', limitar, async (req, res, next) => {
  try {
    const cuerpo = req.body ?? {};
    const telefono = normalizarTelefono(cuerpo.telefono);
    if (!telefono) return res.status(400).json({ error: 'Escribí tu WhatsApp con código de área. Ejemplo: 388 4123456.' });

    const pedidos = Array.isArray(cuerpo.tramos) ? [...new Set(cuerpo.tramos)].filter((id) => typeof id === 'string' && tramoPorId(id)) : [];
    const datos = {
      nombre: typeof cuerpo.nombre === 'string' ? cuerpo.nombre.trim().slice(0, 80) || null : null,
      tramos: pedidos.length === TRAMOS.length ? [] : pedidos,
      nivel: Object.hasOwn(NIVELES, cuerpo.nivel) ? cuerpo.nivel : 'problemas',
      desdeHora: hora(cuerpo.desdeHora, 0),
      hastaHora: hora(cuerpo.hastaHora, 0),
      activo: true,
    };
    const suscripcion = await prisma.suscripcion.upsert({
      where: { telefono },
      update: datos,
      create: { ...datos, telefono, token: randomBytes(18).toString('base64url') },
    });

    const lugares = datos.tramos.length ? datos.tramos.map((id) => tramoPorId(id).nombre).join(', ') : 'todos los tramos';
    const horario = datos.desdeHora === datos.hastaHora ? 'a toda hora' : `de ${datos.desdeHora} a ${datos.hastaHora} h`;
    const cuando = datos.nivel === 'problemas' ? 'cuando haya problemas' : 'cuando haya que prestar atención o haya problemas';
    let confirmacion = false;
    try {
      ({ enviado: confirmacion } = await enviarWhatsApp(
        telefono,
        `Pachamapa\n\nListo: te vamos a avisar ${cuando} en ${lugares}, ${horario}.\n\nPara dejar de recibir alertas: ${enlaceBaja(suscripcion)}`,
      ));
    } catch (err) {
      console.error(`[alertas] no se pudo confirmar a ${telefono}:`, err.message);
    }
    revisarAlertas();
    res.status(201).json({ ok: true, telefono, tramos: datos.tramos, nivel: datos.nivel, desdeHora: datos.desdeHora, hastaHora: datos.hastaHora, confirmacion, whatsappConfigurado });
  } catch (err) {
    next(err);
  }
});

router.get('/baja/:token', async (req, res, next) => {
  try {
    const { count } = await prisma.suscripcion.updateMany({ where: { token: req.params.token }, data: { activo: false } });
    const mensaje = count ? 'Listo, no vas a recibir más alertas de Pachamapa.' : 'Este enlace de baja no es válido.';
    res
      .status(count ? 200 : 404)
      .type('html')
      .send(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pachamapa</title><body style="font-family:system-ui,sans-serif;max-width:28rem;margin:3rem auto;padding:0 1rem"><h1>Pachamapa</h1><p>${mensaje}</p></body></html>`);
  } catch (err) {
    next(err);
  }
});

export default router;
