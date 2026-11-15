import { PUNTOS } from '../data/puntos.js';
import { obtenerClima } from './openMeteo.js';
import { estadoPorClima, estadoPorReportes, peorEstado } from './estado.js';
import { gruposActivosPorTramo } from './reportes.js';

// Junta clima y reportes activos y devuelve el estado de cada tramo.
export async function calcularTramos() {
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
  return { actualizado, climaDisponible: porId.size > 0, reportesDisponibles: disponible, error, tramos };
}
