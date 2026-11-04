// Netzwerk-Simulation: TCP/IP-Stapel ohne Oberfläche.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Netz, ipZahl, gueltigeMaske, imSelbenNetz, beschreibeRahmen } from '../apps/werkzeuge/netzwerk/netz.js';

function rechner(n, name, ip, { gateway = '', dns = '', maske = '255.255.255.0' } = {}) {
  const g = n.neuesGeraet('rechner', { name });
  Object.assign(g.nics[0], { ip, maske });
  Object.assign(g, { gateway, dns });
  return g;
}

/** ping und auf das Ende warten; gibt die Ausgabezeilen zurück */
function ping(n, g, ziel) {
  const zeilen = [];
  let fertig = false;
  n.ping(g, ziel, (z) => zeilen.push(z), () => { fertig = true; });
  n.laufe(() => fertig, 2000);
  return zeilen;
}

test('IP-Hilfen', () => {
  assert.equal(ipZahl('192.168.0.1'), 0xc0a80001);
  assert.equal(ipZahl('256.0.0.1'), null);
  assert.ok(gueltigeMaske('255.255.255.0'));
  assert.ok(!gueltigeMaske('255.0.255.0'));
  assert.ok(imSelbenNetz('10.0.0.5', '10.0.0.200', '255.255.255.0'));
  assert.ok(!imSelbenNetz('10.0.0.5', '10.0.1.5', '255.255.255.0'));
});

test('Zwei Rechner am Switch: ARP, ping, Lerntabelle des Switches', () => {
  const n = new Netz();
  const a = rechner(n, 'A', '192.168.0.1');
  const b = rechner(n, 'B', '192.168.0.2');
  const c = rechner(n, 'C', '192.168.0.3');
  const s = n.neuesGeraet('switch');
  n.verbinde(a.id, s.id); n.verbinde(b.id, s.id); n.verbinde(c.id, s.id);
  n.start();
  const zeilen = ping(n, a, '192.168.0.2');
  assert.match(zeilen.at(-1), /4 Pakete gesendet, 4 empfangen, 0 % Verlust/);
  assert.equal(n.zustand.get(a.id).arp.get('192.168.0.2').mac, b.nics[0].mac, 'ARP-Tabelle gefüllt');
  assert.equal(n.zustand.get(s.id).sat.size, 2, 'Switch kennt A und B');
  const logC = n.zustand.get(c.id).log;
  assert.ok(logC.some((z) => z.protokoll === 'ARP') && !logC.some((z) => z.protokoll === 'ICMP'), 'C sieht nur die ARP-Rundsendung');
  assert.match(ping(n, a, '192.168.0.99').at(-1), /0 empfangen/);
});

test('Zwei Netze mit Router: Gateway nötig, traceroute, TTL', () => {
  const n = new Netz();
  const a = rechner(n, 'A', '192.168.1.10');
  const b = rechner(n, 'B', '192.168.2.10', { gateway: '192.168.2.1' });
  const r = n.neuesGeraet('router');
  r.nics[0].ip = '192.168.1.1'; r.nics[1].ip = '192.168.2.1';
  n.verbinde(a.id, r.id); n.verbinde(b.id, r.id);
  n.start();
  assert.match(ping(n, a, '192.168.2.10').join('\n'), /Ziel nicht erreichbar/, 'ohne Gateway keine Route');
  n.stop(); a.gateway = '192.168.1.1'; n.start();
  assert.match(ping(n, a, '192.168.2.10').at(-1), /4 empfangen/);
  const route = [];
  let fertig = false;
  n.traceroute(a, '192.168.2.10', (z) => route.push(z), () => { fertig = true; });
  n.laufe(() => fertig, 2000);
  assert.deepEqual(route.slice(1).map((z) => z.trim()), ['1  192.168.1.1', '2  192.168.2.10']);
});

test('Router mit eigener Route über einen zweiten Router', () => {
  const n = new Netz();
  const a = rechner(n, 'A', '10.0.1.10', { gateway: '10.0.1.1' });
  const b = rechner(n, 'B', '10.0.3.10', { gateway: '10.0.3.1' });
  const r1 = n.neuesGeraet('router');
  const r2 = n.neuesGeraet('router');
  Object.assign(r1.nics[0], { ip: '10.0.1.1' }); Object.assign(r1.nics[1], { ip: '10.0.2.1' });
  Object.assign(r2.nics[0], { ip: '10.0.2.2' }); Object.assign(r2.nics[1], { ip: '10.0.3.1' });
  n.verbinde(a.id, r1.id); n.verbinde(r1.id, r2.id); n.verbinde(r2.id, b.id);
  // Kabel r1–r2 belegt r1.nic1 und r2.nic0; A an r1.nic0, B an r2.nic1
  n.start();
  assert.match(ping(n, a, '10.0.3.10').at(-1), /0 empfangen/, 'ohne Routen kommt nichts an');
  n.stop();
  r1.routen.push({ ziel: '10.0.3.0', maske: '255.255.255.0', gateway: '10.0.2.2' });
  r2.routen.push({ ziel: '10.0.1.0', maske: '255.255.255.0', gateway: '10.0.2.1' });
  n.start();
  assert.match(ping(n, a, '10.0.3.10').at(-1), /4 empfangen/);
});

test('DHCP, DNS und Webseite über TCP', () => {
  const n = new Netz();
  const s = n.neuesGeraet('switch');
  const server = rechner(n, 'Server', '192.168.0.2');
  server.software.push('webserver', 'dnsserver');
  server.daten.webserver = { laeuft: true, dateien: { 'index.html': '<h1>Hallo</h1>' } };
  server.daten.dnsserver = { laeuft: true, eintraege: [{ name: 'www.schule.de', ip: '192.168.0.2' }] };
  server.dhcpServer = { aktiv: true, von: '192.168.0.100', bis: '192.168.0.120', gateway: '192.168.0.1', dns: '192.168.0.2' };
  const client = rechner(n, 'Client', '');
  client.dhcp = true;
  n.verbinde(server.id, s.id); n.verbinde(client.id, s.id);
  n.start();
  assert.ok(n.laufe(() => n.zustand.get(client.id).dhcpFertig, 200), 'DHCP abgeschlossen');
  assert.equal(client.nics[0].ip, '192.168.0.100');
  assert.equal(client.dns, '192.168.0.2');
  let seite = null;
  n.ladeSeite(client, 'http://www.schule.de/', (e) => { seite = e; });
  n.laufe(() => seite, 500);
  assert.equal(seite.status, 'HTTP/1.1 200 OK');
  assert.equal(seite.html, '<h1>Hallo</h1>');
  seite = null;
  n.ladeSeite(client, 'www.schule.de/fehlt.html', (e) => { seite = e; });
  n.laufe(() => seite, 500);
  assert.match(seite.status, /404/);
  seite = null;
  n.ladeSeite(client, 'http://unbekannt.de/', (e) => { seite = e; });
  n.laufe(() => seite, 500);
  assert.match(seite.fehler, /Name unbekannt/);
  // Webserver aus → Verbindung abgelehnt
  server.daten.webserver.laeuft = false;
  n.dienste(server);
  seite = null;
  n.ladeSeite(client, 'http://192.168.0.2/', (e) => { seite = e; });
  n.laufe(() => seite, 500);
  assert.match(seite.fehler, /abgelehnt/);
  // Datenaustausch zeigt den TCP-Verbindungsaufbau
  const log = n.zustand.get(client.id).log;
  assert.ok(log.some((z) => z.protokoll === 'TCP' && /^SYN \(/.test(z.bemerkung)));
  assert.ok(log.some((z) => z.protokoll === 'HTTP' && z.bemerkung.startsWith('GET /')));
  assert.ok(log.some((z) => z.protokoll === 'DHCP' && z.bemerkung.startsWith('ACK')));
});

test('Kabel und Anschlüsse; Speichern und Laden', () => {
  const n = new Netz();
  const a = rechner(n, 'A', '1.1.1.1');
  const b = rechner(n, 'B', '1.1.1.2');
  const c = rechner(n, 'C', '1.1.1.3');
  n.verbinde(a.id, b.id);
  assert.throws(() => n.verbinde(a.id, c.id), /nur einen Netzwerkanschluss/);
  assert.throws(() => n.verbinde(b.id, a.id), /schon verbunden/);
  const r = n.neuesGeraet('router');
  n.verbinde(c.id, r.id);
  for (let i = 0; i < 2; i++) n.verbinde(n.neuesGeraet('switch').id, r.id);
  assert.equal(r.nics.length, 3, 'Router bekommt bei Bedarf einen Anschluss dazu');
  const kopie = Netz.ausJSON(JSON.parse(JSON.stringify(n)));
  assert.equal(kopie.geraete.size, n.geraete.size);
  assert.equal(kopie.kabel.length, n.kabel.length);
  assert.throws(() => Netz.ausJSON({ format: 'anderes' }));
  n.entferneGeraet(r.id);
  assert.ok(!n.kabel.some((k) => k.a.g === r.id || k.b.g === r.id), 'Kabel des Geräts mit entfernt');
});

test('Datenaustausch: Zeilen je Schicht', () => {
  const zeilen = beschreibeRahmen({ typ: 'IP', quellMac: 'A', zielMac: 'B', daten: { quelle: '1.1.1.1', ziel: '1.1.1.2', ttl: 64, protokoll: 'UDP', daten: { quellPort: 50000, zielPort: 53, nutzdaten: { dns: 'anfrage', name: 'x.de' } } } });
  assert.deepEqual(zeilen.map((z) => z.schicht), ['Netzzugang', 'Vermittlung', 'Transport', 'Anwendung']);
  assert.equal(zeilen[3].protokoll, 'DNS');
});
