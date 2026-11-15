import test from 'node:test';
import assert from 'node:assert/strict';
import { armarPronostico } from '../src/services/pronostico.js';
import { riesgoPorLluvia } from '../src/services/riesgo.js';
import { armarAlertas } from '../src/services/alertas.js';
import { resumirHistorial } from '../src/services/reportes.js';
import { normalizarHoras } from '../src/services/openMeteo.js';
import { armarTramo } from '../src/routes/tramos.js';
import { tramoPorId as puntoPorId, TRAMOS } from '../src/data/puntos.js';

const hora = (i, extra = {}) => ({ hora: new Date(Date.UTC(2026, 10, 15, i)).toISOString(), temperatura: 12, codigo: 1, visibilidad: 20000, rafagas: 10, nieve: 0, precipitacion: 0, ...extra });
const lluvia = (mm, n) => Array.from({ length: n }, () => ({ precipitacion: mm }));

test('el pronostico avisa el peor estado de las proximas horas y desde cuando', () => {
  const futuras = [hora(8), hora(9), hora(10, { codigo: 45, visibilidad: 150 }), hora(11, { codigo: 45, visibilidad: 100 }), hora(12)];
  const { horas, aviso } = armarPronostico(futuras);
  assert.equal(horas.length, 5);
  assert.equal(aviso.estado, 'problemas');
  assert.equal(aviso.desde, futuras[2].hora);
  assert.equal(aviso.hasta, futuras[3].hora);
  assert.deepEqual(aviso.motivos, ['Visibilidad muy reducida']);
});

test('sin nada previsto no hay aviso, y un dato faltante no cuenta como bajo cero', () => {
  assert.equal(armarPronostico([hora(8), hora(9, { temperatura: null })]).aviso, null);
});

test('el riesgo por lluvia sube antes en tramos con antecedentes', () => {
  const serie = { pasadas: lluvia(0.5, 24), futuras: lluvia(0.1, 24) };
  assert.equal(riesgoPorLluvia(serie, true).nivel, 'moderado');
  assert.equal(riesgoPorLluvia(serie, false).nivel, 'bajo');
  assert.equal(riesgoPorLluvia({ pasadas: [], futuras: [{ precipitacion: 12 }] }, true).nivel, 'alto');
  assert.equal(riesgoPorLluvia({ pasadas: [], futuras: [] }, true).nivel, 'bajo');
});

test('la serie horaria se parte en lluvia caida y pronostico', () => {
  const ahora = Date.UTC(2026, 10, 15, 7, 30);
  const time = [5, 6, 7, 8, 9].map((h) => Date.UTC(2026, 10, 15, h) / 1000);
  const n = (v) => time.map(() => v);
  const { actual, pasadas, futuras } = normalizarHoras({ time, temperature_2m: n(10), weather_code: n(45), visibility: n(500), wind_speed_10m: n(5), wind_gusts_10m: n(9), precipitation: n(1), snowfall: n(0), precipitation_probability: n(40), is_day: n(1) }, ahora);
  assert.equal(pasadas.length, 3);
  assert.equal(actual.medido, new Date(Date.UTC(2026, 10, 15, 7)).toISOString());
  assert.equal(futuras.length, 2);
  assert.equal(futuras[0].icono, 'neblina');
});

test('un corte reportado genera restriccion, alternativa y alerta', () => {
  const reportes = [{ tipo: 'corte', etiqueta: 'Corte de ruta', cantidad: 2, confirmado: true }];
  const tramo = armarTramo(puntoPorId('volcan'), { reportes, serie: { pasadas: [], futuras: [hora(8)] } });
  assert.equal(tramo.estado, 'problemas');
  assert.equal(tramo.restriccion.confirmado, true);
  assert.ok(tramo.restriccion.alternativa.fuente);
  assert.ok(tramo.zonasCriticas.length > 0);
  const [alerta] = armarAlertas([tramo]);
  assert.equal(alerta.clase, 'restriccion');
  assert.equal(alerta.nivel, 'problemas');
});

test('las alertas incluyen lo previsto solo si empeora, y el riesgo alto', () => {
  const futuras = [hora(8, { codigo: 95 })];
  const tramo = armarTramo(puntoPorId('tilcara'), { serie: { pasadas: lluvia(2, 24), futuras } });
  const clases = armarAlertas([tramo]).map((a) => a.clase);
  assert.deepEqual(clases, ['previsto', 'riesgo']);
  assert.equal(tramo.estado, 'atencion');
  assert.deepEqual(armarAlertas([armarTramo(puntoPorId('tilcara'), { serie: { pasadas: [], futuras: [hora(8)] } })]), []);
});

test('el historial resume tipos y franja habitual por tramo', () => {
  const r = (tipo, h) => ({ tramoId: 'volcan', tipo, creadoEn: new Date(Date.UTC(2026, 10, 15, h + 3)) });
  const h = resumirHistorial([r('neblina', 7), r('neblina', 8), r('fila', 18)]).get('rn9-08');
  assert.equal(h.total, 3);
  assert.deepEqual(h.porTipo[0], { tipo: 'neblina', etiqueta: 'Neblina', cantidad: 2 });
  assert.equal(h.franjaHabitual, 'mañana');
});

test('el clasificador por palabras distingue los fenomenos del ranking', async () => {
  const { clasificarTexto } = await import('../src/services/clasificador.js');
  const tipo = async (texto) => (await clasificarTexto(texto)).tipo;
  assert.equal(await tipo('se desbordó el arroyo y hay agua sobre la calzada'), 'crecida');
  assert.equal(await tipo('cayeron piedras sobre la calzada'), 'barro');
  assert.equal(await tipo('mucho bache pasando el puente'), 'bache');
  assert.equal(await tipo('hay un desvío por obras'), 'obras');
  assert.equal(await tipo('se derrumbó el cerro'), 'derrumbe');
  assert.equal(await tipo('sobra tiempo para llegar'), null);
});

test('la temporada sale del mes en Jujuy', async () => {
  const { temporadaDe } = await import('../src/services/riesgo.js');
  assert.equal(temporadaDe(new Date('2026-11-15T12:00:00Z')).id, 'lluvias');
  assert.equal(temporadaDe(new Date('2026-07-15T12:00:00Z')).id, 'invierno');
  assert.equal(temporadaDe(new Date('2026-05-15T12:00:00Z')), null);
});

test('los tramos vecinos con la misma alerta se juntan en una sola', () => {
  const niebla = [hora(8, { codigo: 45, visibilidad: 100 })];
  const serie = (futuras) => ({ pasadas: [], futuras });
  const tramos = TRAMOS.slice(6, 12).map((t, i) => armarTramo(t, { serie: serie(i >= 1 && i <= 3 ? niebla : [hora(8)]) }));
  const alertas = armarAlertas(tramos);
  assert.equal(alertas.length, 1);
  assert.deepEqual(alertas[0].tramoIds, ['rn9-07', 'rn9-08', 'rn9-09']);
  assert.equal(alertas[0].tramo, 'Volcán – Tumbaya');
  assert.equal(alertas[0].referencia, 'RN 9 · 35–50 km');
});

test('hay un tramo cada 5 km y los reportes viejos por localidad siguen ubicandose', () => {
  assert.ok(TRAMOS.every((t) => t.kmFin - t.kmInicio >= 4 && t.kmFin - t.kmInicio <= 7));
  assert.equal(puntoPorId('volcan').id, 'rn9-08');
  assert.equal(puntoPorId('purmamarca').rutaId, 'rn52');
});

test('cualquier reporte activo genera alerta, aunque no este confirmado ni sea grave', () => {
  const alertasCon = (reportes) => armarAlertas([armarTramo(puntoPorId('tilcara'), { reportes })]).map((a) => `${a.clase}:${a.mensaje}`);
  assert.deepEqual(alertasCon([{ tipo: 'crecida', etiqueta: 'Crecida o agua en la ruta', cantidad: 1, confirmado: false, grave: true }]), ['reporte:Crecida o agua en la ruta (sin confirmar)']);
  assert.deepEqual(alertasCon([{ tipo: 'barro', etiqueta: 'Barro o piedras', cantidad: 2, confirmado: true, grave: false }]), ['reporte:Barro o piedras']);
  assert.equal(alertasCon([{ tipo: 'crecida', etiqueta: 'Crecida o agua en la ruta', cantidad: 2, confirmado: true, grave: true }]).length, 1);
});

test('los tramos de prueba de Salta solo aparecen si se piden', async () => {
  const { calcularTramos } = await import('../src/services/tramos.js');
  const sinPrueba = (await calcularTramos()).tramos;
  const conPrueba = (await calcularTramos({ conPrueba: true })).tramos;
  assert.ok(sinPrueba.every((t) => !t.prueba));
  assert.deepEqual([...new Set(conPrueba.filter((t) => t.prueba).map((t) => t.rutaId))], ['cerrillos-vaqueros', 'libertad-san-luis']);
  assert.equal(puntoPorId('hiper-libertad').rutaId, 'libertad-san-luis');
});

test('los reportes se confirman por cercania, no por tramo', async () => {
  const { agruparPorTramo } = await import('../src/services/reportes.js');
  const r = (lat, lon, comentario) => ({ tipo: 'derrumbe', tramoId: 'rn9-16', lat, lon, comentario, creadoEn: new Date() });
  // Dos derrumbes a 3 km uno del otro en el mismo tramo: son dos hechos, ninguno confirmado.
  const [separados] = agruparPorTramo([r(-23.58, -65.395), r(-23.553, -65.395)]).get('rn9-16');
  assert.equal(separados.puntos.length, 2);
  assert.equal(separados.confirmado, false);
  // Dos a 200 m: el mismo hecho, confirmado. Los reportes sin punto se juntan entre si.
  const [juntos] = agruparPorTramo([r(-23.58, -65.395, 'a'), r(-23.5818, -65.395, 'b'), r(null, null), r(null, null)]).get('rn9-16');
  assert.equal(juntos.cantidad, 4);
  assert.deepEqual(juntos.puntos.map((p) => [p.cantidad, p.confirmado]), [[2, true], [2, true]]);
  assert.deepEqual(juntos.puntos[0].comentarios, ['a', 'b']);
});

test('un reporte con punto exacto no pinta todo el tramo, pero sigue contando para el estado y las alertas', async () => {
  const { agruparPorTramo } = await import('../src/services/reportes.js');
  const r = (extra) => ({ tipo: 'derrumbe', tramoId: 'rn9-16', creadoEn: new Date(), ...extra });
  const conPunto = agruparPorTramo([r({ lat: -23.58, lon: -65.395 }), r({ lat: -23.5805, lon: -65.395 })]).get('rn9-16');
  const tramo = armarTramo(puntoPorId('tilcara'), { reportes: conPunto });
  assert.equal(tramo.estado, 'problemas');
  assert.equal(tramo.estadoLinea, 'bien');
  assert.equal(armarAlertas([tramo]).length, 1);
  // Sin punto (reportes viejos) se sigue pintando el tramo entero.
  const viejo = agruparPorTramo([r({ lat: null, lon: null }), r({ lat: null, lon: null })]).get('rn9-16');
  assert.equal(armarTramo(puntoPorId('tilcara'), { reportes: viejo }).estadoLinea, 'problemas');
  // El final se guarda con el punto.
  const [obras] = agruparPorTramo([{ tipo: 'obras', tramoId: 'rn9-16', lat: -23.58, lon: -65.395, latFin: -23.57, lonFin: -65.394, creadoEn: new Date() }]).get('rn9-16');
  assert.deepEqual(obras.puntos[0].fin, { lat: -23.57, lon: -65.394 });
});
