// Junta clima, pronostico, reportes e historial y devuelve el estado de cada tramo.
import { TRAMOS } from '../data/puntos.js';
import { obtenerClima } from './openMeteo.js';
import { gruposActivosPorTramo, historialPorTramo } from './reportes.js';
import { armarTramo } from '../routes/tramos.js';

export async function calcularTramos() {
  const [{ porId, horas, actualizado, error }, { porTramo, disponible }, historial] = await Promise.all([obtenerClima(), gruposActivosPorTramo(), historialPorTramo()]);
  const tramos = TRAMOS.map((punto) =>
    armarTramo(punto, { clima: porId.get(punto.id), serie: horas.get(punto.id), reportes: porTramo.get(punto.id), historial: historial.get(punto.id) }),
  );
  return { actualizado, climaDisponible: porId.size > 0, reportesDisponibles: disponible, error, tramos };
}
