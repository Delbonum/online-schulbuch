// Subnetz-Trainer: Rechnungen und Aufgaben
import test from 'node:test';
import assert from 'node:assert/strict';
import { analysiere, gleichesNetz, suffix, neueAufgabe, pruefeAntwort, ARTEN } from '../apps/werkzeuge/subnetze/subnetz.js';

test('Netzadresse, Broadcast, Anzahl (Beispiele aus dem Kapitel)', () => {
  const a = analysiere('192.168.0.33', '255.255.255.0');
  assert.equal(a.netz, '192.168.0.0'); assert.equal(a.broadcast, '192.168.0.255'); assert.equal(a.geraete, 254);
  const b = analysiere('192.68.48.117', '255.255.248.0');
  assert.equal(b.netz, '192.68.48.0'); assert.equal(b.broadcast, '192.68.55.255'); assert.equal(b.suffix, 21);
  assert.ok(gleichesNetz('192.68.48.117', '192.68.51.3', '255.255.248.0'));
  assert.ok(!gleichesNetz('1.2.3.0', '1.2.3.5', '255.255.255.252'));
  assert.equal(analysiere('4.2.1.7', '255.255.252.0').adressen, 1024);
  assert.equal(suffix('255.255.255.252'), 30);
  assert.equal(suffix('255.0.255.0'), null);
  assert.throws(() => analysiere('1.2.3', '255.0.0.0'));
});

test('Zufallsaufgaben sind lösbar und werden richtig geprüft', () => {
  for (const art of Object.keys(ARTEN)) {
    for (let i = 0; i < 200; i++) {
      const a = neueAufgabe(art, { krumm: i % 2 === 0 });
      assert.ok(pruefeAntwort(a, a.loesung), `${art}: ${a.frage}`);
      if (art === 'gleich') assert.equal(a.loesung, gleichesNetz(a.ip, a.ziel, a.maske) ? 'ja' : 'nein');
    }
  }
  assert.ok(pruefeAntwort({ art: 'suffix', loesung: '/24' }, '24'));
  assert.ok(pruefeAntwort({ art: 'anzahl', loesung: '65534' }, '65.534'));
});
