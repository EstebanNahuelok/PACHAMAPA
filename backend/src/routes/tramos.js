import { Router } from 'express';
import { PUNTOS } from '../data/puntos.js';
import { obtenerClima } from '../services/openMeteo.js';
import { estadoPorClima } from '../services/estado.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { porId, actualizado, error } = await obtenerClima();
    const tramos = PUNTOS.map((punto) => {
      const clima = porId.get(punto.id) ?? null;
      const { estado, motivos } = estadoPorClima(clima);
      return { ...punto, clima, estado, motivos, reportes: [] };
    });
    res.json({ actualizado, climaDisponible: porId.size > 0, error: error ? 'No se pudo actualizar el clima' : null, tramos });
  } catch (err) {
    next(err);
  }
});

export default router;
