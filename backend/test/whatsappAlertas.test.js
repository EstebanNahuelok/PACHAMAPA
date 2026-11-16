import test from 'node:test';
import assert from 'node:assert/strict';
import { cubiertoPor, textoAlerta } from '../src/services/whatsappAlertas.js';

test('el mensaje muestra las horas previstas en hora de Jujuy', () => {
  const alerta = { nivel: 'atencion', tramo: 'Tilcara', mensaje: 'Neblina', desde: '2026-11-17T08:00:00.000Z', hasta: '2026-11-17T09:00:00.000Z' };
  const texto = textoAlerta({ token: 'abc' }, [alerta]);
  assert.match(texto, /Previsto: de 05:00 a 07:00/);
  assert.doesNotMatch(texto, /2026-11-17T/);
});

test('una suscripcion cubre los tramos elegidos por localidad o por id, y sus vecinos', () => {
  assert.deepEqual([...cubiertoPor(new Set(['san-salvador']))].sort(), ['rn9-00', 'rn9-01']);
  assert.deepEqual([...cubiertoPor(new Set(['rn9-05']))].sort(), ['rn9-04', 'rn9-05', 'rn9-06']);
});
