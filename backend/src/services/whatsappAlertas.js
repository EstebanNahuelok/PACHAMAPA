// Alertas por WhatsApp: avisa a cada suscriptor cuando aparece una alerta nueva en las localidades que eligió.
import { prisma, dbConfigurada } from './prisma.js';
import { calcularTramos } from './tramos.js';
import { armarAlertas } from './alertas.js';
import { TRAMOS } from '../data/puntos.js';
import { enviarWhatsApp } from './whatsapp.js';

export const NIVELES = { atencion: 1, problemas: 2 };
const ETIQUETAS = { atencion: 'Atención', problemas: 'Problemas' };
// Mientras la misma alerta sigue igual no se repite el aviso hasta pasadas estas horas; si empeora o cambia, se avisa enseguida.
const REPETIR_MS = (Number(process.env.ALERTAS_REPETIR_HORAS) || 6) * 60 * 60 * 1000;
const URL_API = (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3001}`).replace(/\/$/, '');
const URL_MAPA = (process.env.FRONTEND_URL || '').replace(/\/$/, '');

export const enlaceBaja = (suscripcion) => `${URL_API}/api/alertas/baja/${suscripcion.token}`;

// Hora actual en Jujuy (UTC-3, sin horario de verano).
const horaJujuy = () => (new Date().getUTCHours() + 21) % 24;

export function enHorario({ desdeHora, hastaHora }, hora = horaJujuy()) {
  if (desdeHora === hastaHora) return true;
  return desdeHora < hastaHora ? hora >= desdeHora && hora < hastaHora : hora >= desdeHora || hora < hastaHora;
}

// El suscriptor elige localidades; un tramo suyo sin localidad vecina también cubre los de arriba/abajo.
const cubiertoPor = (localidades) => {
  const indices = new Set();
  TRAMOS.forEach((t, i) => {
    if (localidades.has(t.localidad)) {
      indices.add(i);
      if (TRAMOS[i - 1]?.rutaId === t.rutaId) indices.add(i - 1);
      if (TRAMOS[i + 1]?.rutaId === t.rutaId) indices.add(i + 1);
    }
  });
  return new Set([...indices].map((i) => TRAMOS[i].id));
};

function textoAlerta(suscripcion, alertas) {
  const bloques = alertas.map((a) => {
    const referencia = a.referencia ? ` (${a.referencia})` : '';
    const previsto = a.desde ? `\nPrevisto: de ${a.desde} a ${a.hasta}` : '';
    return `*${ETIQUETAS[a.nivel]}* en ${a.tramo}${referencia}\n- ${a.mensaje}${previsto}`;
  });
  const mapa = URL_MAPA ? `\n\nMapa: ${URL_MAPA}` : '';
  return `Pachamapa\n\n${bloques.join('\n\n')}${mapa}\n\nPara dejar de recibir alertas: ${enlaceBaja(suscripcion)}`;
}

async function revisar() {
  if (!dbConfigurada) return;
  const suscripciones = await prisma.suscripcion.findMany({ where: { activo: true } });
  if (!suscripciones.length) return;

  const { tramos } = await calcularTramos();
  const alertas = armarAlertas(tramos);
  if (!alertas.length) return;

  const recientes = await prisma.alertaEnviada.findMany({ where: { enviadoEn: { gt: new Date(Date.now() - REPETIR_MS) } } });
  // Firma de lo ya avisado: misma alerta + mismos motivos + mismo nivel = no repetir.
  const yaAvisado = new Set(recientes.map((a) => `${a.suscripcionId}|${a.clave}|${a.motivos}|${NIVELES[a.estado] ?? 0}`));

  for (const s of suscripciones) {
    if (!enHorario(s)) continue;
    const tramosPropios = s.tramos.length ? cubiertoPor(new Set(s.tramos)) : null;
    const paraAvisar = alertas.filter(
      (a) =>
        (tramosPropios === null || a.tramoIds.some((id) => tramosPropios.has(id))) &&
        NIVELES[a.nivel] >= NIVELES[s.nivel] &&
        !yaAvisado.has(`${s.id}|${a.id}|${a.mensaje}|${NIVELES[a.nivel]}`),
    );
    if (!paraAvisar.length) continue;
    try {
      await enviarWhatsApp(s.telefono, textoAlerta(s, paraAvisar));
      await prisma.alertaEnviada.createMany({
        data: paraAvisar.map((a) => ({ suscripcionId: s.id, clave: a.id, tramoId: a.tramoId, estado: a.nivel, motivos: a.mensaje })),
      });
      for (const a of paraAvisar) yaAvisado.add(`${s.id}|${a.id}|${a.mensaje}|${NIVELES[a.nivel]}`);
    } catch (err) {
      console.error(`[alertas] no se pudo avisar a ${s.telefono}:`, err.message);
    }
  }
}

// Las revisiones corren de a una, para no mandar dos veces el mismo aviso.
let cola = Promise.resolve();
export function revisarAlertas() {
  cola = cola.then(revisar).catch((err) => console.error('[alertas] fallo la revision:', err.message));
  return cola;
}
