import { Router } from 'express';
import { TRAMOS } from '../data/puntos.js';
import { zonasDe, esSensibleALluvia } from '../data/zonasCriticas.js';
import { alternativaDe, PARTE_OFICIAL } from '../data/alternativas.js';
import { estadoPorClima, estadoPorReportes, peorEstado } from '../services/estado.js';
import { armarPronostico } from '../services/pronostico.js';
import { riesgoPorLluvia, temporadaDe } from '../services/riesgo.js';
import { armarAlertas } from '../services/alertas.js';
import { calcularTramos } from '../services/tramos.js';
import { obtenerNoticias } from '../services/noticias.js';

const router = Router();
const CIERRES = ['corte', 'derrumbe'];

function restriccionDe(punto, reportes) {
  const grupo = reportes.find((g) => CIERRES.includes(g.tipo) && g.confirmado) ?? reportes.find((g) => CIERRES.includes(g.tipo));
  if (!grupo) return null;
  return {
    tipo: grupo.tipo,
    confirmado: grupo.confirmado,
    mensaje: `${grupo.etiqueta} ${grupo.confirmado ? 'confirmado' : 'reportado, sin confirmar'}`,
    alternativa: alternativaDe(punto.localidad),
  };
}

export function armarTramo(punto, { clima = null, serie = null, reportes = [], historial = null }) {
  const zonasCriticas = zonasDe(punto.localidad);
  const riesgo = serie ? riesgoPorLluvia(serie, esSensibleALluvia(zonasCriticas)) : null;
  const porClima = estadoPorClima(clima);
  const porReportes = estadoPorReportes(reportes);
  const porRiesgo = riesgo?.nivel === 'alto' ? { estado: 'atencion', motivos: ['Riesgo de aludes o crecidas por lluvia'] } : { estado: 'bien', motivos: [] };
  return {
    ...punto,
    clima,
    estado: peorEstado(peorEstado(porClima.estado, porReportes.estado), porRiesgo.estado),
    motivos: [...porReportes.motivos, ...porClima.motivos, ...porRiesgo.motivos],
    reportes,
    estadoReportes: porReportes,
    pronostico: serie ? armarPronostico(serie.futuras) : null,
    riesgo,
    zonasCriticas,
    restriccion: restriccionDe(punto, reportes),
    historial,
  };
}

router.get('/', async (_req, res, next) => {
  try {
    const { error, tramos, ...datos } = await calcularTramos();
    res.json({
      ...datos,
      error: error ? 'No se pudo actualizar el clima' : null,
      parteOficial: PARTE_OFICIAL,
      temporada: temporadaDe(),
      alertas: armarAlertas(tramos),
      noticias: obtenerNoticias().noticias,
      tramos,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
