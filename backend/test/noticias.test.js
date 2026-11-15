import test from 'node:test';
import assert from 'node:assert/strict';
import { interpretar } from '../src/services/noticias.js';

const nota = (titulo, fuente = 'Somos Jujuy', fuenteUrl = 'https://www.somosjujuy.com.ar') => ({
  id: titulo,
  titulo,
  enlaceGoogle: 'https://news.google.com/rss/articles/x',
  fuente,
  fuenteUrl,
  publicado: new Date('2026-11-12T20:43:00Z'),
});

test('una noticia de un corte se ubica en su localidad y conserva la fuente', () => {
  const n = interpretar(nota('Corte total momentáneo en la Ruta Nacional 9 a la altura de Maimará por desborde de un arroyo'));
  assert.equal(n.tipo, 'corte');
  assert.equal(n.localidad, 'maimara');
  assert.equal(n.fuente, 'Somos Jujuy');
  assert.equal(n.resuelto, false);
});

test('una noticia de transito normalizado se marca como resuelta', () => {
  const n = interpretar(nota('Se normalizó el tránsito en Ruta 9 por el desborde de un arroyo en Maimará'));
  assert.equal(n.resuelto, true);
  assert.equal(n.etiqueta, 'Tránsito normalizado');
});

test('se descartan las noticias de otra provincia o sin incidente', () => {
  assert.equal(interpretar(nota('Choque en la ruta 9 a la altura de Rosario', 'La Capital', 'https://www.lacapital.com.ar')), null);
  assert.equal(interpretar(nota('Tilcara celebra su fiesta patronal')), null);
});
