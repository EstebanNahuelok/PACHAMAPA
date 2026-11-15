// Junta clima, pronostico, reportes e historial y devuelve el estado de cada tramo.
import { TRAMOS } from '../data/puntos.js';
import { obtenerClima } from './openMeteo.js';
import { gruposActivosPorTramo, historialPorTramo } from './reportes.js';
import { armarTramo } from '../routes/tramos.js';

// Los tramos de prueba (Salta) solo se incluyen si se piden: no forman parte del mapa ni de las alertas por WhatsApp.
export async function calcularTramos({ conPrueba = false } = {}) {
  const [{ porId, horas, actualizado, error }, { porTramo, disponible }, historial] = await Promise.all([obtenerClima(), gruposActivosPorTramo(), historialPorTramo()]);
  const tramos = TRAMOS.filter((punto) => conPrueba || !punto.prueba).map((punto) =>
    armarTramo(punto, { clima: porId.get(punto.id), serie: horas.get(punto.id), reportes: porTramo.get(punto.id), historial: historial.get(punto.id) }),
  );
  return { actualizado, climaDisponible: porId.size > 0, reportesDisponibles: disponible, error, tramos };
}
