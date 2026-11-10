// Beispielnetze der Netzwerk-Simulation (ohne DOM, testbar).
// Jedes Beispiel hat einen Kurznamen (slug): /informatik/werkzeuge/netzwerk-simulation/?beispiel=<slug> lädt es direkt,
// so verlinken die Seiten des Kapitels „Netzwerksysteme“ passende Ausgangsnetze für ihre Aufgaben.

import { Netz, schreibeDatei } from './netz.js';

/** Endgerät mit fester Adresse anlegen und an einen Switch hängen */
function host(n, typ, name, x, y, ip, { gateway = '', dns = '', maske = '255.255.255.0', software = ['befehlszeile'], an = null } = {}) {
  const g = n.neuesGeraet(typ, { x, y, name });
  Object.assign(g.nics[0], { ip, maske });
  Object.assign(g, { gateway, dns, software: [...software] });
  if (an) n.verbinde(g.id, an.id);
  return g;
}

function zweiRechnerAmSwitch() {
  const n = new Netz();
  const s = n.neuesGeraet('switch', { x: 420, y: 240 });
  const a = n.neuesGeraet('rechner', { x: 200, y: 100, name: 'Rechner A' });
  const b = n.neuesGeraet('rechner', { x: 640, y: 100, name: 'Rechner B' });
  const c = n.neuesGeraet('notebook', { x: 420, y: 420, name: 'Notebook C' });
  a.nics[0].ip = '192.168.0.1'; b.nics[0].ip = '192.168.0.2'; c.nics[0].ip = '192.168.0.3';
  [a, b, c].forEach((g) => n.verbinde(g.id, s.id));
  return n;
}

function zweiNetzeMitRouter() {
  const n = new Netz();
  const r = n.neuesGeraet('router', { x: 520, y: 240, name: 'Router' });
  const s1 = n.neuesGeraet('switch', { x: 260, y: 240, name: 'Switch 1' });
  const s2 = n.neuesGeraet('switch', { x: 780, y: 240, name: 'Switch 2' });
  n.verbinde(s1.id, r.id); n.verbinde(s2.id, r.id);
  r.nics[0].ip = '192.168.1.1'; r.nics[1].ip = '192.168.2.1';
  [['A', 100, 100, '192.168.1.10', s1, '192.168.1.1'], ['B', 100, 380, '192.168.1.11', s1, '192.168.1.1'],
    ['C', 960, 100, '192.168.2.10', s2, '192.168.2.1'], ['D', 960, 380, '192.168.2.11', s2, '']].forEach(([name, x, y, ip, s, gw]) => {
    const g = n.neuesGeraet('rechner', { x, y, name: `Rechner ${name}` });
    g.nics[0].ip = ip;
    g.gateway = gw;
    n.verbinde(g.id, s.id);
  });
  return n; // Rechner D fehlt das Gateway – ein guter Anlass zur Fehlersuche
}

function kleinesInternet() {
  const n = new Netz();
  const s1 = n.neuesGeraet('switch', { x: 300, y: 260, name: 'Switch Schule' });
  const r = n.neuesGeraet('router', { x: 560, y: 260, name: 'Router' });
  const s2 = n.neuesGeraet('switch', { x: 820, y: 260, name: 'Switch Provider' });
  n.verbinde(s1.id, r.id); n.verbinde(s2.id, r.id);
  r.nics[0].ip = '192.168.0.1'; r.nics[1].ip = '10.0.0.1';
  const dhcp = n.neuesGeraet('rechner', { x: 300, y: 450, name: 'Schulserver' });
  Object.assign(dhcp.nics[0], { ip: '192.168.0.2' });
  dhcp.gateway = '192.168.0.1';
  dhcp.dhcpServer = { aktiv: true, von: '192.168.0.100', bis: '192.168.0.150', gateway: '192.168.0.1', dns: '10.0.0.53' };
  for (const [i, x] of [[1, 80], [2, 200]]) {
    const g = n.neuesGeraet('notebook', { x, y: 80, name: `Schüler ${i}` });
    g.dhcp = true;
    g.nics[0].ip = '';
    g.software = ['befehlszeile', 'webbrowser'];
    n.verbinde(g.id, s1.id);
  }
  n.verbinde(dhcp.id, s1.id);
  const dns = n.neuesGeraet('rechner', { x: 1040, y: 100, name: 'DNS-Server' });
  dns.nics[0].ip = '10.0.0.53'; dns.nics[0].maske = '255.255.255.0'; dns.gateway = '10.0.0.1';
  dns.software = ['befehlszeile', 'dnsserver'];
  dns.daten.dnsserver = { laeuft: true, eintraege: [{ name: 'www.schulbuch.test', ip: '10.0.0.80' }] };
  const web = n.neuesGeraet('rechner', { x: 1040, y: 400, name: 'Webserver' });
  web.nics[0].ip = '10.0.0.80'; web.gateway = '10.0.0.1';
  web.software = ['befehlszeile', 'webserver'];
  web.daten.webserver = { laeuft: true };
  Object.entries({ 'index.html': '<html><body>\n<h1>Willkommen!</h1>\n<p>Diese Seite kam über DNS, Router und TCP zu dir.</p>\n<p><a href="impressum.html">Impressum</a></p>\n</body></html>\n', 'impressum.html': '<html><body><h1>Impressum</h1><p><a href="index.html">Zurück</a></p></body></html>\n' })
    .forEach(([name, text]) => schreibeDatei(web, `/webserver/${name}`, text));
  n.verbinde(dns.id, s2.id); n.verbinde(web.id, s2.id);
  return n;
}

function emailZweiDomains() {
  const n = new Netz();
  const r = n.neuesGeraet('router', { x: 560, y: 300, name: 'Router' });
  const s1 = n.neuesGeraet('switch', { x: 300, y: 300, name: 'Switch Schule' });
  const s2 = n.neuesGeraet('switch', { x: 820, y: 300, name: 'Switch Verein' });
  n.verbinde(s1.id, r.id); n.verbinde(s2.id, r.id);
  r.nics[0].ip = '10.1.0.1'; r.nics[1].ip = '10.2.0.1';
  const h = (name, typ, x, y, ip, gw, software, s) => host(n, typ, name, x, y, ip, { gateway: gw, dns: '10.1.0.53', software: ['befehlszeile', ...software], an: s });
  const dns = h('DNS-Server', 'rechner', 300, 520, '10.1.0.53', '10.1.0.1', ['dnsserver'], s1);
  dns.daten.dnsserver = { laeuft: true, eintraege: [
    { name: 'mail.schule.test', typ: 'A', ip: '10.1.0.25' }, { name: 'schule.test', typ: 'MX', ip: 'mail.schule.test' },
    { name: 'mail.verein.test', typ: 'A', ip: '10.2.0.25' }, { name: 'verein.test', typ: 'MX', ip: 'mail.verein.test' },
  ] };
  const m1 = h('Mailserver Schule', 'rechner', 100, 520, '10.1.0.25', '10.1.0.1', ['emailserver'], s1);
  m1.daten.emailserver = { laeuft: true, domain: 'schule.test', konten: [{ name: 'anna', passwort: 'anna' }, { name: 'carl', passwort: 'carl' }], postfaecher: {} };
  const m2 = h('Mailserver Verein', 'rechner', 1020, 520, '10.2.0.25', '10.2.0.1', ['emailserver'], s2);
  m2.daten.emailserver = { laeuft: true, domain: 'verein.test', konten: [{ name: 'ben', passwort: 'ben' }], postfaecher: {} };
  const konto = (adresse, server) => ({ adresse, smtp: server, pop3: server, benutzer: adresse.split('@')[0], passwort: adresse.split('@')[0], eingang: [], gesendet: [] });
  h('Anna', 'notebook', 100, 100, '10.1.0.10', '10.1.0.1', ['emailprogramm'], s1).daten.emailprogramm = konto('anna@schule.test', 'mail.schule.test');
  h('Carl', 'notebook', 300, 80, '10.1.0.11', '10.1.0.1', ['emailprogramm'], s1).daten.emailprogramm = konto('carl@schule.test', 'mail.schule.test');
  h('Ben', 'notebook', 1020, 100, '10.2.0.10', '10.2.0.1', ['emailprogramm'], s2).daten.emailprogramm = konto('ben@verein.test', 'mail.verein.test');
  return n;
}

/** Wie im Rollenspiel: vier Gruppen-Netze 1.1.g.x, je ein Router (1.1.g.1 und 3.3.3.g) am Backbone 3.3.3.x, DNS-Server 1.1.1.2 */
function rollenspielNetz() {
  const n = new Netz();
  const backbone = n.neuesGeraet('switch', { x: 1000, y: 600, name: 'Backbone-Switch' });
  const ecken = [[420, 300], [1580, 300], [420, 900], [1580, 900]];
  const tiere = [['adler', 'biber'], ['dachs', 'elch'], ['fuchs', 'gams'], ['igel', 'luchs']];
  const dnsEintraege = [];
  ecken.forEach(([x, y], i) => {
    const g = i + 1;
    const s = n.neuesGeraet('switch', { x, y, name: `Switch Gruppe ${g}` });
    const r = n.neuesGeraet('router', { x: x + (x < 1000 ? 290 : -290), y: y + (y < 600 ? 150 : -150), name: `Router ${g}` });
    n.verbinde(s.id, r.id); // Anschluss 1 des Routers: Gruppen-Netz
    n.verbinde(backbone.id, r.id); // Anschluss 2: Backbone
    r.nics[0].ip = `1.1.${g}.1`;
    r.nics[1].ip = `3.3.3.${g}`;
    r.routen = [1, 2, 3, 4].filter((h) => h !== g).map((h) => ({ ziel: `1.1.${h}.0`, maske: '255.255.255.0', gateway: `3.3.3.${h}` }));
    dnsEintraege.push({ name: `router${g}`, ip: `1.1.${g}.1` });
    const links = x < 1000;
    tiere[i].forEach((tier, k) => {
      const ip = `1.1.${g}.${3 + k}`;
      host(n, k ? 'notebook' : 'rechner', tier, x + (links ? -260 : 260), y + (k ? 120 : -120), ip, { gateway: `1.1.${g}.1`, dns: '1.1.1.2', an: s });
      dnsEintraege.push({ name: tier, ip });
    });
    if (g === 1) {
      const dns = host(n, 'rechner', 'DNS-Server', x, y - 230, '1.1.1.2', { gateway: '1.1.1.1', dns: '1.1.1.2', software: ['befehlszeile', 'dnsserver'], an: s });
      dnsEintraege.push({ name: 'dns', ip: '1.1.1.2' });
      dns.daten.dnsserver = { laeuft: true, eintraege: dnsEintraege };
    }
  });
  return n;
}

/** Fehlersuche im LAN: ein Rechner im falschen Netz, eine doppelte IP-Adresse, ein Gerät ohne Kabel */
function fehlersucheLan() {
  const n = new Netz();
  const s = n.neuesGeraet('switch', { x: 600, y: 380, name: 'Switch' });
  host(n, 'rechner', 'Rechner A', 300, 160, '192.168.0.11', { an: s });
  host(n, 'rechner', 'Rechner B', 600, 120, '192.168.0.12', { an: s });
  host(n, 'rechner', 'Rechner C', 900, 160, '192.168.1.13', { an: s }); // anderes Subnetz
  host(n, 'notebook', 'Notebook D', 300, 600, '192.168.0.11', { an: s }); // gleiche IP wie A
  host(n, 'notebook', 'Notebook E', 900, 600, '192.168.0.15'); // nicht verkabelt
  return n;
}

/** Drei Netze in einer Reihe: Die Router kennen nur ihre eigenen Netze – die fehlenden Routen trägt man selbst ein. */
function dreiNetzeInReihe() {
  const n = new Netz();
  const s1 = n.neuesGeraet('switch', { x: 260, y: 400, name: 'Switch Netz A' });
  const r1 = n.neuesGeraet('router', { x: 600, y: 400, name: 'Router 1' });
  const r2 = n.neuesGeraet('router', { x: 1100, y: 400, name: 'Router 2' });
  const s2 = n.neuesGeraet('switch', { x: 1440, y: 400, name: 'Switch Netz B' });
  n.verbinde(s1.id, r1.id); n.verbinde(r1.id, r2.id); n.verbinde(s2.id, r2.id);
  r1.nics[0].ip = '192.168.10.1'; r1.nics[1].ip = '10.0.0.1';
  r2.nics[0].ip = '10.0.0.2'; r2.nics[1].ip = '192.168.20.1';
  host(n, 'rechner', 'Rechner A1', 100, 220, '192.168.10.10', { gateway: '192.168.10.1', an: s1 });
  host(n, 'notebook', 'Notebook A2', 100, 580, '192.168.10.11', { gateway: '192.168.10.1', an: s1 });
  host(n, 'rechner', 'Rechner B1', 1600, 220, '192.168.20.10', { gateway: '192.168.20.1', an: s2 });
  host(n, 'notebook', 'Notebook B2', 1600, 580, '192.168.20.11', { gateway: '192.168.20.1', an: s2 });
  return n;
}

/**
 * Ein Heimnetz bzw. Gruppennetz für das Klassen-Internet: LAN 192.168.1.0/24, Router mit Modem zum Provider
 * (Transfernetz 100.64.1.0/24, Provider-Seite 100.64.1.1), DNS beim Provider (10.0.0.53). Andere Gruppen ersetzen die 1 durch ihre Nummer.
 */
function heimnetzMitModem() {
  const n = new Netz();
  const s = n.neuesGeraet('switch', { x: 420, y: 400, name: 'Switch' });
  const r = n.neuesGeraet('router', { x: 800, y: 400, name: 'Router' });
  const m = n.neuesGeraet('modem', { x: 1150, y: 400, name: 'Modem' });
  n.verbinde(s.id, r.id); n.verbinde(m.id, r.id);
  r.nics[0].ip = '192.168.1.1'; r.nics[1].ip = '100.64.1.2';
  r.routen = [{ ziel: '0.0.0.0', maske: '0.0.0.0', gateway: '100.64.1.1' }];
  const opt = { gateway: '192.168.1.1', dns: '10.0.0.53', an: s };
  host(n, 'rechner', 'Rechner', 150, 220, '192.168.1.10', opt);
  host(n, 'notebook', 'Notebook', 150, 580, '192.168.1.11', { ...opt, software: ['befehlszeile', 'webbrowser'] });
  host(n, 'smartphone', 'Handy', 420, 140, '192.168.1.12', { ...opt, software: ['befehlszeile', 'webbrowser'] });
  const web = host(n, 'rechner', 'Webserver', 420, 660, '192.168.1.80', { ...opt, software: ['befehlszeile', 'webserver', 'texteditor'] });
  web.daten.webserver = { laeuft: true };
  schreibeDatei(web, '/webserver/index.html', '<html><body>\n<h1>Gruppe 1</h1>\n<p>Hier entsteht unsere Seite im Klassen-Internet.</p>\n</body></html>\n');
  return n;
}

/** Das Provider-Netz für das Klassen-Internet: Router mit vier Modems (je eine Gruppe), DNS-Server und Portal-Webserver */
function providerNetz() {
  const n = new Netz();
  const s = n.neuesGeraet('switch', { x: 420, y: 600, name: 'Switch Provider' });
  const r = n.neuesGeraet('router', { x: 900, y: 600, name: 'Provider-Router' });
  n.verbinde(s.id, r.id);
  r.nics[0].ip = '10.0.0.1';
  const routen = [];
  [1, 2, 3, 4].forEach((g, i) => {
    const m = n.neuesGeraet('modem', { x: 1400, y: 180 + i * 280, name: `Modem Gruppe ${g}` });
    n.verbinde(m.id, r.id);
    r.nics[g].ip = `100.64.${g}.1`;
    routen.push({ ziel: `192.168.${g}.0`, maske: '255.255.255.0', gateway: `100.64.${g}.2` });
  });
  r.routen = routen;
  const opt = { gateway: '10.0.0.1', dns: '10.0.0.53', an: s };
  const dns = host(n, 'rechner', 'DNS-Server', 200, 380, '10.0.0.53', { ...opt, software: ['befehlszeile', 'dnsserver'] });
  dns.daten.dnsserver = { laeuft: true, eintraege: [
    { name: 'portal.provider.test', ip: '10.0.0.80' },
    ...[1, 2, 3, 4].map((g) => ({ name: `www.gruppe${g}.test`, ip: `192.168.${g}.80` })),
  ] };
  const web = host(n, 'rechner', 'Portal', 200, 820, '10.0.0.80', { ...opt, software: ['befehlszeile', 'webserver', 'texteditor'] });
  web.daten.webserver = { laeuft: true };
  schreibeDatei(web, '/webserver/index.html', '<html><body>\n<h1>Portal des Klassen-Internets</h1>\n<p>Die Seiten der Gruppen:</p>\n<ul>\n<li>www.gruppe1.test</li>\n<li>www.gruppe2.test</li>\n<li>www.gruppe3.test</li>\n<li>www.gruppe4.test</li>\n</ul>\n</body></html>\n');
  host(n, 'notebook', 'Technik', 650, 860, '10.0.0.10', { ...opt, software: ['befehlszeile', 'webbrowser'] });
  return n;
}

export const BEISPIELE = [
  { slug: 'switch', titel: 'Zwei Rechner an einem Switch', baue: zweiRechnerAmSwitch },
  { slug: 'router', titel: 'Zwei Netze mit Router', baue: zweiNetzeMitRouter },
  { slug: 'internet', titel: 'Kleines Internet mit DNS, DHCP und Webserver', baue: kleinesInternet },
  { slug: 'email', titel: 'E-Mail zwischen zwei Domains', baue: emailZweiDomains },
  { slug: 'rollenspiel', titel: 'Rollenspiel-Netz: vier Gruppen, Router und DNS', baue: rollenspielNetz },
  { slug: 'fehlersuche-lan', titel: 'Fehlersuche: ein LAN mit drei Fehlern', baue: fehlersucheLan },
  { slug: 'drei-netze', titel: 'Drei Netze in einer Reihe (Routen fehlen)', baue: dreiNetzeInReihe },
  { slug: 'heimnetz', titel: 'Heimnetz mit Router und Modem (Gruppe 1 im Klassen-Internet)', baue: heimnetzMitModem },
  { slug: 'provider', titel: 'Provider-Netz für das Klassen-Internet (vier Modems, DNS)', baue: providerNetz },
];

export const beispiel = (slug) => BEISPIELE.find((b) => b.slug === slug || b.titel === slug) ?? null;
