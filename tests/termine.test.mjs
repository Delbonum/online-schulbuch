// Terminbuchung: Slot-Rechnung (wie im Server), Prüfung, Kalenderdatei, CSV
import test from 'node:test';
import assert from 'node:assert/strict';
import { slots, pruefeZeitraeume, nachTagen, datumLang, terminText, ics, csv } from '../apps/werkzeuge/termine/slots.js';

const BEISPIEL = [
  { datum: '2026-11-16', von: '11:40', bis: '13:15' },
  { datum: '2026-11-13', von: '08:00', bis: '09:35' },
  { datum: '2026-11-18', von: '09:55', bis: '11:30' },
];

test('Slots aus Zeiträumen: Beispiel mündliche Prüfung (15 Minuten)', () => {
  const s = slots(BEISPIEL, { dauer: 15, pause: 0 });
  assert.equal(s.length, 18, 'je 6 Termine, 5 Minuten Rest');
  assert.deepEqual(s[0], { key: '20261113-0800', datum: '2026-11-13', von: '08:00', bis: '08:15' });
  assert.equal(s[5].von, '09:15');
  assert.equal(s[5].bis, '09:30');
  assert.equal(s[6].key, '20261116-1140');
  assert.equal(s.at(-1).bis, '11:25');
  assert.equal(slots(BEISPIEL, { dauer: 15, pause: 5 }).length, 15, 'mit Pause');
  assert.equal(nachTagen(s).length, 3);
  assert.equal(datumLang('2026-11-13'), 'Freitag, 13.11.2026');
  assert.equal(terminText(s[0]), 'Fr, 13.11.2026, 08:00–08:15 Uhr');
});

test('Zeiträume prüfen', () => {
  assert.equal(pruefeZeitraeume(BEISPIEL, { dauer: 15 }), null);
  assert.match(pruefeZeitraeume([], { dauer: 15 }), /mindestens/);
  assert.match(pruefeZeitraeume([{ datum: '2026-11-13', von: '08:00', bis: '08:10' }], { dauer: 15 }), /kürzer/);
  assert.match(pruefeZeitraeume([...BEISPIEL, { datum: '2026-11-13', von: '09:00', bis: '10:00' }], { dauer: 15 }), /überschneiden/);
});

test('Kalenderdatei und CSV', () => {
  const s = slots(BEISPIEL, { dauer: 15 })[0];
  const k = ics({ titel: 'Prüfung; Deutsch', beschreibung: 'Raum 204\nbitte pünktlich', slot: s, kennung: '123456' });
  assert.match(k, /DTSTART:20261113T080000\r\nDTEND:20261113T081500/);
  assert.match(k, /SUMMARY:Prüfung\\; Deutsch/);
  assert.match(k, /DESCRIPTION:Raum 204\\nbitte pünktlich/);
  const event = { slots: [{ ...s, plaetze: 2, gesperrt: false, buchungen: [{ seat: 0, name: 'Anna "A."', selbst: true, am: '2026-11-10T10:00:00Z' }] }] };
  const zeilen = csv(event).trim().split('\r\n');
  assert.equal(zeilen.length, 3, 'Kopf + zwei Plätze');
  assert.match(zeilen[1], /^13\.11\.2026;Freitag;08:00;08:15;1;"Anna ""A\.""";/);
  assert.match(zeilen[2], /;2;;;$/);
});
