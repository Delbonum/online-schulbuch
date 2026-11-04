// Auswertung des Werkzeugs „Umfragen“ und QR-Code-Erzeugung.
import test from 'node:test';
import assert from 'node:assert/strict';
import { skala, auswahl, quantil, zahl } from '../apps/werkzeuge/umfragen/statistik.js';
import { qrEncode } from '../apps/werkzeuge/qr-code/qr-encode.js';

test('Skala: Mittelwert, Median, Quartile, Streuung, Häufigkeiten', () => {
  const s = skala([2, 4, 4, 4, 5, 5, 7, 9], { min: 0, max: 10, step: 1 });
  assert.equal(s.n, 8);
  assert.equal(s.mittel, 5);
  assert.equal(s.median, 4.5);
  assert.equal(s.q1, 4);
  assert.equal(s.q3, 5.5);
  assert.equal(s.min, 2);
  assert.equal(s.max, 9);
  assert.ok(Math.abs(s.sd - 2.138) < 0.001);
  assert.deepEqual(s.modi, [4]);
  assert.equal(s.klassen.length, 11);
  assert.equal(s.klassen[4].anzahl, 3);
});

test('Skala: feine Skalen werden in höchstens 21 Klassen zusammengefasst', () => {
  const s = skala([0, 50, 100], { min: 0, max: 100, step: 1 });
  assert.equal(s.klassen.length, 21);
  assert.equal(s.klassen.reduce((a, k) => a + k.anzahl, 0), 3);
  assert.equal(skala([], { min: 0, max: 10, step: 1 }).mittel, null);
});

test('Auswahl: Anzahl, Anteile, häufigste Antwort, Anteil richtig, mittlere Position', () => {
  const a = auswahl([0, 2, 2, 3, 2], { options: ['nein', 'eher nein', 'eher ja', 'ja'], correct: 2 });
  assert.deepEqual(a.anzahl, [1, 0, 3, 1]);
  assert.equal(a.anteil[2], 0.6);
  assert.deepEqual(a.haeufigste, [2]);
  assert.equal(a.anteilRichtig, 0.6);
  assert.equal(a.mittlerePosition, 2.8);
  assert.equal(a.medianPosition, 3);
});

test('Quantil und Zahlformat', () => {
  assert.equal(quantil([1, 2, 3, 4], 0.5), 2.5);
  assert.equal(quantil([], 0.5), null);
  assert.equal(zahl(6.25), '6,3');
  assert.equal(zahl(null), '–');
});

test('QR-Code: Größe, Suchmuster und Formatinformation passen', () => {
  const url = 'https://online-schulbuch.de/werkzeuge/umfragen/?code=123456';
  const { size, version, modules } = qrEncode(url);
  assert.equal(version, 4);
  assert.equal(size, 33);
  // Suchmuster oben links: dunkler Rand, heller Ring, dunkler Kern
  assert.equal(modules[0][0], true);
  assert.equal(modules[1][1], false);
  assert.equal(modules[3][3], true);
  assert.equal(modules[0][size - 1], true);
  assert.equal(modules[size - 1][0], true);
  assert.equal(modules[size - 8][8], true, 'dunkles Modul');
  // Formatinformation steht doppelt und ist identisch
  const a = [0, 1, 2, 3, 4, 5, 7, 8].map((y) => modules[y][8]);
  const b = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => modules[8][size - 1 - i]);
  assert.deepEqual(a.slice(0, 6), b.slice(0, 6));
  assert.throws(() => qrEncode('x'.repeat(400)));
});
