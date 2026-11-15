import { NIVEL } from './estado.js';

// Alertas de un tramo. La clave identifica la situacion (no el momento ni el lugar exacto).
function alertasDe(t) {
  const alertas = [];
  if (t.restriccion) {
    alertas.push({ clave: `restriccion:${t.restriccion.tipo}:${t.restriccion.confirmado}`, clase: 'restriccion', nivel: t.restriccion.confirmado ? 'problemas' : 'atencion', mensaje: t.restriccion.mensaje });
  } else if (t.estado === 'problemas') {
    alertas.push({ clave: 'actual', clase: 'actual', nivel: 'problemas', mensaje: t.motivos.join(' · ') });
  }
  // Cualquier otro reporte activo (agua en la calzada, barro, baches, obras...) tambien avisa, aunque no este confirmado.
  const otros = (t.reportes ?? []).filter((g) => g.tipo !== t.restriccion?.tipo);
  if (otros.length > 0 && (t.restriccion || t.estado !== 'problemas')) {
    alertas.push({ clave: `reporte:${otros.map((g) => `${g.tipo}${g.confirmado}`).join(',')}`, clase: 'reporte', nivel: 'atencion', mensaje: otros.map((g) => `${g.etiqueta}${g.confirmado ? '' : ' (sin confirmar)'}`).join(' · ') });
  }
  const aviso = t.pronostico?.aviso;
  if (aviso && NIVEL[aviso.estado] > NIVEL[t.estado]) {
    alertas.push({ clave: `previsto:${aviso.estado}`, clase: 'previsto', nivel: aviso.estado, mensaje: aviso.motivos.join(' · '), desde: aviso.desde, hasta: aviso.hasta });
  }
  if (t.riesgo?.nivel === 'alto') {
    alertas.push({ clave: 'riesgo', clase: 'riesgo', nivel: 'atencion', mensaje: 'Riesgo alto de aludes o crecidas por lluvia' });
  }
  return alertas;
}

const igual = (a, b) => a.clave === b.clave && a.mensaje === b.mensaje && a.desde === b.desde && a.hasta === b.hasta;

// Arma la lista de alertas a partir de los tramos ya calculados. Los tramos vecinos con la misma alerta
// (por ejemplo, 30 km seguidos de neblina) se juntan en una sola. El id identifica la situacion,
// asi la aplicacion puede avisar solo cuando aparece una alerta nueva.
export function armarAlertas(tramos) {
  const grupos = [];
  tramos.forEach((t, i) => {
    const anterior = tramos[i - 1];
    for (const a of alertasDe(t)) {
      const abierto = anterior?.rutaId === t.rutaId ? grupos.find((g) => g.ultimo === anterior.id && igual(g, a)) : null;
      if (abierto) {
        abierto.ultimo = t.id;
        abierto.tramos.push(t);
      } else grupos.push({ ...a, ultimo: t.id, tramos: [t] });
    }
  });
  return grupos
    .map(({ clave, ultimo, tramos: grupo, ...alerta }) => {
      const [primero, final] = [grupo[0], grupo.at(-1)];
      const localidades = grupo.filter((t) => t.localidad).map((t) => t.nombre);
      const extremos = localidades.length > 1 ? `${localidades[0]} – ${localidades.at(-1)}` : localidades[0] ?? primero.nombre;
      return {
        ...alerta,
        id: `${primero.id}:${clave}`,
        tramoId: primero.id,
        tramoIds: grupo.map((t) => t.id),
        tramo: extremos,
        referencia: primero.kmInicio == null ? null : `${primero.ruta} · ${primero.kmInicio}–${final.kmFin} km`,
      };
    })
    .sort((a, b) => NIVEL[b.nivel] - NIVEL[a.nivel]);
}
