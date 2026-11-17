import { test } from 'node:test';
import assert from 'node:assert/strict';
import { textoManiobra, flechaDe } from '../src/services/indicaciones.js';
import { acumulado, cortarEnTramos, simplificar } from '../src/services/viaje.js';

const paso = (maneuver, extra = {}) => ({ maneuver, name: '', ref: '', ...extra });

test('indicaciones en castellano', () => {
  assert.equal(textoManiobra(paso({ type: 'turn', modifier: 'right' }, { name: 'Belgrano' })), 'Doblá a la derecha por Belgrano');
  assert.equal(textoManiobra(paso({ type: 'turn', modifier: 'slight left' }, { name: 'Ruta', ref: 'RN 9' })), 'Doblá levemente a la izquierda por RN 9 (Ruta)');
  assert.equal(textoManiobra(paso({ type: 'roundabout', modifier: 'right', exit: 2 }, { ref: 'RN 34' })), 'En la rotonda, tomá la segunda salida por RN 34');
  assert.equal(textoManiobra(paso({ type: 'depart', bearing_after: 180 }, { name: 'San Martín' })), 'Salí hacia el sur por San Martín');
  assert.equal(textoManiobra(paso({ type: 'arrive', modifier: 'left' })), 'Llegaste: el destino está a la izquierda');
  assert.equal(flechaDe({ type: 'turn', modifier: 'sharp right' }), 'sharp-right');
});

test('el camino se corta en tramos parejos que cubren todo el recorrido', () => {
  const coords = Array.from({ length: 301 }, (_, i) => [-65, -24 - i * 0.003]);
  const linea = simplificar(coords);
  const km = acumulado(linea);
  const tramos = cortarEnTramos(linea, km);
  assert.ok(km.at(-1) > 99 && km.at(-1) < 101);
  assert.equal(tramos.length, 10);
  assert.ok(tramos.every((t) => t.kmFin - t.kmInicio > 9.9 && t.kmFin - t.kmInicio < 10.1));
  assert.equal(tramos[0].kmInicio, 0);
  assert.equal(tramos.at(-1).kmFin, Math.round(km.at(-1) * 10) / 10);
});
