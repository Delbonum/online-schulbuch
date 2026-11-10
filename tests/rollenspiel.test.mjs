// Rollenspiel „Nachrichten im Netzwerk“: Rollen aus den Einstellungen
import test from 'node:test';
import assert from 'node:assert/strict';
import { erzeuge, pruefe, gruppenGroessen, macListe, DNS_IP, format } from '../apps/werkzeuge/rollenspiel/rollen.js';

test('Einstellungen prüfen', () => {
  assert.equal(pruefe({ personen: 9, gruppen: 3, stufe: 1, seed: 0 }), null);
  assert.ok(pruefe({ personen: 8, gruppen: 4, stufe: 2, seed: 1 }), 'zu kleine Gruppen');
  assert.ok(pruefe({ personen: 12, gruppen: 1, stufe: 3, seed: 1 }), 'Stufe 3 braucht zwei Gruppen');
  assert.ok(pruefe({ personen: 12, gruppen: 3, stufe: 2, seed: 1000 }), 'Zufallszahl zu groß');
  assert.deepEqual(gruppenGroessen(26, 4), [7, 7, 6, 6]);
});

test('Vereinfachte Adressen: drei Buchstaben, Netzmaske 9.9.9.0, sonst alles gleich', () => {
  const k = { personen: 64, gruppen: 8, stufe: 3, seed: 517 };
  const echt = erzeuge(k);
  const einfach = erzeuge({ ...k, vereinfacht: true });
  assert.deepEqual(format(k), { maske: '255.255.255.0', broadcast: 'FF:FF' });
  assert.deepEqual(format({ vereinfacht: true }), { maske: '9.9.9.0', broadcast: 'FFF' });
  assert.equal(einfach.broadcast, 'FFF');
  const macs = einfach.karten.flatMap((c) => c.nics.map((n) => n.mac));
  assert.ok(macs.every((m) => /^[A-Z]{3}$/.test(m) && new Set(m).size === 3 && m !== 'FFF'), 'drei verschiedene Buchstaben');
  assert.equal(new Set(macs).size, macs.length, 'eindeutig');
  assert.ok(einfach.karten.every((c) => c.nics.every((n) => n.maske === '9.9.9.0')));
  einfach.karten.forEach((c, i) => {
    assert.equal(c.name, echt.karten[i].name);
    assert.deepEqual(c.nics.map((n) => n.ip), echt.karten[i].nics.map((n) => n.ip));
  });
  // Buchstaben-MACs hängen nur von der Zufallszahl ab, nicht von der Stufe
  assert.deepEqual(erzeuge({ ...k, stufe: 1, vereinfacht: true }).karten.map((c) => c.nics[0].mac), einfach.karten.map((c) => c.nics[0].mac));
});

test('Rollen: eindeutige Adressen, gleiche Daten in allen Stufen, Router und DNS in Stufe 3', () => {
  for (const personen of [9, 24, 31, 64]) {
    const gruppen = Math.min(8, Math.floor(personen / 3));
    const stufen = [1, 2, 3].map((stufe) => erzeuge({ personen, gruppen, stufe, seed: 517 }));
    for (const erg of stufen) {
      assert.equal(erg.karten.length, personen);
      const macs = erg.karten.flatMap((k) => k.nics.map((n) => n.mac));
      assert.equal(new Set(macs).size, macs.length, 'MACs eindeutig');
      assert.ok(macs.every((m) => /^[0-9A-F]{2}:[0-9A-F]{2}$/.test(m) && m !== 'FF:FF'));
      const ips = erg.karten.flatMap((k) => k.nics.map((n) => n.ip));
      assert.equal(new Set(ips).size, ips.length, 'IPs eindeutig');
      assert.equal(new Set(erg.karten.map((k) => k.name)).size, personen, 'Namen eindeutig');
    }
    // Namen, erste MAC und IP sind in jeder Stufe dieselben
    stufen[0].karten.forEach((k, i) => {
      for (const s of stufen.slice(1)) {
        assert.equal(s.karten[i].name, k.name);
        assert.equal(s.karten[i].nics[0].mac, k.nics[0].mac);
        assert.equal(s.karten[i].nics[0].ip, k.nics[0].ip);
      }
    });
    const s3 = stufen[2];
    const router = s3.karten.filter((k) => k.rolle === 'router');
    assert.equal(router.length, gruppen);
    router.forEach((r) => {
      assert.deepEqual(r.nics.map((n) => n.ip), [`1.1.${r.gruppe}.1`, `3.3.3.${r.gruppe}`]);
      assert.equal(r.routing.length, gruppen + 3);
    });
    const dns = s3.karten.filter((k) => k.rolle === 'dns');
    assert.equal(dns.length, 1);
    assert.equal(dns[0].nics[0].ip, DNS_IP);
    assert.equal(dns[0].dnsTabelle.length, personen);
    s3.karten.filter((k) => k.rolle !== 'router').forEach((k) => {
      assert.equal(k.gateway, `1.1.${k.gruppe}.1`);
      assert.equal(k.dns, DNS_IP);
    });
    assert.ok(stufen[0].karten.every((k) => k.rolle === 'client' && !k.gateway));
    assert.equal(macListe(stufen[0], 1).length, gruppenGroessen(personen, gruppen)[0]);
  }
  // andere Zufallszahl → andere Verteilung
  assert.notDeepEqual(erzeuge({ personen: 12, gruppen: 3, stufe: 2, seed: 1 }).karten.map((k) => k.name),
    erzeuge({ personen: 12, gruppen: 3, stufe: 2, seed: 2 }).karten.map((k) => k.name));
});
