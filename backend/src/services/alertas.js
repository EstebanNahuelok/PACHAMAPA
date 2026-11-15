// Alertas por WhatsApp: avisa a cada suscriptor cuando uno de sus tramos pasa a "atencion" o "problemas".
import { prisma, dbConfigurada } from './prisma.js';
import { calcularTramos } from './tramos.js';
import { enviarWhatsApp } from './whatsapp.js';

export const NIVELES = { atencion: 1, problemas: 2 };
const ETIQUETAS = { atencion: 'Atención', problemas: 'Problemas' };
// Mientras un tramo sigue igual no se repite el aviso hasta pasadas estas horas; si empeora, se avisa enseguida.
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

function textoAlerta(suscripcion, tramos) {
  const bloques = tramos.map((t) => {
    const clima = t.clima ? `\nClima: ${t.clima.descripcion}, ${Math.round(t.clima.temperatura)} °C` : '';
    return `*${ETIQUETAS[t.estado]}* en ${t.nombre} (${t.ruta}, ${t.altitud} m)\n${t.motivos.map((m) => `- ${m}`).join('\n')}${clima}`;
  });
  const mapa = URL_MAPA ? `\n\nMapa: ${URL_MAPA}` : '';
  return `Pachamapa\n\n${bloques.join('\n\n')}${mapa}\n\nPara dejar de recibir alertas: ${enlaceBaja(suscripcion)}`;
}

async function revisar() {
  if (!dbConfigurada) return;
  const suscripciones = await prisma.suscripcion.findMany({ where: { activo: true } });
  if (!suscripciones.length) return;

  const { tramos } = await calcularTramos();
  const conNovedad = tramos.filter((t) => t.estado !== 'bien');
  if (!conNovedad.length) return;

  const recientes = await prisma.alertaEnviada.findMany({ where: { enviadoEn: { gt: new Date(Date.now() - REPETIR_MS) } } });
  const yaAvisado = new Map();
  for (const a of recientes) {
    const clave = `${a.suscripcionId}|${a.tramoId}`;
    yaAvisado.set(clave, Math.max(yaAvisado.get(clave) ?? 0, NIVELES[a.estado] ?? 0));
  }

  for (const s of suscripciones) {
    if (!enHorario(s)) continue;
    const paraAvisar = conNovedad.filter(
      (t) =>
        (!s.tramos.length || s.tramos.includes(t.id)) &&
        NIVELES[t.estado] >= NIVELES[s.nivel] &&
        NIVELES[t.estado] > (yaAvisado.get(`${s.id}|${t.id}`) ?? 0),
    );
    if (!paraAvisar.length) continue;
    try {
      await enviarWhatsApp(s.telefono, textoAlerta(s, paraAvisar));
      await prisma.alertaEnviada.createMany({
        data: paraAvisar.map((t) => ({ suscripcionId: s.id, tramoId: t.id, estado: t.estado, motivos: t.motivos.join('; ') })),
      });
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
