import { estadoPorClima, NIVEL } from './estado.js';

const HORIZONTE_AVISO = 12;

// Peor estado previsto en las proximas horas: desde cuando, hasta cuando y por que.
function avisoProximo(horas) {
  const peor = horas.reduce((p, h) => (NIVEL[h.estado] > NIVEL[p] ? h.estado : p), 'bien');
  if (peor === 'bien') return null;
  const inicio = horas.findIndex((h) => h.estado === peor);
  let fin = inicio;
  while (fin + 1 < horas.length && horas[fin + 1].estado === peor) fin += 1;
  const motivos = [...new Set(horas.slice(inicio, fin + 1).flatMap((h) => h.motivos))];
  return { estado: peor, desde: horas[inicio].hora, hasta: horas[fin].hora, motivos };
}

export function armarPronostico(futuras = []) {
  const horas = futuras.map((h) => {
    const { estado, motivos } = estadoPorClima(h);
    return { hora: h.hora, temperatura: h.temperatura, icono: h.icono, descripcion: h.descripcion, probabilidad: h.probabilidad, precipitacion: h.precipitacion, visibilidad: h.visibilidad, viento: h.viento, rafagas: h.rafagas, esDia: h.esDia, estado, motivos };
  });
  return { horas, aviso: avisoProximo(horas.slice(0, HORIZONTE_AVISO)) };
}
