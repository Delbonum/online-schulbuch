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

function mailNetz() {
  const n = new Netz();
  const r = n.neuesGeraet('router');
  r.nics[0].ip = '10.1.0.1'; r.nics[1].ip = '10.2.0.1';
  const s1 = n.neuesGeraet('switch');
  const s2 = n.neuesGeraet('switch');
  n.verbinde(s1.id, r.id); n.verbinde(s2.id, r.id);
  const dns = rechner(n, 'DNS', '10.1.0.53', { gateway: '10.1.0.1' });
  dns.software.push('dnsserver');
  dns.daten.dnsserver = { laeuft: true, eintraege: [
    { name: 'mail.schule.test', typ: 'A', ip: '10.1.0.25' }, { name: 'schule.test', typ: 'MX', ip: 'mail.schule.test' },
    { name: 'mail.verein.test', typ: 'A', ip: '10.2.0.25' }, { name: 'verein.test', typ: 'MX', ip: 'mail.verein.test' },
  ] };
  const server = (name, ip, gw, domain, konten) => {
    const g = rechner(n, name, ip, { gateway: gw, dns: '10.1.0.53' });
    g.software.push('emailserver');
    g.daten.emailserver = { laeuft: true, domain, konten };
    return g;
  };
  const m1 = server('Mail Schule', '10.1.0.25', '10.1.0.1', 'schule.test', [{ name: 'anna', passwort: 'a1' }, { name: 'carl', passwort: 'c1' }]);
  const m2 = server('Mail Verein', '10.2.0.25', '10.2.0.1', 'verein.test', [{ name: 'ben', passwort: 'b1' }]);
  const anna = rechner(n, 'Anna', '10.1.0.10', { gateway: '10.1.0.1', dns: '10.1.0.53' });
  anna.daten.emailprogramm = { adresse: 'anna@schule.test', smtp: 'mail.schule.test', pop3: 'mail.schule.test', benutzer: 'anna', passwort: 'a1' };
  const ben = rechner(n, 'Ben', '10.2.0.10', { gateway: '10.2.0.1', dns: '10.1.0.53' });
  ben.daten.emailprogramm = { adresse: 'ben@verein.test', smtp: 'mail.verein.test', pop3: 'mail.verein.test', benutzer: 'ben', passwort: 'b1' };
  [dns, m1, anna].forEach((g) => n.verbinde(g.id, s1.id));
  [m2, ben].forEach((g) => n.verbinde(g.id, s2.id));
  n.start();
  return { n, m1, m2, anna, ben };
}

const warte = (n, aufruf) => {
  let e = null;
  aufruf((x) => { e = x ?? 'ok'; });
  n.laufe(() => e !== null, 3000);
  return e;
};

test('E-Mail: über zwei Domains senden (SMTP, MX, Weiterleitung) und abholen (POP3)', () => {
  const { n, m1, m2, ben, anna } = mailNetz();
  assert.equal(warte(n, (f) => n.mailSenden(anna, { an: ['ben@verein.test', 'carl@schule.test'], betreff: 'Hallo', text: 'Treffen um 3?\n.\nBis dann' }, f)), 'ok');
  n.laufe(() => (n.zustand.get(m1.id).mailEreignisse ?? []).some((e) => e.text.includes('übergeben')), 3000);
  assert.equal(m1.daten.emailserver.postfaecher.carl.length, 1, 'lokale Zustellung');
  assert.equal(m2.daten.emailserver.postfaecher.ben.length, 1, 'weitergeleitet an die fremde Domain');
  const ereignisse = n.zustand.get(m1.id).mailEreignisse.map((e) => e.text).join('\n');
  assert.match(ereignisse, /MX/);
  assert.match(ereignisse, /übergeben/);
  assert.deepEqual(warte(n, (f) => n.mailAbholen(ben, f)), { neu: 1 });
  const mail = ben.daten.emailprogramm.eingang[0];
  assert.equal(mail.von, 'anna@schule.test');
  assert.equal(mail.betreff, 'Hallo');
  assert.equal(mail.text, 'Treffen um 3?\n.\nBis dann', 'Punkt-Zeile übersteht SMTP');
  assert.equal(m2.daten.emailserver.postfaecher.ben.length, 0, 'POP3 löscht nach dem Abholen');
  const log = n.zustand.get(ben.id).log;
  assert.ok(['USER ben', 'RETR 1', 'DELE 1'].every((c) => log.some((z) => z.protokoll === 'POP3' && z.bemerkung === c)));
  assert.ok(n.zustand.get(anna.id).log.some((z) => z.protokoll === 'SMTP' && z.bemerkung === 'MAIL FROM:<anna@schule.test>'));
});

test('E-Mail: Fehlerfälle', () => {
  const { n, anna, ben } = mailNetz();
  assert.match(warte(n, (f) => n.mailSenden(anna, { an: ['niemand@schule.test'], betreff: 'x', text: 'y' }, f)), /^550/);
  ben.daten.emailprogramm.passwort = 'falsch';
  assert.match(warte(n, (f) => n.mailAbholen(ben, f)).fehler, /Passwort falsch/);
  anna.daten.emailprogramm.smtp = '';
  assert.match(warte(n, (f) => n.mailSenden(anna, { an: ['ben@verein.test'], betreff: 'x', text: 'y' }, f)), /Postausgangsserver/);
});

test('Firewall auf einem Rechner: Ping und Webserver sperren bzw. freigeben, Antworten kommen durch', () => {
  const n = new Netz();
  const s = n.neuesGeraet('switch');
  const a = rechner(n, 'A', '192.168.0.1');
  const srv = rechner(n, 'Server', '192.168.0.2');
  srv.software.push('webserver', 'firewall');
  srv.daten.webserver = { laeuft: true, dateien: { 'index.html': 'ok' } };
  srv.firewall = { aktiv: true, standard: 'verwerfen', antworten: true, regeln: [] };
  n.verbinde(a.id, s.id); n.verbinde(srv.id, s.id);
  n.start();
  assert.match(ping(n, a, '192.168.0.2').at(-1), /0 empfangen/, 'Ping wird verworfen');
  assert.match(ping(n, srv, '192.168.0.1').at(-1), /4 empfangen/, 'eigene Pings: Antworten kommen durch');
  let seite = null;
  n.ladeSeite(a, 'http://192.168.0.2/', (e) => { seite = e; });
  n.laufe(() => seite, 500);
  assert.match(seite.fehler, /Zeitüberschreitung/, 'Webserver gesperrt');
  srv.firewall.regeln.push({ aktion: 'zulassen', protokoll: 'TCP', quelle: '192.168.0.0/24', ziel: '', port: '80' });
  seite = null;
  n.ladeSeite(a, 'http://192.168.0.2/', (e) => { seite = e; });
  n.laufe(() => seite, 500);
  assert.equal(seite.html, 'ok', 'mit Regel für Port 80 erreichbar');
  const z = n.zustand.get(srv.id);
  assert.ok(z.fwVerworfen >= 4 && z.log.some((x) => x.protokoll === 'Firewall' && /Ping-Anfrage/.test(x.bemerkung)));
  srv.software = srv.software.filter((x) => x !== 'firewall');
  assert.match(ping(n, a, '192.168.0.2').at(-1), /4 empfangen/, 'ohne installierte Software wirkt die Firewall nicht');
});

test('Firewall auf dem Router: Regeln zwischen zwei Netzen', () => {
  const n = new Netz();
  const a = rechner(n, 'A', '10.1.0.10', { gateway: '10.1.0.1' });
  const b = rechner(n, 'B', '10.2.0.10', { gateway: '10.2.0.1' });
  b.software.push('webserver');
  b.daten.webserver = { laeuft: true, dateien: { 'index.html': 'ok' } };
  const r = n.neuesGeraet('router');
  r.nics[0].ip = '10.1.0.1'; r.nics[1].ip = '10.2.0.1';
  n.verbinde(a.id, r.id); n.verbinde(b.id, r.id);
  r.firewall = { aktiv: true, standard: 'zulassen', antworten: true, regeln: [{ aktion: 'verwerfen', protokoll: 'TCP', quelle: '10.1.0.0/255.255.255.0', ziel: '10.2.0.10', port: '80' }] };
  n.start();
  assert.match(ping(n, a, '10.2.0.10').at(-1), /4 empfangen/, 'Ping darf durch');
  let seite = null;
  n.ladeSeite(a, 'http://10.2.0.10/', (e) => { seite = e; });
  n.laufe(() => seite, 500);
  assert.ok(seite.fehler, 'HTTP von Netz 1 zu B gesperrt');
  r.firewall.regeln[0].aktion = 'zulassen';
  seite = null;
  n.ladeSeite(a, 'http://10.2.0.10/', (e) => { seite = e; });
  n.laufe(() => seite, 500);
  assert.equal(seite.html, 'ok');
});

test('Firewall-Hilfen: Adressbereiche', async () => {
  const { adressbereich, regelPasst } = await import('../apps/werkzeuge/netzwerk/netz.js');
  assert.deepEqual(adressbereich(''), { netz: 0, maske: 0 });
  assert.equal(adressbereich('192.168.1.7/24').netz, adressbereich('192.168.1.0/255.255.255.0').netz);
  assert.equal(adressbereich('300.1.1.1'), null);
  const p = { protokoll: 'UDP', quelle: '10.0.0.5', ziel: '10.0.0.53', daten: { zielPort: 53 } };
  assert.ok(regelPasst({ protokoll: 'UDP', quelle: '10.0.0.0/8', ziel: '', port: '53' }, p));
  assert.ok(!regelPasst({ protokoll: 'TCP', quelle: '', ziel: '', port: '' }, p));
  assert.ok(!regelPasst({ protokoll: 'alle', quelle: '10.0.0.6', ziel: '', port: '' }, p));
});

test('Echo-Server und einfacher Client: Verbindung, Nachrichten, Trennen', async () => {
  const { ECHO_PORT } = await import('../apps/werkzeuge/netzwerk/netz.js');
  const n = new Netz();
  const s = n.neuesGeraet('switch');
  const a = rechner(n, 'A', '192.168.0.1');
  const srv = rechner(n, 'Server', '192.168.0.2');
  srv.software.push('echoserver');
  srv.daten.echoserver = { laeuft: true, port: ECHO_PORT };
  n.verbinde(a.id, s.id); n.verbinde(srv.id, s.id);
  n.start();
  const empfangen = [];
  let verbunden = null;
  let ende = null;
  n.tcpVerbindung(a, '192.168.0.2', ECHO_PORT, { verbunden: (v) => { verbunden = v; }, daten: (t) => empfangen.push(t), ende: (e) => { ende = e; } });
  n.laufe(() => verbunden, 200);
  assert.ok(verbunden, 'verbunden');
  n.laufe(() => false, 300); // lange Pause: die Verbindung bleibt offen
  assert.equal(verbunden.zustand, 'bereit');
  verbunden.senden('Hallo');
  verbunden.senden('Welt');
  n.laufe(() => empfangen.length === 2, 200);
  assert.deepEqual(empfangen, ['Hallo', 'Welt']);
  verbunden.trennen();
  n.laufe(() => ende, 200);
  assert.ok(ende && !ende.fehler, 'sauber getrennt');
  const ereignisse = n.zustand.get(srv.id).echoEreignisse.map((e) => e.text);
  assert.ok(ereignisse[0].startsWith('Verbindung von 192.168.0.1') && ereignisse.at(-1).includes('beendet'));
  assert.ok(n.zustand.get(a.id).log.some((z) => z.protokoll === 'Echo' && z.bemerkung === 'Hallo'));
  ende = null;
  n.tcpVerbindung(a, '192.168.0.2', 4711, { ende: (e) => { ende = e; } });
  n.laufe(() => ende, 200);
  assert.match(ende.fehler, /abgelehnt/);
});

test('Modem: zwei Simulationen wie über eine Leitung verbunden (ping, kaputte Rahmen)', () => {
  // zwei getrennte Netze; was ein Modem am Kabel empfängt, kommt beim anderen wieder heraus (sonst: über die API)
  const n1 = new Netz();
  const n2 = new Netz();
  const a = rechner(n1, 'A', '10.0.0.1');
  const m1 = n1.neuesGeraet('modem');
  n1.verbinde(a.id, m1.id);
  const b = rechner(n2, 'B', '10.0.0.2');
  const s = n2.neuesGeraet('switch');
  const m2 = n2.neuesGeraet('modem');
  n2.verbinde(b.id, s.id); n2.verbinde(m2.id, s.id);
  assert.throws(() => n1.verbinde(n1.neuesGeraet('switch').id, m1.id), /nur einen Netzwerkanschluss/);
  n1.modemAusgang = (g, r) => n2.modemEingang(m2.id, r);
  n2.modemAusgang = (g, r) => n1.modemEingang(m1.id, r);
  n1.start(); n2.start();
  const zeilen = [];
  let fertig = false;
  n1.ping(a, '10.0.0.2', (z) => zeilen.push(z), () => { fertig = true; });
  for (let i = 0; i < 2000 && !fertig; i++) { n1.schritt(); n2.schritt(); }
  assert.match(zeilen.at(-1), /4 Pakete gesendet, 4 empfangen/);
  // Unsinn von der Gegenseite wird verworfen und hält die Simulation nicht an
  n1.modemEingang(m1.id, { typ: 'IP', quellMac: 'x', zielMac: a.nics[0].mac, daten: { protokoll: 'TCP' } });
  n1.modemEingang(m1.id, { typ: 'Quatsch' });
  n1.modemEingang(m1.id, null);
  assert.doesNotThrow(() => n1.laufe(() => false, 5));
});

test('Dateisystem: Ordner, Dateien, Umbenennen, Löschen, Webserver liefert /webserver aus', async () => {
  const fs = await import('../apps/werkzeuge/netzwerk/netz.js');
  const { fuehreAus } = await import('../apps/werkzeuge/netzwerk/befehle.js');
  const n = new Netz();
  const g = rechner(n, 'A', '192.168.0.1');
  assert.deepEqual(fs.ordnerInhalt(g, '/').map((e) => e.name), ['dokumente', 'webserver']);
  fs.schreibeDatei(g, '/dokumente/notiz.txt', 'Hallo');
  fs.neuerOrdner(g, '/dokumente/projekt');
  fs.schreibeDatei(g, '/dokumente/projekt/a.txt', 'A');
  assert.deepEqual(fs.ordnerInhalt(g, '/dokumente').map((e) => `${e.ordner ? 'D' : 'F'}:${e.name}`), ['D:projekt', 'F:notiz.txt']);
  assert.throws(() => fs.schreibeDatei(g, '/gibtsnicht/x.txt', ''), /gibt es nicht/);
  assert.throws(() => fs.neuerOrdner(g, '/dokumente/projekt'), /schon/);
  assert.throws(() => fs.neuerOrdner(g, '/dokumente/a:b'), /nicht erlaubt/);
  assert.equal(fs.normalerPfad('/../etc'), null);
  assert.equal(fs.benenneUm(g, '/dokumente/projekt', 'arbeit'), '/dokumente/arbeit');
  assert.equal(fs.leseDatei(g, '/dokumente/arbeit/a.txt'), 'A');
  fs.loesche(g, '/dokumente/arbeit');
  assert.equal(fs.existiert(g, '/dokumente/arbeit/a.txt'), null);
  // ältere Entwürfe: Webseiten wandern nach /webserver
  g.daten.webserver = { laeuft: true, dateien: { 'index.html': '<h1>Alt</h1>' } };
  assert.match(n.http(g, 'GET / HTTP/1.1'), /200 OK[\s\S]*Alt/);
  assert.equal(g.daten.webserver.dateien, undefined);
  fs.schreibeDatei(g, '/webserver/info.html', 'Info');
  fs.schreibeDatei(g, '/dokumente/geheim.txt', 'geheim');
  assert.match(n.http(g, 'GET /info.html HTTP/1.1'), /200 OK/);
  assert.match(n.http(g, 'GET /../dokumente/geheim.txt HTTP/1.1'), /404/);
  // Befehlszeile
  const zeilen = [];
  fuehreAus(n, g, 'dir /webserver', (z) => zeilen.push(z), () => {});
  fuehreAus(n, g, 'type /dokumente/notiz.txt', (z) => zeilen.push(z), () => {});
  assert.ok(zeilen.some((z) => z.includes('info.html')) && zeilen.includes('Hallo'));
  // bleibt beim Speichern und Laden erhalten
  const neu = Netz.ausJSON(JSON.parse(JSON.stringify(n)));
  assert.equal(fs.leseDatei(neu.geraete.get(g.id), '/dokumente/notiz.txt'), 'Hallo');
});

test('Peer-to-Peer: beitreten, Suche über mehrere Peers (TTL), herunterladen, verlassen', async () => {
  const { schreibeDatei, leseDatei, P2P_ORDNER } = await import('../apps/werkzeuge/netzwerk/netz.js');
  const n = new Netz();
  const s = n.neuesGeraet('switch');
  const [a, b, c, d, e] = ['A', 'B', 'C', 'D', 'E'].map((x, i) => {
    const g = rechner(n, x, `192.168.0.${i + 1}`);
    g.software.push('peertopeer');
    n.p2pFreigaben(g); // legt /peer2peer an
    n.verbinde(g.id, s.id);
    return g;
  });
  schreibeDatei(d, `${P2P_ORDNER}/lied.txt`, 'La la la');
  schreibeDatei(e, `${P2P_ORDNER}/lied-weit-weg.txt`, 'zu weit');
  schreibeDatei(b, `${P2P_ORDNER}/rezept.txt`, 'Mehl');
  n.start();
  // Kette A – B – C – D – E (jeder kennt nur seine Nachbarn)
  const beitreten = (g, ip) => { let ok; n.p2pBeitreten(g, ip, (f) => { ok = f ?? true; }); n.laufe(() => ok !== undefined, 300); assert.equal(ok, true); };
  beitreten(a, '192.168.0.2'); beitreten(c, '192.168.0.2'); beitreten(d, '192.168.0.3'); beitreten(e, '192.168.0.4');
  assert.deepEqual(n.p2p(b).nachbarn.sort(), ['192.168.0.1', '192.168.0.3']);
  const id = n.p2pSuche(a, 'LIED');
  n.laufe(() => false, 400);
  const treffer = n.p2p(a).suchen.get(id).treffer;
  // D ist 3 Schritte entfernt (TTL 3), E wäre der 4. – zu weit
  assert.deepEqual(treffer, [{ ip: '192.168.0.4', name: 'lied.txt' }]);
  assert.ok(n.p2p(c).ereignisse.some((x) => x.text.includes('Suche „LIED“')));
  let fehler; let pfad;
  n.p2pHerunterladen(a, '192.168.0.4', 'lied.txt', (f, p) => { fehler = f; pfad = p ?? null; });
  n.laufe(() => pfad !== undefined || fehler, 300);
  assert.equal(fehler, null);
  assert.equal(leseDatei(a, pfad), 'La la la');
  assert.ok(n.zustand.get(a.id).log.some((z) => z.protokoll === 'P2P' && z.bemerkung.startsWith('QUERY')));
  // fehlende Datei, verlassen
  fehler = undefined;
  n.p2pHerunterladen(a, '192.168.0.4', 'gibtsnicht.txt', (f) => { fehler = f; });
  n.laufe(() => fehler !== undefined, 300);
  assert.match(fehler, /nicht/);
  n.p2pVerlassen(a);
  n.laufe(() => false, 100);
  assert.deepEqual(n.p2p(b).nachbarn, ['192.168.0.3']);
});

test('Dokumentation: Notizen werden gespeichert, geladen und geprüft', () => {
  const n = new Netz();
  const t = n.neueNotiz('text', { x: 50, y: 60 });
  t.text = 'Schulnetz\nRaum 12';
  const b = n.neueNotiz('bereich', { x: 10, y: 20 });
  assert.throws(() => n.neueNotiz('kreis'), /Unbekannte/);
  const daten = JSON.parse(JSON.stringify(n));
  daten.notizen.push({ id: 'x', art: 'bereich', x: -50, y: 'quatsch', b: 99999, h: 5 }, { art: 'text' }, null);
  const geladen = Netz.ausJSON(daten);
  assert.equal(geladen.notizen.length, 3);
  assert.equal(geladen.notizen[0].text, 'Schulnetz\nRaum 12');
  assert.deepEqual([geladen.notizen[2].x, geladen.notizen[2].y, geladen.notizen[2].b, geladen.notizen[2].h], [0, 100, 2000, 30]);
  geladen.entferneNotiz(b.id);
  assert.equal(geladen.notizen.length, 2);
  // ältere Dateien ohne Notizen
  delete daten.notizen;
  assert.deepEqual(Netz.ausJSON(daten).notizen, []);
});

test('Handy (smartphone): Endgerät mit Software, per WLAN (wie ein Kabel) am Switch', async () => {
  const { istEndgeraet, ordnerInhalt } = await import('../apps/werkzeuge/netzwerk/netz.js');
  const n = new Netz();
  const s = n.neuesGeraet('switch');
  const a = rechner(n, 'A', '192.168.0.1');
  const h = n.neuesGeraet('smartphone');
  assert.equal(h.name, 'Handy 1');
  assert.ok(istEndgeraet(h) && h.software.includes('befehlszeile') && ordnerInhalt(h, '/').length === 2);
  h.nics[0].ip = '192.168.0.50';
  n.verbinde(a.id, s.id); n.verbinde(h.id, s.id);
  assert.throws(() => n.verbinde(h.id, a.id), /nur einen Netzwerkanschluss/);
  n.start();
  assert.match(ping(n, h, '192.168.0.1').at(-1), /4 empfangen/);
});

test('Beispielnetze: alle lassen sich bauen, speichern und laden; Rollenspiel-Netz und Fehlersuche verhalten sich wie beschrieben', async () => {
  const { BEISPIELE, beispiel } = await import('../apps/werkzeuge/netzwerk/beispiele.js');
  const slugs = new Set();
  for (const b of BEISPIELE) {
    assert.ok(/^[a-z-]+$/.test(b.slug) && !slugs.has(b.slug), `Kurzname ${b.slug}`);
    slugs.add(b.slug);
    const n = b.baue();
    assert.ok(n.geraete.size > 0, b.titel);
    assert.equal(Netz.ausJSON(JSON.parse(JSON.stringify(n))).geraete.size, n.geraete.size);
  }
  assert.equal(beispiel('gibt-es-nicht'), null);

  // Rollenspiel-Netz: ping über drei Subnetze per Name (DNS) und traceroute über zwei Router
  const n = beispiel('rollenspiel').baue();
  const namen = (name) => [...n.geraete.values()].find((g) => g.name === name);
  n.start();
  assert.match(ping(n, namen('adler'), 'luchs').at(-1), /4 empfangen/);
  assert.match(ping(n, namen('elch'), '1.1.3.3').at(-1), /4 empfangen/);

  // Fehlersuche: C liegt in einem anderen Subnetz, E hängt an keinem Kabel
  const f = beispiel('fehlersuche-lan').baue();
  const fg = (name) => [...f.geraete.values()].find((g) => g.name === name);
  f.start();
  assert.match(ping(f, fg('Rechner B'), '192.168.0.11').at(-1), /4 empfangen/);
  assert.match(ping(f, fg('Rechner B'), '192.168.1.13').join('\n'), /nicht erreichbar|0 empfangen/);
  assert.match(ping(f, fg('Rechner B'), '192.168.0.15').at(-1), /0 empfangen/);

  // Drei Netze: ohne eigene Routen kein Durchkommen, mit Routen schon
  const d = beispiel('drei-netze').baue();
  const dg = (name) => [...d.geraete.values()].find((g) => g.name === name);
  d.start();
  assert.doesNotMatch(ping(d, dg('Rechner A1'), '192.168.20.10').at(-1), /4 empfangen/);
  d.stop();
  dg('Router 1').routen = [{ ziel: '192.168.20.0', maske: '255.255.255.0', gateway: '10.0.0.2' }];
  dg('Router 2').routen = [{ ziel: '192.168.10.0', maske: '255.255.255.0', gateway: '10.0.0.1' }];
  d.start();
  assert.match(ping(d, dg('Rechner A1'), '192.168.20.10').at(-1), /4 empfangen/);
});

test('Klassen-Internet: Gruppennetz und Provider-Netz über Modems verbunden (Ping per Namen, Webseite)', async () => {
  const { beispiel } = await import('../apps/werkzeuge/netzwerk/beispiele.js');
  const p = beispiel('provider').baue();
  const g1 = beispiel('heimnetz').baue();
  const nach = (n, name) => [...n.geraete.values()].find((g) => g.name === name);
  const mP = nach(p, 'Modem Gruppe 1');
  const mG = nach(g1, 'Modem');
  p.modemAusgang = (g, r) => { if (g.id === mP.id) g1.modemEingang(mG.id, r); };
  g1.modemAusgang = (g, r) => p.modemEingang(mP.id, r);
  p.start(); g1.start();
  const zeilen = [];
  let fertig = false;
  g1.ping(nach(g1, 'Notebook'), 'portal.provider.test', (z) => zeilen.push(z), () => { fertig = true; });
  for (let i = 0; i < 4000 && !fertig; i++) { p.schritt(); g1.schritt(); }
  assert.match(zeilen.at(-1), /4 empfangen/, zeilen.join('\n'));
  // und umgekehrt: Provider-Notebook erreicht den Webserver der Gruppe per Namen
  const z2 = [];
  fertig = false;
  p.ping(nach(p, 'Technik'), 'www.gruppe1.test', (z) => z2.push(z), () => { fertig = true; });
  for (let i = 0; i < 4000 && !fertig; i++) { p.schritt(); g1.schritt(); }
  assert.match(z2.at(-1), /4 empfangen/, z2.join('\n'));
});
