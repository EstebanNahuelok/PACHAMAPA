// Calcula el estado de un tramo (bien / atencion / problemas) a partir del clima y los reportes activos.
const NIVEL = { bien: 0, atencion: 1, problemas: 2 };

export function estadoPorClima(clima) {
  if (!clima) return { estado: 'bien', motivos: [] };
  const motivos = [];
  let estado = 'bien';
  const subir = (nivel, motivo) => {
    if (NIVEL[nivel] > NIVEL[estado]) estado = nivel;
    motivos.push(motivo);
  };
  const { codigo, visibilidad, rafagas, temperatura, nieve } = clima;

  if (visibilidad != null && visibilidad < 200) subir('problemas', 'Visibilidad muy reducida');
  else if (codigo === 45 || codigo === 48 || (visibilidad != null && visibilidad < 1000)) subir('atencion', 'Neblina');

  if (codigo >= 95) subir('problemas', 'Tormenta');
  else if (codigo === 65 || codigo === 67 || codigo === 82) subir('problemas', 'Lluvia fuerte');
  else if ((codigo >= 51 && codigo <= 67) || codigo === 80 || codigo === 81) subir('atencion', 'Calzada mojada');

  if (codigo === 75 || codigo === 86 || nieve >= 1) subir('problemas', 'Nevada fuerte');
  else if ((codigo >= 71 && codigo <= 77) || codigo === 85 || nieve > 0) subir('atencion', 'Nevada');

  if (rafagas >= 80) subir('problemas', 'Ráfagas muy fuertes');
  else if (rafagas >= 50) subir('atencion', 'Viento fuerte');

  if (temperatura <= 0) subir('atencion', 'Bajo cero: posible hielo');

  return { estado, motivos };
}

export function peorEstado(a, b) {
  return NIVEL[a] >= NIVEL[b] ? a : b;
}
