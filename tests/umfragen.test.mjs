// Live-Werkzeuge: Auswertung der Umfragen, Wortwolke, Evaluation (mit Vorlage PoKUK) und QR-Code-Erzeugung.
import test from 'node:test';
import assert from 'node:assert/strict';
import { skala, auswahl, quantil, zahl } from '../apps/werkzeuge/umfragen/statistik.js';
import { qrEncode } from '../apps/werkzeuge/qr-code/qr-encode.js';
import { zaehleWoerter, wolkeLayout } from '../apps/werkzeuge/wortwolke/wolke.js';
import { wert, kennzahlen, skalen, aussagen, freitexte, csv } from '../apps/werkzeuge/evaluation/auswertung.js';
import { POKUK } from '../apps/werkzeuge/evaluation/vorlagen.js';

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

test('Wortwolke: Begriffe ohne Rücksicht auf Groß-/Kleinschreibung zählen, überlappungsfrei anordnen', () => {
  const w = zaehleWoerter(['Freiheit', 'freiheit', ' Freiheit ', 'Mut', 'mut  ', 'Liebe']);
  assert.deepEqual(w.map((x) => [x.text, x.anzahl]), [['Freiheit', 3], ['Mut', 2], ['Liebe', 1]]);
  const { teile, box } = wolkeLayout(w, (text, g) => text.length * g * 0.6);
  assert.equal(teile.length, 3);
  assert.ok(teile[0].groesse > teile[2].groesse, 'häufigster Begriff am größten');
  for (const a of teile) for (const b of teile) {
    if (a !== b) assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, 'keine Überlappung');
  }
  assert.ok(box.w > 0 && box.h > 0);
});

test('Evaluation: Stufen, Umpolung, Skalen wie in der Auswertungsmaske', () => {
  const f = { id: 'a', type: 'choice', options: ['1', '2', '3', '4'], dimension: 'S' };
  const r = { ...f, id: 'b', reverse: true };
  assert.equal(wert(f, 0), 1);
  assert.equal(wert(r, 3, true), 1, 'umgepolt: „trifft zu“ zählt 1');
  assert.equal(wert(r, 3), 4, 'Einzelaussage zeigt den angekreuzten Wert');
  const boegen = [{ a: 3, b: 0 }, { a: 2, b: 1 }, { a: 3 }];
  const [s] = skalen([f, r], boegen);
  // Personen: (4+4)/2 = 4, (3+3)/2 = 3, 4 → Mittelwert 11/3, Median 4, SD (Grundgesamtheit) 0,471
  assert.equal(s.n, 3);
  assert.ok(Math.abs(s.mittel - 11 / 3) < 1e-9);
  assert.equal(s.median, 4);
  assert.ok(Math.abs(s.sd - 0.4714) < 1e-3);
  assert.deepEqual(aussagen([f], boegen)[0].verteilung, [0, 0, 1, 2]);
  assert.equal(kennzahlen([]).mittel, null);
  const t = freitexte([{ id: 'c', type: 'text', text: 'Sonst?' }], [{ c: 'gut' }, { c: ' ' }, {}]);
  assert.deepEqual(t[0].texte, ['gut']);
  const datei = csv([f, r, { id: 'c', type: 'text', text: 'Sonst?' }], [{ a: 3, b: 0, c: 'Ja; "gut"' }]);
  assert.match(datei, /^\uFEFF"Bogen";"a";"b";"c";"Skala: S"\r\n1;4;1;"Ja; ""gut""";4\r\n/);
});

test('Vorlage PoKUK: 45 Aussagen, zehn Skalen, Ver6 umgepolt, gültige Kürzel', () => {
  assert.equal(POKUK.questions.length, 45);
  assert.equal(POKUK.settings.dimensions.length, 10);
  assert.ok(POKUK.questions.every((q) => /^[a-z0-9]{1,16}$/.test(q.id) && q.options.length === 4 && q.dimension));
  assert.deepEqual(POKUK.questions.filter((q) => q.reverse).map((q) => q.id), ['ver6']);
  const anzahl = (name) => POKUK.questions.filter((q) => q.dimension === name).length;
  assert.equal(anzahl('Kognitive Aktivierung'), 7);
  assert.equal(anzahl('Zeitverluste und Störungen'), 5);
  assert.ok(POKUK.questions.filter((q) => q.section.startsWith('Bei der')).every((q) => q.id.startsWith('zeit')));
});
