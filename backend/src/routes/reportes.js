import { Router } from 'express';
import { tramoPorId, tramoMasCercano, distanciaKm } from '../data/puntos.js';
import { TIPOS_REPORTE, MINIMO_PARA_CONFIRMAR } from '../data/tiposReporte.js';
import { clasificarTexto } from '../services/clasificador.js';
import { crearReporte, reportesActivos, mismoHecho } from '../services/reportes.js';
import { dbConfigurada } from '../services/prisma.js';
import { revisarAlertas } from '../services/whatsappAlertas.js';

const router = Router();
// Un tramo mide hasta 7 km: un punto mas lejos que esto de su centro no le corresponde.
const MAXIMO_AL_TRAMO_KM = 6;
// Largo maximo de un reporte con inicio y fin (en linea recta).
const MAXIMO_LARGO_KM = 20;

// Limite simple por IP para que una sola persona no llene el mapa de reportes.
const VENTANA_MS = 10 * 60 * 1000;
const MAXIMO_POR_VENTANA = 8;
const envios = new Map();
function limitar(req, res, next) {
  const ahora = Date.now();
  const recientes = (envios.get(req.ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (recientes.length >= MAXIMO_POR_VENTANA) {
    return res.status(429).json({ error: 'Demasiados reportes seguidos. Probá de nuevo en unos minutos.' });
  }
  recientes.push(ahora);
  envios.set(req.ip, recientes);
  next();
}

function requiereBase(_req, res, next) {
  if (!dbConfigurada) return res.status(503).json({ error: 'Los reportes no están disponibles en este momento.' });
  next();
}

router.get('/', requiereBase, async (_req, res, next) => {
  try {
    const reportes = await reportesActivos();
    res.json(reportes.map(({ id, tipo, tramoId, lat, lon, latFin, lonFin, comentario, canal, creadoEn, expiraEn }) => ({ id, tipo, tramoId, lat, lon, latFin, lonFin, comentario, canal, creadoEn, expiraEn })));
  } catch (err) {
    next(err);
  }
});

router.post('/', requiereBase, limitar, async (req, res, next) => {
  try {
    const cuerpo = req.body ?? {};
    const comentario = typeof cuerpo.comentario === 'string' ? cuerpo.comentario.trim().slice(0, 280) : '';
    const lat = Number(cuerpo.lat);
    const lon = Number(cuerpo.lon);

    let punto = typeof cuerpo.tramoId === 'string' ? tramoPorId(cuerpo.tramoId) : null;
    if (!punto && cuerpo.lat != null && cuerpo.lon != null && Number.isFinite(lat) && Number.isFinite(lon)) {
      punto = tramoMasCercano(lat, lon).tramo;
    }
    if (!punto) return res.status(400).json({ error: 'Elegí el tramo donde está pasando.' });

    let tipo = Object.hasOwn(TIPOS_REPORTE, cuerpo.tipo) ? cuerpo.tipo : null;
    let clasificadoPor = null;
    if (!tipo) {
      if (!comentario) return res.status(400).json({ error: 'Elegí un tipo de evento o contá qué está pasando.' });
      ({ tipo, fuente: clasificadoPor } = await clasificarTexto(comentario));
      if (!tipo) return res.status(422).json({ error: 'No pudimos identificar el evento. Elegí un tipo de la lista.' });
    }

    // Se guarda el punto exacto si viene y cae cerca del tramo; si no, el reporte queda solo con su tramo.
    const conPunto = cuerpo.lat != null && cuerpo.lon != null && Number.isFinite(lat) && Number.isFinite(lon) && distanciaKm(lat, lon, punto.lat, punto.lon) <= MAXIMO_AL_TRAMO_KM;
    // El final solo vale para los tipos con largo propio, si hay punto de inicio y no queda demasiado lejos.
    const latFin = Number(cuerpo.latFin);
    const lonFin = Number(cuerpo.lonFin);
    const conFinal = conPunto && TIPOS_REPORTE[tipo].conLargo && cuerpo.latFin != null && cuerpo.lonFin != null && Number.isFinite(latFin) && Number.isFinite(lonFin) && distanciaKm(lat, lon, latFin, lonFin) <= MAXIMO_LARGO_KM;
    const reporte = await crearReporte({ tipo, tramoId: punto.id, comentario, lat: conPunto ? lat : null, lon: conPunto ? lon : null, latFin: conFinal ? latFin : null, lonFin: conFinal ? lonFin : null });
    const cantidad = (await reportesActivos({ tipo, tramoId: punto.id })).filter((r) => mismoHecho(r, reporte)).length;
    revisarAlertas();
    res.status(201).json({
      id: reporte.id,
      tipo,
      etiqueta: TIPOS_REPORTE[tipo].etiqueta,
      tramoId: punto.id,
      tramo: `${punto.nombre} (${punto.ruta}, ${punto.referencia})`,
      lat: reporte.lat,
      lon: reporte.lon,
      latFin: reporte.latFin,
      lonFin: reporte.lonFin,
      expiraEn: reporte.expiraEn,
      confirmado: cantidad >= MINIMO_PARA_CONFIRMAR,
      clasificadoPor,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
