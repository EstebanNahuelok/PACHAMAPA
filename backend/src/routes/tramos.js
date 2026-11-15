import { Router } from 'express';
import { PUNTOS } from '../data/puntos.js';
import { obtenerClima } from '../services/openMeteo.js';
import { estadoPorClima, estadoPorReportes, peorEstado } from '../services/estado.js';
import { gruposActivosPorTramo } from '../services/reportes.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const [{ porId, actualizado, error }, { porTramo, disponible }] = await Promise.all([obtenerClima(), gruposActivosPorTramo()]);
    const tramos = PUNTOS.map((punto) => {
      const clima = porId.get(punto.id) ?? null;
      const reportes = porTramo.get(punto.id) ?? [];
      const porClima = estadoPorClima(clima);
      const porReportes = estadoPorReportes(reportes);
      return {
        ...punto,
        clima,
        estado: peorEstado(porClima.estado, porReportes.estado),
        motivos: [...porReportes.motivos, ...porClima.motivos],
        reportes,
      };
    });
    res.json({ actualizado, climaDisponible: porId.size > 0, reportesDisponibles: disponible, error: error ? 'No se pudo actualizar el clima' : null, tramos });
  } catch (err) {
    next(err);
  }
});

export default router;
