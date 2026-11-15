import { Router } from 'express';
import { calcularTramos } from '../services/tramos.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { error, ...datos } = await calcularTramos();
    res.json({ ...datos, error: error ? 'No se pudo actualizar el clima' : null });
  } catch (err) {
    next(err);
  }
});

export default router;
