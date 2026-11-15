import { Router } from 'express';
import { prisma, dbConfigurada } from '../services/prisma.js';

const router = Router();
const RUBROS = ['agencia', 'transportista', 'guia', 'otro'];
const texto = (valor, maximo) => (typeof valor === 'string' ? valor.trim().slice(0, maximo) : '');

router.use((_req, res, next) => {
  if (!dbConfigurada) return res.status(503).json({ error: 'No disponible en este momento.' });
  next();
});

router.post('/visitas', async (req, res, next) => {
  try {
    await prisma.visita.create({ data: { visitante: texto(req.body?.visitante, 64) || null } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.get('/metricas', async (_req, res, next) => {
  try {
    const [visitas, visitantes, reportes, reportesActivos, listaEspera, suscriptores] = await Promise.all([
      prisma.visita.count(),
      prisma.visita.findMany({ where: { visitante: { not: null } }, distinct: ['visitante'], select: { visitante: true } }),
      prisma.reporte.count(),
      prisma.reporte.count({ where: { expiraEn: { gt: new Date() } } }),
      prisma.interesado.count(),
      prisma.suscripcion.count({ where: { activo: true } }),
    ]);
    res.json({ visitas, visitantes: visitantes.length, reportes, reportesActivos, listaEspera, suscriptores });
  } catch (err) {
    next(err);
  }
});

router.post('/lista-espera', async (req, res, next) => {
  try {
    const nombre = texto(req.body?.nombre, 80);
    const contacto = texto(req.body?.contacto, 120);
    const rubro = RUBROS.includes(req.body?.rubro) ? req.body.rubro : 'otro';
    const mensaje = texto(req.body?.mensaje, 500);
    if (nombre.length < 2 || contacto.length < 5) {
      return res.status(400).json({ error: 'Completá tu nombre y un email o teléfono de contacto.' });
    }
    await prisma.interesado.create({ data: { nombre, contacto, rubro, mensaje: mensaje || null } });
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
