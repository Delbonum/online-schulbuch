// Netzwerk-Simulation: Geräte, Kabel und ein vereinfachter TCP/IP-Stapel – ohne DOM, damit sich alles testen lässt.
//
// Die Simulation läuft in Takten (schritt()). Ein Rahmen braucht einen Takt über ein Kabel; Geräte verarbeiten
// ankommende Rahmen sofort und schicken Antworten im nächsten Takt los. Abgebildet sind die vier Schichten des
// TCP/IP-Modells, so wie sie im Unterricht vorkommen:
//   Netzzugang   Ethernet-Rahmen mit MAC-Adressen, ARP, Switch mit Lerntabelle (SAT)
//   Vermittlung  IPv4 mit Netzmaske, Gateway, Weiterleitungstabelle, TTL; ICMP (ping, traceroute)
//   Transport    UDP und ein vereinfachtes TCP (Verbindungsaufbau, Daten, Bestätigung, Abbau)
//   Anwendung    DNS, DHCP, HTTP (Webserver/-browser)
//
// Jeder Rechner hat ein kleines Dateisystem (Ordner und Textdateien, g.daten.dateisystem) für Text-Editor und
// Datei-Explorer; der Webserver liefert die Dateien im Ordner /webserver aus.
//
// Zum Entwurf gehören auch die Notizen des Dokumentationsmodus (Textfelder und farbige Bereiche, this.notizen).
//
// Gespeichert wird nur der Entwurf (Geräte, Einstellungen, installierte Software, Daten der Server); der Zustand
// während der Simulation (ARP-Tabellen, Verbindungen, Protokolle) entsteht bei start() neu.

export const BROADCAST_MAC = 'FF:FF:FF:FF:FF:FF';
export const TYPEN = ['rechner', 'notebook', 'switch', 'router', 'modem'];
export const SOFTWARE = {
  befehlszeile: 'Befehlszeile',
  webbrowser: 'Webbrowser',
  webserver: 'Webserver',
  dnsserver: 'DNS-Server',
  emailprogramm: 'E-Mail-Programm',
  emailserver: 'E-Mail-Server',
  firewall: 'Firewall',
  echoserver: 'Echo-Server',
  client: 'Einfacher Client',
  texteditor: 'Text-Editor',
  dateiexplorer: 'Datei-Explorer',
  peertopeer: 'Peer-to-Peer',
};
export const NOTIZ_ARTEN = ['text', 'bereich'];
export const ECHO_PORT = 55555;
export const P2P_PORT = 6346; // wie Gnutella
export const P2P_ORDNER = '/peer2peer';
const P2P_TTL = 3;
/** Rückgabe von ablauf.naechste(): Verbindung offen halten, ohne etwas zu senden (z. B. einfacher Client) */
export const WARTEN = Symbol('warten');
export const STANDARD_SEITE = '<html>\n<head><title>Willkommen</title></head>\n<body>\n<h1>Es funktioniert!</h1>\n<p>Diese Seite liefert der Webserver aus.</p>\n</body>\n</html>\n';

const ARP_ZEIT = 40; // Takte, bis eine unbeantwortete ARP-Anfrage aufgegeben wird
const MAX_LOG = 3000;

// ------------------------------------------------------------------ IP-Hilfen

export function ipZahl(ip) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(String(ip ?? '').trim());
  if (!m) return null;
  const teile = m.slice(1).map(Number);
  if (teile.some((t) => t > 255)) return null;
  return ((teile[0] << 24) >>> 0) + (teile[1] << 16) + (teile[2] << 8) + teile[3];
}
export const zahlIp = (z) => [z >>> 24, (z >>> 16) & 255, (z >>> 8) & 255, z & 255].join('.');
export const gueltigeIp = (ip) => ipZahl(ip) !== null;
export function gueltigeMaske(m) {
  const z = ipZahl(m);
  if (z === null) return false;
  const inv = ~z >>> 0;
  return (inv & (inv + 1)) === 0; // nur Einsen links, dann Nullen
}
export const netzVon = (ip, maske) => (ipZahl(ip) & ipZahl(maske)) >>> 0;
export function imSelbenNetz(a, b, maske) {
  if (!gueltigeIp(a) || !gueltigeIp(b) || !gueltigeMaske(maske)) return false;
  return netzVon(a, maske) === netzVon(b, maske);
}
const maskenBits = (m) => { let z = ipZahl(m); let n = 0; while (z) { n += z & 1; z >>>= 1; } return n; };
const istBroadcastIp = (ip, nic) => ip === '255.255.255.255'
  || (gueltigeIp(nic?.ip) && gueltigeMaske(nic?.maske) && ipZahl(ip) === ((netzVon(nic.ip, nic.maske) | (~ipZahl(nic.maske) >>> 0)) >>> 0));

let macZaehler = 0;
function neueMac() {
  const b = [0x02, ...Array.from({ length: 5 }, () => Math.floor(Math.random() * 256))];
  b[5] = (b[5] + macZaehler++) & 255;
  return b.map((x) => x.toString(16).padStart(2, '0').toUpperCase()).join(':');
}

const kopie = (o) => JSON.parse(JSON.stringify(o));

// ------------------------------------------------------------------ Dateisystem eines Rechners
//
// g.daten.dateisystem = { ordner: ['/dokumente', '/webserver', …], dateien: { '/dokumente/notiz.txt': 'Text', … } }
// Pfade beginnen mit „/“, Ordner werden mit „/“ getrennt. Es gibt nur Textdateien.

export const MAX_DATEI = 200000; // Zeichen je Datei (der Entwurf liegt im Speicher des Browsers)

/** Legt das Dateisystem an (falls nötig) und übernimmt Webseiten aus älteren Entwürfen nach /webserver. */
export function dateisystem(g) {
  const fs = (g.daten.dateisystem ??= { ordner: ['/dokumente', '/webserver'], dateien: {} });
  fs.ordner ??= [];
  fs.dateien ??= {};
  const alt = g.daten.webserver?.dateien;
  if (alt && typeof alt === 'object') {
    if (!fs.ordner.includes('/webserver')) fs.ordner.push('/webserver');
    for (const [name, text] of Object.entries(alt)) {
      const pfad = normalerPfad(`/webserver/${name}`);
      if (pfad && fs.dateien[pfad] === undefined) { elternAnlegen(fs, pfad); fs.dateien[pfad] = String(text); }
    }
    delete g.daten.webserver.dateien;
  }
  return fs;
}

/** „/a/./b/../c“ → „/a/c“; null, wenn der Pfad über die Wurzel hinausführt */
export function normalerPfad(pfad, basis = '/') {
  const roh = String(pfad ?? '').trim().replace(/\\/g, '/');
  const teile = [];
  for (const t of (roh.startsWith('/') ? roh : `${basis}/${roh}`).split('/')) {
    if (t === '' || t === '.') continue;
    if (t === '..') { if (!teile.length) return null; teile.pop(); } else teile.push(t);
  }
  return `/${teile.join('/')}`;
}

const elternVon = (pfad) => pfad.slice(0, pfad.lastIndexOf('/')) || '/';
const nameVon = (pfad) => pfad.slice(pfad.lastIndexOf('/') + 1);
const istOrdner = (fs, pfad) => pfad === '/' || fs.ordner.includes(pfad);
function elternAnlegen(fs, pfad) {
  for (let e = elternVon(pfad); e !== '/'; e = elternVon(e)) if (!fs.ordner.includes(e)) fs.ordner.push(e);
}

export function pruefeName(name) {
  const n = String(name ?? '').trim();
  if (!n) throw new Error('Bitte gib einen Namen ein.');
  if (n.length > 60) throw new Error('Der Name ist zu lang (höchstens 60 Zeichen).');
  if (/[\\/:*?"<>|]/.test(n) || n === '.' || n === '..') throw new Error('Im Namen sind diese Zeichen nicht erlaubt: / \\ : * ? " < > |');
  return n;
}

/** Inhalt eines Ordners: erst Ordner, dann Dateien, jeweils alphabetisch */
export function ordnerInhalt(g, ordner) {
  const fs = dateisystem(g);
  const o = normalerPfad(ordner);
  if (!o || !istOrdner(fs, o)) throw new Error(`Den Ordner ${ordner} gibt es nicht.`);
  const direkt = (p) => p !== o && elternVon(p) === o;
  const sortiert = (a, b) => a.localeCompare(b, 'de');
  return [
    ...fs.ordner.filter(direkt).sort(sortiert).map((p) => ({ name: nameVon(p), pfad: p, ordner: true })),
    ...Object.keys(fs.dateien).filter(direkt).sort(sortiert).map((p) => ({ name: nameVon(p), pfad: p, ordner: false, groesse: fs.dateien[p].length })),
  ];
}

export function alleDateien(g) {
  return Object.keys(dateisystem(g).dateien).sort((a, b) => a.localeCompare(b, 'de'));
}

export function existiert(g, pfad) {
  const fs = dateisystem(g);
  const p = normalerPfad(pfad);
  return p ? (istOrdner(fs, p) ? 'ordner' : fs.dateien[p] !== undefined ? 'datei' : null) : null;
}

export function leseDatei(g, pfad) {
  const fs = dateisystem(g);
  const p = normalerPfad(pfad);
  if (!p || fs.dateien[p] === undefined) throw new Error(`Die Datei ${pfad} gibt es nicht.`);
  return fs.dateien[p];
}

/** Schreibt eine Textdatei (legt sie an oder überschreibt sie); der Ordner muss existieren. */
export function schreibeDatei(g, pfad, text) {
  const fs = dateisystem(g);
  const p = normalerPfad(pfad);
  if (!p || p === '/') throw new Error('Ungültiger Dateiname.');
  pruefeName(nameVon(p));
  if (istOrdner(fs, p)) throw new Error(`${p} ist ein Ordner.`);
  if (!istOrdner(fs, elternVon(p))) throw new Error(`Den Ordner ${elternVon(p)} gibt es nicht.`);
  const t = String(text ?? '');
  if (t.length > MAX_DATEI) throw new Error(`Die Datei ist zu groß (höchstens ${MAX_DATEI / 1000} 000 Zeichen).`);
  fs.dateien[p] = t;
  return p;
}

export function neuerOrdner(g, pfad) {
  const fs = dateisystem(g);
  const p = normalerPfad(pfad);
  if (!p || p === '/') throw new Error('Ungültiger Ordnername.');
  pruefeName(nameVon(p));
  if (existiert(g, p)) throw new Error(`${nameVon(p)} gibt es hier schon.`);
  if (!istOrdner(fs, elternVon(p))) throw new Error(`Den Ordner ${elternVon(p)} gibt es nicht.`);
  fs.ordner.push(p);
  return p;
}

/** Löscht eine Datei oder einen Ordner samt Inhalt */
export function loesche(g, pfad) {
  const fs = dateisystem(g);
  const p = normalerPfad(pfad);
  if (!p || p === '/') throw new Error('Die Wurzel lässt sich nicht löschen.');
  if (!existiert(g, p)) throw new Error(`${pfad} gibt es nicht.`);
  const darin = (x) => x === p || x.startsWith(`${p}/`);
  fs.ordner = fs.ordner.filter((o) => !darin(o));
  for (const d of Object.keys(fs.dateien)) if (darin(d)) delete fs.dateien[d];
}

/** Benennt eine Datei oder einen Ordner um (bleibt im selben Ordner); gibt den neuen Pfad zurück */
export function benenneUm(g, pfad, neuerName) {
  const fs = dateisystem(g);
  const p = normalerPfad(pfad);
  if (!p || p === '/' || !existiert(g, p)) throw new Error(`${pfad} gibt es nicht.`);
  const neu = normalerPfad(`${elternVon(p)}/${pruefeName(neuerName)}`);
  if (neu === p) return p;
  if (existiert(g, neu)) throw new Error(`${nameVon(neu)} gibt es hier schon.`);
  const umsetzen = (x) => (x === p ? neu : x.startsWith(`${p}/`) ? neu + x.slice(p.length) : x);
  fs.ordner = fs.ordner.map(umsetzen);
  fs.dateien = Object.fromEntries(Object.entries(fs.dateien).map(([k, v]) => [umsetzen(k), v]));
  return neu;
}

// ------------------------------------------------------------------ Netz

export class Netz {
  constructor() {
    this.geraete = new Map();
    this.kabel = [];
    this.notizen = [];
    this.zaehler = 1;
    this.laeuft = false;
    this.zeit = 0;
  }

  // ---------------------------------------------------------------- Entwurf

  neuesGeraet(typ, { x = 100, y = 100, name } = {}) {
    if (!TYPEN.includes(typ)) throw new Error(`Unbekannter Gerätetyp: ${typ}`);
    const id = `g${this.zaehler++}`;
    const nummer = [...this.geraete.values()].filter((g) => g.typ === typ).length + 1;
    const grund = { rechner: 'Rechner', notebook: 'Notebook', switch: 'Switch', router: 'Router', modem: 'Modem' }[typ];
    const g = {
      id, typ, name: name ?? `${grund} ${nummer}`, x, y,
      nics: [],
      gateway: '', dns: '', dhcp: false,
      dhcpServer: { aktiv: false, von: '', bis: '', gateway: '', dns: '' },
      routen: [],
      software: [],
      daten: {},
    };
    if (typ === 'router') { g.nics.push(this.neueNic(), this.neueNic()); g.routenAuto = true; }
    if (typ === 'modem') g.nics.push(this.neueNic());
    if (typ === 'rechner' || typ === 'notebook') {
      g.nics.push({ ...this.neueNic(), ip: `192.168.0.${10 + this.geraete.size}`, maske: '255.255.255.0' });
      g.software = ['befehlszeile'];
      dateisystem(g);
    }
    this.geraete.set(id, g);
    return g;
  }

  neueNic() { return { mac: neueMac(), ip: '', maske: '255.255.255.0' }; }

  /** Verbindet zwei Geräte mit einem Kabel; wählt freie Anschlüsse (Router/Switch bekommen bei Bedarf neue). */
  verbinde(idA, idB) {
    if (idA === idB) throw new Error('Ein Gerät lässt sich nicht mit sich selbst verbinden.');
    const a = this.geraete.get(idA);
    const b = this.geraete.get(idB);
    if (!a || !b) throw new Error('Gerät nicht gefunden.');
    if (this.kabel.some((k) => (k.a.g === idA && k.b.g === idB) || (k.a.g === idB && k.b.g === idA))) {
      throw new Error('Diese beiden Geräte sind schon verbunden.');
    }
    const nicA = this.freieNic(a);
    const nicB = this.freieNic(b);
    const k = { id: `k${this.zaehler++}`, a: { g: idA, nic: nicA }, b: { g: idB, nic: nicB } };
    this.kabel.push(k);
    return k;
  }

  freieNic(g) {
    const belegt = new Set(this.kabel.flatMap((k) => [k.a, k.b]).filter((e) => e.g === g.id).map((e) => e.nic));
    for (let i = 0; i < g.nics.length; i++) if (!belegt.has(i)) return i;
    if (g.typ === 'switch' || g.typ === 'router') {
      if (g.typ === 'router' && g.nics.length >= 8) throw new Error(`${g.name} hat schon 8 Anschlüsse.`);
      g.nics.push(this.neueNic());
      return g.nics.length - 1;
    }
    throw new Error(`${g.name} hat nur einen Netzwerkanschluss, und der ist schon belegt.`);
  }

  kabelAn(gid, nic) {
    return this.kabel.find((k) => (k.a.g === gid && k.a.nic === nic) || (k.b.g === gid && k.b.nic === nic));
  }

  /** Gerät am anderen Ende eines Anschlusses (für die Anzeige) */
  gegenueber(gid, nic) {
    const k = this.kabelAn(gid, nic);
    if (!k) return null;
    const e = k.a.g === gid && k.a.nic === nic ? k.b : k.a;
    return this.geraete.get(e.g);
  }

  entferneGeraet(id) {
    this.geraete.delete(id);
    this.kabel = this.kabel.filter((k) => k.a.g !== id && k.b.g !== id);
  }

  entferneKabel(id) { this.kabel = this.kabel.filter((k) => k.id !== id); }

  /** Dokumentation: Textfeld (art 'text') oder farbiger Bereich mit Überschrift (art 'bereich') */
  neueNotiz(art, { x = 100, y = 100 } = {}) {
    if (!NOTIZ_ARTEN.includes(art)) throw new Error(`Unbekannte Notiz: ${art}`);
    const n = art === 'text'
      ? { id: `n${this.zaehler++}`, art, x, y, text: 'Text', groesse: 18, farbe: 'dunkel' }
      : { id: `n${this.zaehler++}`, art, x, y, b: 320, h: 220, text: 'Bereich', farbe: 'blau' };
    this.notizen.push(n);
    return n;
  }

  entferneNotiz(id) { this.notizen = this.notizen.filter((n) => n.id !== id); }

  toJSON() {
    return { format: 'online-schulbuch-netzwerk', version: 1, zaehler: this.zaehler, geraete: [...this.geraete.values()], kabel: this.kabel, notizen: this.notizen };
  }

  static ausJSON(daten) {
    if (daten?.format !== 'online-schulbuch-netzwerk') throw new Error('Das ist keine Netzwerk-Datei des Online-Schulbuchs.');
    const n = new Netz();
    n.zaehler = daten.zaehler ?? 1;
    for (const g of daten.geraete ?? []) {
      if (!TYPEN.includes(g.typ)) continue;
      n.geraete.set(g.id, {
        dhcpServer: { aktiv: false, von: '', bis: '', gateway: '', dns: '' }, routen: [], software: [], daten: {}, gateway: '', dns: '', dhcp: false,
        ...kopie(g),
      });
      if (g.typ === 'rechner' || g.typ === 'notebook') dateisystem(n.geraete.get(g.id));
    }
    n.kabel = (daten.kabel ?? []).filter((k) => n.geraete.has(k.a?.g) && n.geraete.has(k.b?.g));
    const zahl = (w, std, min, max) => (Number.isFinite(Number(w)) ? Math.max(min, Math.min(max, Math.round(Number(w)))) : std);
    n.notizen = (Array.isArray(daten.notizen) ? daten.notizen : []).filter((x) => NOTIZ_ARTEN.includes(x?.art) && typeof x.id === 'string').map((x) => ({
      id: x.id, art: x.art, x: zahl(x.x, 100, 0, 1990), y: zahl(x.y, 100, 0, 1190), text: String(x.text ?? '').slice(0, 2000),
      farbe: typeof x.farbe === 'string' ? x.farbe : '',
      ...(x.art === 'text' ? { groesse: zahl(x.groesse, 18, 10, 60) } : { b: zahl(x.b, 320, 40, 2000), h: zahl(x.h, 220, 30, 1200) }),
    }));
    return n;
  }

  /** Weiterleitungstabelle eines Geräts: automatische Einträge (eigene Netze, Gateway) und eigene Einträge */
  routingTabelle(g) {
    const tabelle = [];
    const auto = g.typ !== 'router' || g.routenAuto !== false;
    g.nics.forEach((nic, i) => {
      if (gueltigeIp(nic.ip) && gueltigeMaske(nic.maske)) {
        if (auto) tabelle.push({ ziel: zahlIp(netzVon(nic.ip, nic.maske)), maske: nic.maske, gateway: '', nic: i, auto: true });
      }
    });
    for (const r of g.routen ?? []) {
      if (!gueltigeIp(r.ziel) || !gueltigeMaske(r.maske)) continue;
      const nic = this.nicFuerGateway(g, r.gateway, r.nic);
      if (nic !== null) tabelle.push({ ziel: r.ziel, maske: r.maske, gateway: r.gateway ?? '', nic, auto: false });
    }
    if (g.typ !== 'router' && gueltigeIp(g.gateway)) {
      const nic = this.nicFuerGateway(g, g.gateway);
      if (nic !== null) tabelle.push({ ziel: '0.0.0.0', maske: '0.0.0.0', gateway: g.gateway, nic, auto: true });
    }
    return tabelle;
  }

  nicFuerGateway(g, gateway, vorgabe = null) {
    if (Number.isInteger(vorgabe) && g.nics[vorgabe]) return vorgabe;
    if (!gueltigeIp(gateway)) return g.nics.length ? 0 : null;
    const i = g.nics.findIndex((n) => imSelbenNetz(n.ip, gateway, n.maske));
    return i >= 0 ? i : null;
  }

  // ---------------------------------------------------------------- Simulation: Ablauf

  start() {
    this.laeuft = true;
    this.zeit = 0;
    this.unterwegs = [];
    this.timer = [];
    this.zustand = new Map();
    this.aktiveKabel = new Set();
    this.portZaehler = 49152;
    for (const g of this.geraete.values()) {
      this.zustand.set(g.id, { arp: new Map(), wartet: new Map(), sat: new Map(), log: [], logNr: 0, udp: new Map(), tcp: new Map(), icmp: new Set(), dhcpVergeben: new Map() });
      if (g.typ === 'rechner' || g.typ === 'notebook') {
        if (g.dhcp) { g.nics[0].ip = ''; g.gateway = ''; g.dns = ''; }
        this.dienste(g);
      }
    }
    for (const g of this.geraete.values()) if (g.dhcp && (g.typ === 'rechner' || g.typ === 'notebook')) this.dhcpAnfragen(g);
  }

  stop() { this.laeuft = false; this.unterwegs = []; this.timer = []; }

  /** Ein Takt: Rahmen kommen an, fällige Zeitgeber laufen ab. Gibt die Kabel zurück, über die gerade etwas lief. */
  schritt() {
    if (!this.laeuft) return new Set();
    this.zeit++;
    this.aktiveKabel = new Set();
    const faellig = this.unterwegs.filter((f) => f.ankunft <= this.zeit);
    this.unterwegs = this.unterwegs.filter((f) => f.ankunft > this.zeit);
    for (const f of faellig) {
      this.aktiveKabel.add(f.kabel.id);
      const ziel = f.kabel.a.g === f.von.g && f.kabel.a.nic === f.von.nic ? f.kabel.b : f.kabel.a;
      const g = this.geraete.get(ziel.g);
      if (!g) continue;
      if (!f.fremd) { this.empfange(g, ziel.nic, f.rahmen); continue; }
      // Rahmen aus einer anderen Simulation (Modem): ein kaputter Rahmen darf diese hier nicht anhalten
      try { this.empfange(g, ziel.nic, f.rahmen); } catch { /* verwerfen */ }
    }
    const timer = this.timer.filter((t) => t.zeit <= this.zeit);
    this.timer = this.timer.filter((t) => t.zeit > this.zeit);
    for (const t of timer) t.aktion();
    return this.aktiveKabel;
  }

  /** Für Tests: Takte laufen lassen, bis die Bedingung erfüllt ist (oder höchstens max Takte) */
  laufe(bedingung = () => false, max = 500) {
    for (let i = 0; i < max; i++) {
      this.schritt();
      if (bedingung()) return true;
    }
    return bedingung();
  }

  nachTakten(n, aktion) { this.timer.push({ zeit: this.zeit + n, aktion }); }

  ruhig() { return this.unterwegs.length === 0; }

  // ---------------------------------------------------------------- Netzzugang

  sendeRahmen(g, nic, rahmen) {
    this.protokolliere(g, rahmen, 'aus');
    const k = this.kabelAn(g.id, nic);
    if (!k) return;
    this.unterwegs.push({ kabel: k, von: { g: g.id, nic }, rahmen, ankunft: this.zeit + 1 });
  }

  empfange(g, nic, rahmen) {
    if (g.typ === 'switch') { this.switchEmpfang(g, nic, rahmen); return; }
    if (g.typ === 'modem') { this.modemAusgang?.(g, kopie(rahmen)); return; }
    const eigene = g.nics[nic];
    if (rahmen.zielMac !== eigene.mac && rahmen.zielMac !== BROADCAST_MAC) return;
    this.protokolliere(g, rahmen, 'ein');
    if (rahmen.typ === 'ARP') this.arpEmpfang(g, nic, rahmen.daten);
    else if (rahmen.typ === 'IP') this.ipEmpfang(g, nic, rahmen.daten);
  }

  switchEmpfang(g, port, rahmen) {
    const z = this.zustand.get(g.id);
    z.sat.set(rahmen.quellMac, port);
    const ziel = rahmen.zielMac === BROADCAST_MAC ? undefined : z.sat.get(rahmen.zielMac);
    const ports = ziel !== undefined ? [ziel] : g.nics.map((_, i) => i);
    for (const p of ports) if (p !== port) this.sendeRahmenSwitch(g, p, rahmen);
  }

  sendeRahmenSwitch(g, port, rahmen) {
    const k = this.kabelAn(g.id, port);
    if (k) this.unterwegs.push({ kabel: k, von: { g: g.id, nic: port }, rahmen, ankunft: this.zeit + 1 });
  }

  /**
   * Modem: reicht Rahmen unverändert weiter wie ein Kabel zur anderen Simulation. Was am Kabel ankommt, geht an
   * modemAusgang(g, rahmen) (setzt die Oberfläche bzw. ein Test); Rahmen von der Gegenseite kommen hier herein.
   */
  modemEingang(gid, rahmen) {
    const g = this.geraete.get(gid);
    const mac = (m) => typeof m === 'string' && m.length <= 17;
    if (!this.laeuft || g?.typ !== 'modem' || !rahmen || typeof rahmen !== 'object') return;
    if (!['ARP', 'IP'].includes(rahmen.typ) || !mac(rahmen.quellMac) || !mac(rahmen.zielMac) || !rahmen.daten || typeof rahmen.daten !== 'object') return;
    const k = this.kabelAn(g.id, 0);
    if (k) this.unterwegs.push({ kabel: k, von: { g: g.id, nic: 0 }, rahmen, ankunft: this.zeit + 1, fremd: true });
  }

  arpEmpfang(g, nic, arp) {
    const z = this.zustand.get(g.id);
    const eigene = g.nics[nic];
    if (gueltigeIp(arp.quellIp) && arp.quellIp !== '0.0.0.0') z.arp.set(arp.quellIp, { mac: arp.quellMac, nic });
    if (arp.op === 'anfrage' && arp.zielIp === eigene.ip && gueltigeIp(eigene.ip)) {
      this.sendeRahmen(g, nic, {
        typ: 'ARP', quellMac: eigene.mac, zielMac: arp.quellMac,
        daten: { op: 'antwort', quellIp: eigene.ip, quellMac: eigene.mac, zielIp: arp.quellIp, zielMac: arp.quellMac },
      });
    }
    // wartende Pakete losschicken
    const liste = z.wartet.get(arp.quellIp);
    if (liste && z.arp.has(arp.quellIp)) {
      z.wartet.delete(arp.quellIp);
      for (const w of liste) this.sendeRahmen(g, w.nic, { typ: 'IP', quellMac: g.nics[w.nic].mac, zielMac: arp.quellMac, daten: w.paket });
    }
  }

  // ---------------------------------------------------------------- Vermittlung

  /** Sucht die passende Route (längste Übereinstimmung). */
  route(g, zielIp) {
    let beste = null;
    for (const r of this.routingTabelle(g)) {
      if (netzVon(zielIp, r.maske) === ipZahl(r.ziel) >>> 0 && (!beste || maskenBits(r.maske) > maskenBits(beste.maske))) beste = r;
    }
    return beste;
  }

  /**
   * Schickt ein IP-Paket ab. Gibt einen Fehlertext zurück, wenn es gar nicht erst losgeht.
   * paket: {quelle?, ziel, ttl?, protokoll: 'ICMP'|'UDP'|'TCP', daten}
   */
  sendeIp(g, paket, nicVorgabe = null) {
    const p = { ttl: 64, ...paket };
    if (p.ziel === '255.255.255.255') {
      const nic = nicVorgabe ?? 0;
      p.quelle ??= g.nics[nic].ip || '0.0.0.0';
      this.sendeRahmen(g, nic, { typ: 'IP', quellMac: g.nics[nic].mac, zielMac: BROADCAST_MAC, daten: p });
      return null;
    }
    const r = this.route(g, p.ziel);
    if (!r) return 'Ziel nicht erreichbar (keine passende Route, Gateway prüfen)';
    p.quelle ??= g.nics[r.nic].ip;
    const naechster = r.gateway && r.gateway !== '0.0.0.0' ? r.gateway : p.ziel;
    if (istBroadcastIp(p.ziel, g.nics[r.nic])) {
      this.sendeRahmen(g, r.nic, { typ: 'IP', quellMac: g.nics[r.nic].mac, zielMac: BROADCAST_MAC, daten: p });
      return null;
    }
    const z = this.zustand.get(g.id);
    const bekannt = z.arp.get(naechster);
    if (bekannt) {
      this.sendeRahmen(g, r.nic, { typ: 'IP', quellMac: g.nics[r.nic].mac, zielMac: bekannt.mac, daten: p });
      return null;
    }
    // Adresse erst per ARP erfragen; das Paket wartet so lange
    const warteliste = z.wartet.get(naechster);
    if (warteliste) { warteliste.push({ nic: r.nic, paket: p }); return null; }
    z.wartet.set(naechster, [{ nic: r.nic, paket: p }]);
    const nic = g.nics[r.nic];
    this.sendeRahmen(g, r.nic, {
      typ: 'ARP', quellMac: nic.mac, zielMac: BROADCAST_MAC,
      daten: { op: 'anfrage', quellIp: nic.ip, quellMac: nic.mac, zielIp: naechster, zielMac: '00:00:00:00:00:00' },
    });
    this.nachTakten(ARP_ZEIT, () => { if (z.wartet.get(naechster)) z.wartet.delete(naechster); });
    return null;
  }

  ipEmpfang(g, nic, p) {
    const fuerMich = g.nics.some((n) => n.ip === p.ziel) || istBroadcastIp(p.ziel, g.nics[nic]);
    if (!fuerMich && g.typ !== 'router') return; // Rechner leiten nicht weiter
    const fw = this.firewallPruefen(g, p);
    if (!fw.erlaubt) { this.firewallVerwirft(g, p, fw.grund); return; }
    if (fuerMich) { this.zustellen(g, nic, p); return; }
    if (p.ttl <= 1) {
      this.sendeIp(g, { ziel: p.quelle, quelle: g.nics[nic].ip, protokoll: 'ICMP', daten: { typ: 'zeit', bemerkung: 'TTL abgelaufen', id: p.daten?.id, seq: p.daten?.seq } });
      return;
    }
    const fehler = this.sendeIp(g, { ...p, ttl: p.ttl - 1 });
    if (fehler && (p.protokoll !== 'ICMP' || p.daten?.typ === 'anfrage')) {
      this.sendeIp(g, { ziel: p.quelle, quelle: g.nics[nic].ip, protokoll: 'ICMP', daten: { typ: 'unerreichbar', bemerkung: 'Ziel nicht erreichbar', id: p.daten?.id, seq: p.daten?.seq } });
    }
  }

  // ---------------------------------------------------------------- Firewall
  //
  // Auf Rechnern (Software „Firewall“) prüft sie ankommende Pakete, auf Routern alle Pakete, die sie weiterleiten
  // oder selbst empfangen. Regeln werden von oben nach unten geprüft, die erste passende entscheidet; passt keine,
  // gilt die Standardregel. Antworten auf selbst aufgebaute Verbindungen lassen sich pauschal zulassen
  // (TCP ohne reines SYN, UDP an Antwort-Ports, ICMP außer Echo-Anfragen) – sonst käme z. B. keine Webseite zurück.

  firewallAktiv(g) {
    return Boolean(g.firewall?.aktiv) && (g.typ === 'router' || g.software.includes('firewall'));
  }

  firewallPruefen(g, p) {
    if (!this.firewallAktiv(g)) return { erlaubt: true };
    const fw = g.firewall;
    if (fw.antworten !== false && istAntwort(p)) return { erlaubt: true };
    const regeln = fw.regeln ?? [];
    for (let i = 0; i < regeln.length; i++) {
      if (regelPasst(regeln[i], p)) return { erlaubt: regeln[i].aktion === 'zulassen', grund: `Regel ${i + 1}` };
    }
    return { erlaubt: fw.standard === 'zulassen', grund: 'Standardregel' };
  }

  firewallVerwirft(g, p, grund) {
    const z = this.zustand.get(g.id);
    z.fwVerworfen = (z.fwVerworfen ?? 0) + 1;
    const was = paketKurz(p);
    z.fwEreignisse ??= [];
    z.fwEreignisse.push({ zeit: this.zeit, text: `${was} von ${p.quelle} an ${p.ziel} verworfen (${grund})` });
    if (z.fwEreignisse.length > 100) z.fwEreignisse.shift();
    z.logNr++;
    z.log.push({ nr: z.logNr, zeit: this.zeit, richtung: 'ein', schicht: 'Vermittlung', protokoll: 'Firewall', quelle: p.quelle, ziel: p.ziel, bemerkung: `verworfen (${grund}): ${was}` });
  }

  zustellen(g, nic, p) {
    const z = this.zustand.get(g.id);
    if (p.protokoll === 'ICMP') {
      const d = p.daten;
      if (d.typ === 'anfrage') {
        this.sendeIp(g, { ziel: p.quelle, quelle: p.ziel === '255.255.255.255' ? g.nics[nic].ip : p.ziel, protokoll: 'ICMP', daten: { typ: 'antwort', id: d.id, seq: d.seq } });
      } else {
        for (const h of z.icmp) h(p);
      }
    } else if (p.protokoll === 'UDP') {
      z.udp.get(p.daten.zielPort)?.(p, nic);
    } else if (p.protokoll === 'TCP') {
      this.tcpEmpfang(g, p);
    }
  }

  // ---------------------------------------------------------------- Transport: UDP

  sendeUdp(g, ziel, zielPort, quellPort, nutzdaten, nicVorgabe = null, quelle = undefined) {
    return this.sendeIp(g, { ziel, quelle, protokoll: 'UDP', daten: { quellPort, zielPort, nutzdaten } }, nicVorgabe);
  }

  freierPort() { return this.portZaehler++; }

  // ---------------------------------------------------------------- Transport: TCP (vereinfacht)
  //
  // Verbindungsaufbau SYN – SYN,ACK – ACK, dann ein Dialog aus Datensegmenten (PSH,ACK), die jeweils mit ACK
  // bestätigt werden, zum Schluss FIN,ACK – FIN,ACK – ACK. Ein Dienst auf dem Server bekommt je Verbindung eine
  // eigene Sitzung; manche Dienste (SMTP, POP3) begrüßen zuerst.

  /** Eine Anfrage, eine Antwort (HTTP) */
  tcpAnfrage(g, ziel, zielPort, text, fertig) {
    let gesendet = false;
    this.tcpDialog(g, ziel, zielPort, { naechste: () => (gesendet ? null : (gesendet = true, text)) }, (e) => {
      fertig(e.fehler ? e : { antwort: e.antworten[0] ?? '' });
    });
  }

  /**
   * Dialog über eine TCP-Verbindung.
   * ablauf.begruessung: true, wenn der Server zuerst etwas sendet (SMTP, POP3)
   * ablauf.naechste(antwort): nächster Befehl (Text) oder null zum Abbauen der Verbindung
   * fertig({antworten} | {fehler})
   */
  tcpDialog(g, ziel, zielPort, ablauf, fertig) {
    const z = this.zustand.get(g.id);
    const quellPort = this.freierPort();
    const schluessel = `${ziel}:${zielPort}:${quellPort}`;
    const v = { ziel, zielPort, quellPort, zustand: 'syn-gesendet', seq: 1000, ack: 0, ablauf, fertig, client: true, antworten: [] };
    z.tcp.set(schluessel, v);
    const fehler = this.tcpSende(g, v, ['SYN']);
    if (fehler) { z.tcp.delete(schluessel); fertig({ fehler }); return null; }
    const pruefe = () => {
      if (v.zustand === 'fertig') return;
      if (v.zustand === 'bereit' || this.zeit - v.letzteAktivitaet < 120) { this.nachTakten(120, pruefe); return; }
      z.tcp.delete(schluessel);
      v.zustand = 'fertig';
      fertig({ fehler: 'Zeitüberschreitung – keine Antwort vom Server' });
    };
    v.letzteAktivitaet = this.zeit;
    this.nachTakten(120, pruefe);
    return v;
  }

  /**
   * Offene Verbindung für Programme, bei denen der Mensch entscheidet, wann etwas gesendet wird (einfacher Client).
   * ereignisse.verbunden(verbindung), ereignisse.daten(text), ereignisse.ende({fehler?}).
   * verbindung.senden(text) schickt eine Nachricht (weitere warten, bis die Antwort da ist), verbindung.trennen() baut ab.
   */
  tcpVerbindung(g, ziel, zielPort, ereignisse) {
    const warteschlange = [];
    let trennen = false;
    let v = null;
    const verbindung = {
      senden: (text) => {
        if (!v || v.zustand === 'fertig') return false;
        if (v.zustand === 'bereit') { this.tcpSende(g, v, ['PSH', 'ACK'], text); v.zustand = 'wartet'; } else warteschlange.push(text);
        return true;
      },
      trennen: () => {
        trennen = true;
        if (v?.zustand === 'bereit') { this.tcpSende(g, v, ['FIN', 'ACK']); v.zustand = 'fin-gesendet'; }
      },
      get zustand() { return v?.zustand ?? 'getrennt'; },
    };
    let erstesMal = true;
    v = this.tcpDialog(g, ziel, zielPort, {
      naechste: (antwort) => {
        if (erstesMal) {
          erstesMal = false;
          ereignisse.verbunden?.(verbindung);
        } else if (antwort !== null) {
          ereignisse.daten?.(antwort);
        }
        if (trennen) return null;
        return warteschlange.length ? warteschlange.shift() : WARTEN;
      },
    }, (e) => ereignisse.ende?.(e));
    return verbindung;
  }

  tcpSende(g, v, flags, nutzdaten = '') {
    const segment = { quellPort: v.quellPort, zielPort: v.zielPort, flags, seq: v.seq, ack: v.ack, nutzdaten };
    v.seq += nutzdaten.length + (flags.includes('SYN') || flags.includes('FIN') ? 1 : 0);
    return this.sendeIp(g, { ziel: v.ziel, quelle: v.quelle, protokoll: 'TCP', daten: segment });
  }

  /** Client: nächsten Befehl schicken oder Verbindung abbauen */
  tcpWeiter(g, v, antwort) {
    const befehl = v.ablauf.naechste(antwort);
    if (befehl === WARTEN) { v.zustand = 'bereit'; return; }
    if (befehl === null || befehl === undefined) {
      this.tcpSende(g, v, ['FIN', 'ACK']);
      v.zustand = 'fin-gesendet';
    } else {
      this.tcpSende(g, v, ['PSH', 'ACK'], befehl);
      v.zustand = 'wartet';
    }
  }

  tcpEmpfang(g, p) {
    const z = this.zustand.get(g.id);
    const s = p.daten;
    const schluessel = `${p.quelle}:${s.quellPort}:${s.zielPort}`;
    let v = z.tcp.get(schluessel);
    const zaehlt = s.nutzdaten.length + (s.flags.includes('SYN') || s.flags.includes('FIN') ? 1 : 0);
    if (!v) {
      if (!s.flags.includes('SYN') || s.flags.includes('ACK')) return;
      const dienst = z.tcpDienste?.get(s.zielPort);
      v = { ziel: p.quelle, zielPort: s.quellPort, quellPort: s.zielPort, quelle: p.ziel, seq: 5000, ack: s.seq + 1, client: false };
      if (!dienst) { this.tcpSende(g, v, ['RST', 'ACK']); return; }
      v.dienst = dienst;
      v.sitzung = dienst.sitzung?.(p.quelle) ?? {};
      v.zustand = 'syn-empfangen';
      z.tcp.set(schluessel, v);
      this.tcpSende(g, v, ['SYN', 'ACK']);
      return;
    }
    v.ack = s.seq + zaehlt;
    v.letzteAktivitaet = this.zeit;
    if (s.flags.includes('RST')) {
      z.tcp.delete(schluessel);
      if (v.client && v.zustand !== 'fertig') { v.zustand = 'fertig'; v.fertig({ fehler: 'Verbindung abgelehnt (kein Server auf diesem Port)' }); }
      return;
    }
    if (v.client) {
      if (v.zustand === 'syn-gesendet' && s.flags.includes('SYN')) {
        this.tcpSende(g, v, ['ACK']);
        if (v.ablauf.begruessung) v.zustand = 'wartet';
        else this.tcpWeiter(g, v, null);
      } else if (v.zustand === 'wartet' && s.nutzdaten) {
        v.antworten.push(s.nutzdaten);
        this.tcpSende(g, v, ['ACK']);
        this.tcpWeiter(g, v, s.nutzdaten);
      } else if (v.zustand === 'fin-gesendet' && s.flags.includes('FIN')) {
        this.tcpSende(g, v, ['ACK']);
        z.tcp.delete(schluessel);
        v.zustand = 'fertig';
        v.fertig({ antworten: v.antworten });
      }
      return;
    }
    // Server
    if (v.zustand === 'syn-empfangen' && !s.nutzdaten && !s.flags.includes('FIN')) {
      v.zustand = 'verbunden';
      const gruss = v.dienst.begruessung?.(v.sitzung);
      if (gruss) this.tcpSende(g, v, ['PSH', 'ACK'], gruss);
      return;
    }
    if (s.nutzdaten) {
      v.zustand = 'verbunden';
      this.tcpSende(g, v, ['ACK']);
      this.tcpSende(g, v, ['PSH', 'ACK'], v.dienst.antwort(s.nutzdaten, v.sitzung, p.quelle));
    } else if (s.flags.includes('FIN')) {
      this.tcpSende(g, v, ['FIN', 'ACK']);
      z.tcp.delete(schluessel);
      v.dienst.ende?.(v.sitzung);
    }
  }

  // ---------------------------------------------------------------- Anwendungen und Dienste

  /** Richtet die Dienste eines Rechners ein (Server laufen nur, wenn installiert und gestartet). */
  dienste(g) {
    const z = this.zustand.get(g.id);
    z.tcpDienste = new Map();
    z.udp.delete(53);
    z.udp.delete(67);
    const d = g.daten;
    if (g.software.includes('webserver') && d.webserver?.laeuft) {
      z.tcpDienste.set(80, { antwort: (anfrage) => this.http(g, anfrage) });
    }
    if (g.software.includes('dnsserver') && d.dnsserver?.laeuft) {
      z.udp.set(53, (p) => {
        const anfrage = p.daten.nutzdaten;
        const name = String(anfrage.name ?? '').toLowerCase().replace(/\.$/, '');
        const typ = anfrage.typ === 'MX' ? 'MX' : 'A';
        const eintrag = (d.dnsserver.eintraege ?? []).find((e) => (e.typ ?? 'A') === typ && e.name.toLowerCase().replace(/\.$/, '') === name);
        this.sendeUdp(g, p.quelle, p.daten.quellPort, 53, { dns: 'antwort', typ, name, ip: eintrag?.ip?.trim() || null, id: anfrage.id });
      });
    }
    if (g.software.includes('echoserver') && d.echoserver?.laeuft) {
      const port = Number(d.echoserver.port) || ECHO_PORT;
      z.tcpDienste.set(port, {
        sitzung: (absender) => { this.echoEreignis(g, `Verbindung von ${absender}`); return { absender }; },
        antwort: (text, sitzung) => { this.echoEreignis(g, `${sitzung.absender}: „${text}“ – zurückgeschickt`); return text; },
        ende: (sitzung) => this.echoEreignis(g, `Verbindung von ${sitzung.absender} beendet`),
      });
    }
    if (g.software.includes('emailserver') && d.emailserver?.laeuft) {
      z.tcpDienste.set(25, this.smtpDienst(g));
      z.tcpDienste.set(110, this.pop3Dienst(g));
    }
    if (g.dhcpServer?.aktiv) z.udp.set(67, (p) => this.dhcpServer(g, p));
    if (g.software.includes('peertopeer')) {
      z.p2p ??= { nachbarn: [], gesehen: new Set(), suchen: new Map(), ereignisse: [], nr: 0 };
      z.tcpDienste.set(P2P_PORT, { antwort: (text, sitzung, absender) => this.p2pAntwort(g, text, absender) });
    }
  }

  // ---------------------------------------------------------------- Peer-to-Peer (vereinfachtes Gnutella)
  //
  // Jede Nachricht ist eine eigene TCP-Verbindung zu Port 6346 mit genau einer Anfrage und einer Antwort:
  //   CONNECT                       → OK          beide Seiten werden Nachbarn
  //   LEAVE                         → OK          Nachbarschaft beenden
  //   QUERY id ttl ursprung begriff → OK          Suche; wird an die Nachbarn weitergereicht, solange ttl > 1
  //   HIT id ip\ndatei\ndatei …     → OK          Treffer, direkt an den Rechner, der gesucht hat
  //   GET datei                     → DATEI name\ninhalt | FEHLT name
  // Geteilt werden die Dateien im Ordner /peer2peer; heruntergeladene Dateien landen ebenfalls dort.

  p2p(g) { return this.zustand?.get(g.id)?.p2p ?? null; }

  p2pEreignis(g, text) {
    const p = this.p2p(g);
    if (!p) return;
    p.ereignisse.push({ zeit: this.zeit, text });
    if (p.ereignisse.length > 100) p.ereignisse.shift();
  }

  p2pFreigaben(g) {
    const fs = dateisystem(g);
    if (!fs.ordner.includes(P2P_ORDNER)) fs.ordner.push(P2P_ORDNER);
    return Object.keys(fs.dateien).filter((x) => x.startsWith(`${P2P_ORDNER}/`) && !x.slice(P2P_ORDNER.length + 1).includes('/'))
      .map((x) => x.slice(P2P_ORDNER.length + 1)).sort((a, b) => a.localeCompare(b, 'de'));
  }

  /** Server-Seite: eine Nachricht eines anderen Peers beantworten */
  p2pAntwort(g, text, absender) {
    const p = this.p2p(g);
    const [kopf, ...rest] = String(text).split('\n');
    const [befehl, ...teile] = kopf.trim().split(' ');
    switch (befehl) {
      case 'CONNECT':
        if (!p.nachbarn.includes(absender)) p.nachbarn.push(absender);
        this.p2pEreignis(g, `${absender} ist jetzt Nachbar`);
        return 'OK';
      case 'LEAVE':
        p.nachbarn = p.nachbarn.filter((x) => x !== absender);
        this.p2pEreignis(g, `${absender} hat das Peer-to-Peer-Netz verlassen`);
        return 'OK';
      case 'QUERY': {
        const [id, ttl, ursprung, ...begriff] = teile;
        // erst antworten, im nächsten Takt suchen und weiterreichen
        this.nachTakten(1, () => this.p2pSucheBearbeiten(g, id, Number(ttl), ursprung, begriff.join(' '), absender));
        return 'OK';
      }
      case 'HIT': {
        const [id, ip] = teile;
        const suche = p.suchen.get(id);
        if (suche) {
          for (const name of rest.filter(Boolean)) if (!suche.treffer.some((t) => t.ip === ip && t.name === name)) suche.treffer.push({ ip, name });
          this.p2pEreignis(g, `Treffer von ${ip}: ${rest.filter(Boolean).join(', ')}`);
        }
        return 'OK';
      }
      case 'GET': {
        const name = teile.join(' ');
        const fs = dateisystem(g);
        const inhalt = this.p2pFreigaben(g).includes(name) ? fs.dateien[`${P2P_ORDNER}/${name}`] : undefined;
        this.p2pEreignis(g, inhalt === undefined ? `${absender} wollte „${name}“ – gibt es nicht` : `${absender} lädt „${name}“ herunter`);
        return inhalt === undefined ? `FEHLT ${name}` : `DATEI ${name}\n${inhalt}`;
      }
      default:
        return 'FEHLER unbekannte Nachricht';
    }
  }

  /** Eine Suche, die hier ankommt: eigene Freigaben prüfen, Treffer zum Ursprung, sonst weiterreichen */
  p2pSucheBearbeiten(g, id, ttl, ursprung, begriff, von) {
    const p = this.p2p(g);
    if (!p || !id || p.gesehen.has(id)) return; // schon gesehen: nicht doppelt bearbeiten (sonst kreist die Suche)
    p.gesehen.add(id);
    const treffer = this.p2pFreigaben(g).filter((n) => p2pPasst(n, begriff));
    this.p2pEreignis(g, `Suche „${begriff}“ von ${ursprung} (über ${von}, TTL ${ttl})${treffer.length ? ` – ${treffer.length} Treffer` : ''}`);
    if (treffer.length) this.tcpAnfrage(g, ursprung, P2P_PORT, `HIT ${id} ${g.nics[0].ip}\n${treffer.join('\n')}`, () => {});
    if (ttl > 1) {
      for (const n of p.nachbarn) if (n !== von && n !== ursprung) this.tcpAnfrage(g, n, P2P_PORT, `QUERY ${id} ${ttl - 1} ${ursprung} ${begriff}`, () => {});
    }
  }

  /** Einem Peer-to-Peer-Netz beitreten: Verbindung zu einem bekannten Peer. fertig(fehler | null) */
  p2pBeitreten(g, ip, fertig) {
    const p = this.p2p(g);
    if (!p) { fertig('Peer-to-Peer ist nicht installiert.'); return; }
    if (ip === g.nics[0].ip) { fertig('Das ist die eigene IP-Adresse.'); return; }
    this.tcpAnfrage(g, ip, P2P_PORT, 'CONNECT', (e) => {
      if (e.fehler || e.antwort !== 'OK') { fertig(e.fehler ?? 'Keine gültige Antwort.'); return; }
      if (!p.nachbarn.includes(ip)) p.nachbarn.push(ip);
      this.p2pEreignis(g, `Mit ${ip} verbunden – jetzt Nachbarn`);
      fertig(null);
    });
  }

  p2pVerlassen(g) {
    const p = this.p2p(g);
    if (!p) return;
    for (const n of p.nachbarn) this.tcpAnfrage(g, n, P2P_PORT, 'LEAVE', () => {});
    p.nachbarn = [];
    this.p2pEreignis(g, 'Peer-to-Peer-Netz verlassen');
  }

  /** Startet eine Suche bei allen Nachbarn; die Treffer sammeln sich in p2p(g).suchen.get(id).treffer */
  p2pSuche(g, begriff) {
    const p = this.p2p(g);
    if (!p) return null;
    const id = `${(g.nics[0].ip || g.id).replace(/\./g, '')}x${++p.nr}`;
    p.gesehen.add(id);
    p.suchen.set(id, { begriff, treffer: [], zeit: this.zeit });
    this.p2pEreignis(g, `Suche „${begriff}“ an ${p.nachbarn.length} Nachbarn geschickt`);
    for (const n of p.nachbarn) this.tcpAnfrage(g, n, P2P_PORT, `QUERY ${id} ${P2P_TTL} ${g.nics[0].ip} ${begriff}`, () => {});
    return id;
  }

  /** Datei von einem Peer holen und in /peer2peer speichern. fertig(fehler | null, pfad) */
  p2pHerunterladen(g, ip, name, fertig) {
    this.tcpAnfrage(g, ip, P2P_PORT, `GET ${name}`, (e) => {
      if (e.fehler) { fertig(e.fehler); return; }
      const [kopf, ...inhalt] = String(e.antwort).split('\n');
      if (!kopf.startsWith('DATEI ')) { fertig(`${ip} hat die Datei „${name}“ nicht (mehr).`); return; }
      this.p2pFreigaben(g);
      try {
        const pfad = schreibeDatei(g, `${P2P_ORDNER}/${name}`, inhalt.join('\n'));
        this.p2pEreignis(g, `„${name}“ von ${ip} heruntergeladen`);
        fertig(null, pfad);
      } catch (err) { fertig(err.message); }
    });
  }

  http(g, anfrage) {
    const zeile = String(anfrage).split('\n')[0];
    const m = /^GET\s+(\S+)/.exec(zeile);
    const { dateien } = dateisystem(g);
    let pfad = '';
    try { pfad = m ? decodeURIComponent(m[1].split('?')[0]).replace(/^\/+/, '') : ''; } catch { /* kaputte Adresse */ }
    if (pfad === '' || pfad.endsWith('/')) pfad += 'index.html';
    const datei = normalerPfad(`/webserver/${pfad}`); // nur innerhalb von /webserver
    if (m && datei?.startsWith('/webserver/') && Object.prototype.hasOwnProperty.call(dateien, datei)) return `HTTP/1.1 200 OK\n\n${dateien[datei]}`;
    return `HTTP/1.1 404 Not Found\n\n<html><body><h1>404 – Nicht gefunden</h1><p>Die Datei ${pfad.replace(/</g, '&lt;')} gibt es auf diesem Server nicht.</p></body></html>`;
  }

  /** Anwendung: ping. melde(text) wird für jede Zeile aufgerufen, fertig() am Ende. */
  ping(g, ziel, melde, fertig, anzahl = 4) {
    this.namensaufloesung(g, ziel, (ip, fehler) => {
      if (!ip) { melde(fehler); fertig(); return; }
      const z = this.zustand.get(g.id);
      const id = Math.floor(Math.random() * 60000);
      let seq = 0;
      let erhalten = 0;
      melde(`PING ${ziel}${ip !== ziel ? ` (${ip})` : ''}`);
      const einzelner = () => {
        if (seq >= anzahl) {
          z.icmp.delete(hoerer);
          melde(`--- ${anzahl} Pakete gesendet, ${erhalten} empfangen, ${Math.round((1 - erhalten / anzahl) * 100)} % Verlust ---`);
          fertig();
          return;
        }
        seq++;
        const start = this.zeit;
        const meine = seq;
        let beantwortet = false;
        aktuelle = (p) => {
          if (p.daten.id !== id || p.daten.seq !== meine || beantwortet) return;
          beantwortet = true;
          if (p.daten.typ === 'antwort') { erhalten++; melde(`Antwort von ${p.quelle}: icmp_seq=${meine} ttl=${p.ttl} Zeit=${this.zeit - start} Takte`); } else melde(`Von ${p.quelle}: ${p.daten.bemerkung}`);
          this.nachTakten(4, einzelner);
        };
        const fehler = this.sendeIp(g, { ziel: ip, protokoll: 'ICMP', daten: { typ: 'anfrage', id, seq: meine } });
        if (fehler) { melde(fehler); beantwortet = true; this.nachTakten(1, einzelner); return; }
        this.nachTakten(60, () => { if (!beantwortet) { beantwortet = true; melde(`Zeitüberschreitung bei icmp_seq=${meine}`); einzelner(); } });
      };
      let aktuelle = null;
      const hoerer = (p) => aktuelle?.(p);
      z.icmp.add(hoerer);
      einzelner();
    });
  }

  traceroute(g, ziel, melde, fertig, maxHops = 15) {
    this.namensaufloesung(g, ziel, (ip, fehler) => {
      if (!ip) { melde(fehler); fertig(); return; }
      const z = this.zustand.get(g.id);
      const id = Math.floor(Math.random() * 60000);
      melde(`Route zu ${ziel}${ip !== ziel ? ` (${ip})` : ''}, höchstens ${maxHops} Sprünge:`);
      let ttl = 0;
      let warte = null;
      const hoerer = (p) => warte?.(p);
      z.icmp.add(hoerer);
      const ende = () => { z.icmp.delete(hoerer); fertig(); };
      const naechster = () => {
        ttl++;
        if (ttl > maxHops) { melde('Höchstzahl an Sprüngen erreicht.'); ende(); return; }
        let erledigt = false;
        warte = (p) => {
          if (p.daten.id !== id || p.daten.seq !== ttl || erledigt) return;
          erledigt = true;
          melde(`${String(ttl).padStart(2)}  ${p.quelle}`);
          if (p.daten.typ === 'antwort' || p.daten.typ === 'unerreichbar') { if (p.daten.typ === 'unerreichbar') melde('Ziel nicht erreichbar.'); ende(); } else this.nachTakten(2, naechster);
        };
        const f = this.sendeIp(g, { ziel: ip, ttl, protokoll: 'ICMP', daten: { typ: 'anfrage', id, seq: ttl } });
        if (f) { melde(f); ende(); return; }
        this.nachTakten(60, () => { if (!erledigt) { erledigt = true; melde(`${String(ttl).padStart(2)}  *  (keine Antwort)`); this.nachTakten(1, naechster); } });
      };
      naechster();
    });
  }

  /** Name → IP über den eingetragenen DNS-Server (IP-Adressen bleiben, wie sie sind). typ "MX" liefert den Mailserver einer Domain. */
  namensaufloesung(g, name, fertig, typ = 'A') {
    name = String(name ?? '').trim().replace(/^https?:\/\//, '').split('/')[0];
    if (gueltigeIp(name) && typ === 'A') { fertig(name); return; }
    if (!name) { fertig(null, 'Kein Ziel angegeben.'); return; }
    if (!gueltigeIp(g.dns)) { fertig(null, `${name} kann nicht aufgelöst werden: Kein DNS-Server eingetragen.`); return; }
    const z = this.zustand.get(g.id);
    const port = this.freierPort();
    const id = Math.floor(Math.random() * 60000);
    let erledigt = false;
    z.udp.set(port, (p) => {
      if (erledigt || p.daten.nutzdaten.id !== id) return;
      erledigt = true;
      z.udp.delete(port);
      const ip = p.daten.nutzdaten.ip;
      fertig(ip, ip ? null : typ === 'MX' ? `${name}: Kein Mailserver (MX-Eintrag) bekannt.` : `${name}: Name unbekannt (der DNS-Server kennt ihn nicht).`);
    });
    const f = this.sendeUdp(g, g.dns, 53, port, { dns: 'anfrage', typ, name, id });
    if (f) { erledigt = true; z.udp.delete(port); fertig(null, f); return; }
    this.nachTakten(80, () => { if (!erledigt) { erledigt = true; z.udp.delete(port); fertig(null, `${name}: Keine Antwort vom DNS-Server ${g.dns}.`); } });
  }

  /** Webbrowser: lädt eine Adresse wie http://name/pfad */
  ladeSeite(g, adresse, fertig) {
    const m = /^(?:https?:\/\/)?([^/\s]+)(\/\S*)?$/.exec(String(adresse).trim());
    if (!m) { fertig({ fehler: 'Ungültige Adresse.' }); return; }
    const [, host, pfad = '/'] = m;
    this.namensaufloesung(this.geraete.get(g.id), host, (ip, fehler) => {
      if (!ip) { fertig({ fehler }); return; }
      this.tcpAnfrage(g, ip, 80, `GET ${pfad} HTTP/1.1\nHost: ${host}\n`, (e) => {
        if (e.fehler) { fertig(e); return; }
        const [kopf, ...rest] = e.antwort.split('\n\n');
        fertig({ status: kopf.split('\n')[0], html: rest.join('\n\n'), host, ip });
      });
    });
  }

  // ---------------------------------------------------------------- E-Mail: SMTP (Port 25) und POP3 (Port 110)
  //
  // Der E-Mail-Server verwaltet eine Domain (z. B. schule.test) mit Konten. Über SMTP nimmt er Nachrichten an:
  // für eigene Konten legt er sie ins Postfach, für fremde Domains fragt er per DNS nach deren Mailserver
  // (MX-Eintrag) und leitet sie per SMTP weiter. Über POP3 holt das E-Mail-Programm die Nachrichten ab.

  echoEreignis(g, text) {
    const z = this.zustand.get(g.id);
    z.echoEreignisse ??= [];
    z.echoEreignisse.push({ zeit: this.zeit, text });
    if (z.echoEreignisse.length > 100) z.echoEreignisse.shift();
  }

  mailEreignis(g, text) {
    const z = this.zustand.get(g.id);
    z.mailEreignisse ??= [];
    z.mailEreignisse.push({ zeit: this.zeit, text });
    if (z.mailEreignisse.length > 100) z.mailEreignisse.shift();
  }

  smtpDienst(g) {
    const server = () => g.daten.emailserver;
    const domain = () => String(server().domain ?? '').toLowerCase().trim();
    return {
      sitzung: () => ({ von: null, an: [], daten: false }),
      begruessung: () => `220 ${domain() || g.name} ESMTP – E-Mail-Server bereit`,
      antwort: (zeile, s, absender) => {
        if (s.daten) {
          s.daten = false;
          const mail = { ...mailAusText(zeile), von: s.von, an: s.an };
          this.mailAnnehmen(g, mail, absender);
          s.von = null;
          s.an = [];
          return '250 OK – Nachricht angenommen';
        }
        const [befehl = '', ...rest] = zeile.trim().split(/\s+/);
        const arg = rest.join(' ');
        switch (befehl.toUpperCase()) {
          case 'HELO': case 'EHLO': return `250 ${domain() || g.name} grüßt ${arg || 'dich'}`;
          case 'MAIL': {
            const a = adresse(arg);
            if (!a) return '501 Absenderadresse fehlt (MAIL FROM:<name@domain>)';
            s.von = a;
            s.an = [];
            return '250 OK';
          }
          case 'RCPT': {
            const a = adresse(arg);
            if (!s.von) return '503 Bitte zuerst MAIL FROM';
            if (!a) return '501 Empfängeradresse fehlt (RCPT TO:<name@domain>)';
            const [name, dom] = a.split('@');
            if (dom === domain()) {
              if (!(server().konten ?? []).some((k) => k.name.toLowerCase() === name)) return `550 Postfach ${a} gibt es nicht`;
              s.an.push(a);
              return '250 OK';
            }
            s.an.push(a);
            return `250 OK – wird an ${dom} weitergeleitet`;
          }
          case 'DATA':
            if (!s.an.length) return '503 Bitte zuerst RCPT TO';
            s.daten = true;
            return '354 Nachricht senden, Ende mit einer Zeile „.“';
          case 'RSET': s.von = null; s.an = []; return '250 OK';
          case 'NOOP': return '250 OK';
          case 'QUIT': return `221 ${domain() || g.name} beendet die Verbindung`;
          default: return '500 Unbekannter Befehl';
        }
      },
    };
  }

  mailAnnehmen(g, mail, absender) {
    const server = g.daten.emailserver;
    const domain = String(server.domain ?? '').toLowerCase().trim();
    server.postfaecher ??= {};
    const fremd = new Map();
    for (const an of mail.an) {
      const [name, dom] = an.split('@');
      if (dom === domain) {
        (server.postfaecher[name] ??= []).push({ ...mail, an: [an], id: `m${this.zeit}-${Math.floor(Math.random() * 1e6)}` });
        this.mailEreignis(g, `Nachricht von ${mail.von} für ${an} ins Postfach gelegt (eingeliefert von ${absender})`);
      } else {
        if (!fremd.has(dom)) fremd.set(dom, []);
        fremd.get(dom).push(an);
      }
    }
    for (const [dom, liste] of fremd) this.mailWeiterleiten(g, { ...mail, an: liste }, dom);
  }

  /** Server leitet an eine fremde Domain weiter: DNS (MX) → DNS (A) → SMTP */
  mailWeiterleiten(g, mail, domain) {
    this.mailEreignis(g, `Frage DNS nach dem Mailserver von ${domain} (MX)`);
    this.namensaufloesung(g, domain, (mx, fehler) => {
      if (!mx) { this.mailEreignis(g, `Nicht zustellbar an ${mail.an.join(', ')}: ${fehler}`); return; }
      this.namensaufloesung(g, mx, (ip, fehler2) => {
        if (!ip) { this.mailEreignis(g, `Nicht zustellbar an ${mail.an.join(', ')}: ${fehler2}`); return; }
        this.mailEreignis(g, `Leite Nachricht an ${mx} (${ip}) weiter`);
        this.smtpSenden(g, ip, mail, (f) => this.mailEreignis(g, f ? `Weiterleitung an ${domain} fehlgeschlagen: ${f}` : `Nachricht an ${domain} übergeben`));
      });
    }, 'MX');
  }

  /** SMTP-Dialog als Client: HELO, MAIL FROM, RCPT TO, DATA, Nachricht, QUIT. fertig(fehler | null) */
  smtpSenden(g, ip, mail, fertig) {
    const schritte = [
      () => `HELO ${g.name}`,
      () => `MAIL FROM:<${mail.von}>`,
      ...mail.an.map((an) => () => `RCPT TO:<${an}>`),
      () => 'DATA',
      () => `${mailText(mail)}\n.`,
      () => 'QUIT',
    ];
    let i = 0;
    let fehler = null;
    this.tcpDialog(g, ip, 25, {
      begruessung: true,
      naechste: (antwort) => {
        if (fehler) return null;
        if (antwort && /^[45]/.test(antwort)) { fehler = antwort; return 'QUIT'; }
        return i < schritte.length ? schritte[i++]() : null;
      },
    }, (e) => fertig(e.fehler ?? fehler));
  }

  /** E-Mail-Programm: Nachricht über den eingetragenen Postausgangsserver (SMTP) verschicken */
  mailSenden(g, mail, fertig) {
    const p = g.daten.emailprogramm ?? {};
    if (!p.smtp) { fertig('Im Konto ist kein Postausgangsserver (SMTP) eingetragen.'); return; }
    this.namensaufloesung(g, p.smtp, (ip, fehler) => {
      if (!ip) { fertig(fehler); return; }
      this.smtpSenden(g, ip, { ...mail, von: p.adresse }, fertig);
    });
  }

  pop3Dienst(g) {
    const server = () => g.daten.emailserver;
    const postfach = (s) => (server().postfaecher ??= {})[s.benutzer] ??= [];
    return {
      sitzung: () => ({ benutzer: null, angemeldet: false, loeschen: new Set() }),
      begruessung: () => '+OK POP3-Server bereit',
      antwort: (zeile, s) => {
        const [befehl = '', arg = ''] = zeile.trim().split(/\s+/);
        const b = befehl.toUpperCase();
        if (b === 'USER') { s.benutzer = arg.toLowerCase(); s.angemeldet = false; return '+OK'; }
        if (b === 'PASS') {
          const konto = (server().konten ?? []).find((k) => k.name.toLowerCase() === s.benutzer);
          if (!konto || konto.passwort !== arg) return '-ERR Benutzername oder Passwort falsch';
          s.angemeldet = true;
          return `+OK angemeldet, ${postfach(s).length} Nachricht(en)`;
        }
        if (b === 'QUIT') {
          if (s.angemeldet && s.loeschen.size) server().postfaecher[s.benutzer] = postfach(s).filter((_, j) => !s.loeschen.has(j + 1));
          return '+OK Tschüss';
        }
        if (!s.angemeldet) return '-ERR Bitte zuerst anmelden (USER, PASS)';
        const liste = postfach(s);
        const nr = Number(arg);
        if (b === 'STAT') return `+OK ${liste.length} ${liste.reduce((a, m) => a + mailText(m).length, 0)}`;
        if (b === 'LIST') return `+OK ${liste.length} Nachricht(en)\n${liste.map((m, j) => `${j + 1} ${mailText(m).length}`).join('\n')}${liste.length ? '\n' : ''}.`;
        if (b === 'RETR') return liste[nr - 1] ? `+OK\n${mailText(liste[nr - 1])}\n.` : '-ERR Diese Nachricht gibt es nicht';
        if (b === 'DELE') { if (!liste[nr - 1]) return '-ERR Diese Nachricht gibt es nicht'; s.loeschen.add(nr); return '+OK gelöscht'; }
        return '-ERR Unbekannter Befehl';
      },
    };
  }

  /** E-Mail-Programm: neue Nachrichten per POP3 abholen (und auf dem Server löschen). fertig({neu} | {fehler}) */
  mailAbholen(g, fertig) {
    const p = g.daten.emailprogramm ?? {};
    if (!p.pop3) { fertig({ fehler: 'Im Konto ist kein Posteingangsserver (POP3) eingetragen.' }); return; }
    this.namensaufloesung(g, p.pop3, (ip, fehler) => {
      if (!ip) { fertig({ fehler }); return; }
      let schritt = 'gruss';
      let anzahl = 0;
      let nr = 0;
      let problem = null;
      const neu = [];
      this.tcpDialog(g, ip, 110, {
        begruessung: true,
        naechste: (antwort) => {
          if (antwort?.startsWith('-ERR') && schritt !== 'quit') { problem = antwort.replace(/^-ERR\s*/, ''); schritt = 'quit'; return 'QUIT'; }
          switch (schritt) {
            case 'gruss': schritt = 'user'; return `USER ${p.benutzer ?? ''}`;
            case 'user': schritt = 'pass'; return `PASS ${p.passwort ?? ''}`;
            case 'pass': schritt = 'stat'; return 'STAT';
            case 'stat':
              anzahl = Number(antwort.split(/\s+/)[1]) || 0;
              schritt = anzahl ? 'retr' : 'quit';
              nr = 1;
              return anzahl ? `RETR ${nr}` : 'QUIT';
            case 'retr':
              neu.push(mailAusText(antwort.replace(/^\+OK\n/, '').replace(/\n\.$/, '')));
              if (nr < anzahl) { nr++; return `RETR ${nr}`; }
              schritt = 'dele';
              nr = 1;
              return `DELE ${nr}`;
            case 'dele':
              if (nr < anzahl) { nr++; return `DELE ${nr}`; }
              schritt = 'quit';
              return 'QUIT';
            default: return null;
          }
        },
      }, (e) => {
        if (e.fehler || problem) { fertig({ fehler: e.fehler ?? problem }); return; }
        p.eingang ??= [];
        p.eingang.unshift(...neu.reverse().map((m) => ({ ...m, gelesen: false, id: `e${this.zeit}-${Math.floor(Math.random() * 1e6)}` })));
        fertig({ neu: neu.length });
      });
    });
  }

  // ---------------------------------------------------------------- DHCP

  dhcpAnfragen(g) {
    const z = this.zustand.get(g.id);
    const xid = Math.floor(Math.random() * 1e6);
    const nic = g.nics[0];
    z.udp.set(68, (p) => {
      const d = p.daten.nutzdaten;
      if (d.xid !== xid || d.mac !== nic.mac) return;
      if (d.dhcp === 'OFFER' && !z.dhcpAngebot) {
        z.dhcpAngebot = d;
        this.sendeUdp(g, '255.255.255.255', 67, 68, { dhcp: 'REQUEST', xid, mac: nic.mac, ip: d.ip, server: d.server }, 0, '0.0.0.0');
      } else if (d.dhcp === 'ACK') {
        nic.ip = d.ip; nic.maske = d.maske; g.gateway = d.gateway; g.dns = d.dns;
        z.udp.delete(68);
        z.dhcpFertig = true;
      }
    });
    this.sendeUdp(g, '255.255.255.255', 67, 68, { dhcp: 'DISCOVER', xid, mac: nic.mac }, 0, '0.0.0.0');
  }

  dhcpServer(g, p) {
    const d = p.daten.nutzdaten;
    const s = g.dhcpServer;
    const z = this.zustand.get(g.id);
    const nic = g.nics.findIndex((n) => imSelbenNetz(n.ip, s.von, n.maske));
    if (nic < 0) return;
    const maske = g.nics[nic].maske;
    if (d.dhcp === 'DISCOVER') {
      let ip = z.dhcpVergeben.get(d.mac);
      if (!ip) {
        const belegt = new Set([...z.dhcpVergeben.values()]);
        for (const x of this.geraete.values()) for (const n of x.nics) if (n.ip) belegt.add(n.ip);
        for (let a = ipZahl(s.von); a !== null && a <= ipZahl(s.bis); a++) if (!belegt.has(zahlIp(a))) { ip = zahlIp(a); break; }
      }
      if (!ip) return;
      z.dhcpVergeben.set(d.mac, ip);
      this.sendeUdp(g, '255.255.255.255', 68, 67, { dhcp: 'OFFER', xid: d.xid, mac: d.mac, ip, maske, gateway: s.gateway, dns: s.dns, server: g.nics[nic].ip }, nic);
    } else if (d.dhcp === 'REQUEST' && d.server === g.nics[nic].ip) {
      this.sendeUdp(g, '255.255.255.255', 68, 67, { dhcp: 'ACK', xid: d.xid, mac: d.mac, ip: d.ip, maske, gateway: s.gateway, dns: s.dns, server: g.nics[nic].ip }, nic);
    }
  }

  // ---------------------------------------------------------------- Datenaustausch (Protokoll je Gerät)

  protokolliere(g, rahmen, richtung) {
    const z = this.zustand.get(g.id);
    if (!z) return;
    z.logNr++;
    const zeilen = beschreibeRahmen(rahmen);
    for (const zeile of zeilen) z.log.push({ nr: z.logNr, zeit: this.zeit, richtung, ...zeile });
    if (z.log.length > MAX_LOG) z.log.splice(0, z.log.length - MAX_LOG);
  }
}

/** Zerlegt einen Rahmen in Zeilen je Schicht (wie im Fenster „Datenaustausch“). */
export function beschreibeRahmen(r) {
  const zeilen = [];
  if (r.typ === 'ARP') {
    const a = r.daten;
    zeilen.push({ schicht: 'Netzzugang', protokoll: 'ARP', quelle: a.quellIp || a.quellMac, ziel: a.zielIp, bemerkung: a.op === 'anfrage' ? `Suche MAC-Adresse für ${a.zielIp}, ${a.quellIp}: ${a.quellMac}` : `${a.quellIp}: ${a.quellMac}` });
    return zeilen;
  }
  const p = r.daten;
  zeilen.push({ schicht: 'Netzzugang', protokoll: 'Ethernet', quelle: r.quellMac, ziel: r.zielMac, bemerkung: 'IPv4' });
  zeilen.push({ schicht: 'Vermittlung', protokoll: p.protokoll === 'ICMP' ? 'ICMP' : 'IP', quelle: p.quelle, ziel: p.ziel, bemerkung: p.protokoll === 'ICMP' ? icmpText(p) : `TTL ${p.ttl}, ${p.protokoll}` });
  const d = p.daten;
  if (p.protokoll === 'UDP' || p.protokoll === 'TCP') {
    zeilen.push({
      schicht: 'Transport', protokoll: p.protokoll, quelle: `${p.quelle}:${d.quellPort}`, ziel: `${p.ziel}:${d.zielPort}`,
      bemerkung: p.protokoll === 'TCP' ? `${d.flags.join(', ')} (Seq ${d.seq}, Ack ${d.ack})` : `Port ${d.quellPort} → ${d.zielPort}`,
    });
    const anwendung = anwendungText(p);
    if (anwendung) zeilen.push({ schicht: 'Anwendung', quelle: `${p.quelle}:${d.quellPort}`, ziel: `${p.ziel}:${d.zielPort}`, ...anwendung });
  }
  return zeilen;
}

function icmpText(p) {
  const d = p.daten;
  return { anfrage: `Echo Request (ping), Seq ${d.seq}, TTL ${p.ttl}`, antwort: `Echo Reply, Seq ${d.seq}`, zeit: 'Time Exceeded – TTL abgelaufen', unerreichbar: 'Destination Unreachable – Ziel nicht erreichbar' }[d.typ] ?? 'ICMP';
}

function anwendungText(p) {
  const d = p.daten;
  const n = d.nutzdaten;
  if (p.protokoll === 'UDP' && n?.dhcp) return { protokoll: 'DHCP', bemerkung: `${n.dhcp}${n.ip ? ` ${n.ip}` : ''}${n.dhcp === 'ACK' ? ` (Gateway ${n.gateway || '–'}, DNS ${n.dns || '–'})` : ''}` };
  if (p.protokoll === 'UDP' && n?.dns) return { protokoll: 'DNS', bemerkung: n.dns === 'anfrage' ? (n.typ === 'MX' ? `Anfrage: Mailserver (MX) von ${n.name}?` : `Anfrage: Adresse von ${n.name}?`) : `Antwort: ${n.name}${n.typ === 'MX' ? ' (MX)' : ''} = ${n.ip ?? 'unbekannt'}` };
  if (p.protokoll === 'TCP' && n) {
    const erste = String(n).split('\n')[0];
    const bekannt = { 25: 'SMTP', 110: 'POP3', 80: 'HTTP', 55555: 'Echo', [P2P_PORT]: 'P2P' };
    const protokoll = bekannt[d.zielPort] ?? bekannt[d.quellPort] ?? 'Daten';
    return { protokoll, bemerkung: erste.length > 80 ? `${erste.slice(0, 80)} …` : erste };
  }
  return null;
}

/** Passt ein Dateiname zum Suchbegriff? (Teil des Namens, Groß-/Kleinschreibung egal; leer oder * = alles) */
export function p2pPasst(name, begriff) {
  const b = String(begriff ?? '').trim().toLowerCase();
  return b === '' || b === '*' || name.toLowerCase().includes(b);
}

// ------------------------------------------------------------------ E-Mail-Hilfen

/** name@domain aus „FROM:<name@domain>“ o. Ä. (klein geschrieben) */
export function adresse(text) {
  const m = /<?([^<>\s:]+@[^<>\s]+?)>?$/.exec(String(text ?? '').trim());
  return m ? m[1].toLowerCase() : null;
}

/** Nachricht als Text (Kopfzeilen, Leerzeile, Inhalt) – so geht sie bei SMTP DATA und POP3 RETR über die Leitung */
export function mailText(m) {
  const inhalt = String(m.text ?? '').replace(/\r/g, '').replace(/^\.$/gm, '..');
  return [`From: ${m.von ?? ''}`, `To: ${(m.an ?? []).join(', ')}`, `Subject: ${m.betreff ?? ''}`, '', inhalt].join('\n');
}

export function mailAusText(text) {
  const [kopf, ...rumpf] = String(text).replace(/\n\.$/, '').split('\n\n');
  const feld = (n) => (new RegExp(`^${n}:\\s*(.*)$`, 'mi').exec(kopf) ?? [])[1]?.trim() ?? '';
  return {
    von: feld('From'),
    an: feld('To').split(/,\s*/).filter(Boolean),
    betreff: feld('Subject'),
    text: rumpf.join('\n\n').replace(/^\.\./gm, '.'),
  };
}

// ------------------------------------------------------------------ Firewall-Hilfen

/** „192.168.1.0/24“, „192.168.1.0/255.255.255.0“, „192.168.1.5“ oder leer (= beliebig) → {netz, maske} | null bei Fehler */
export function adressbereich(text) {
  const t = String(text ?? '').trim();
  if (t === '' || t === '*' || t.toLowerCase() === 'beliebig') return { netz: 0, maske: 0 };
  const [ip, m = '32'] = t.split('/');
  const z = ipZahl(ip);
  if (z === null) return null;
  let maske;
  if (/^\d{1,2}$/.test(m) && Number(m) <= 32) maske = Number(m) === 0 ? 0 : (~0 << (32 - Number(m))) >>> 0;
  else if (gueltigeMaske(m)) maske = ipZahl(m);
  else return null;
  return { netz: (z & maske) >>> 0, maske };
}

const imBereich = (ip, b) => b && ((ipZahl(ip) ?? -1) & b.maske) >>> 0 === b.netz;

export function regelPasst(regel, p) {
  if (regel.protokoll && regel.protokoll !== 'alle' && regel.protokoll !== p.protokoll) return false;
  if (!imBereich(p.quelle, adressbereich(regel.quelle))) return false;
  if (!imBereich(p.ziel, adressbereich(regel.ziel))) return false;
  const port = String(regel.port ?? '').trim();
  if (port !== '' && (p.protokoll === 'TCP' || p.protokoll === 'UDP')) return Number(port) === p.daten.zielPort;
  if (port !== '' && p.protokoll === 'ICMP') return false;
  return true;
}

/** Ist das Paket eine Antwort, die zu einer schon begonnenen Verbindung gehört (statt einer neuen Anfrage)? */
export function istAntwort(p) {
  if (p.protokoll === 'TCP') return !(p.daten.flags.includes('SYN') && !p.daten.flags.includes('ACK'));
  if (p.protokoll === 'UDP') return p.daten.zielPort >= 49152 || p.daten.zielPort === 68;
  if (p.protokoll === 'ICMP') return p.daten.typ !== 'anfrage';
  return false;
}

function paketKurz(p) {
  if (p.protokoll === 'ICMP') return p.daten.typ === 'anfrage' ? 'Ping-Anfrage (ICMP)' : 'ICMP';
  const dienst = { 25: 'SMTP', 53: 'DNS', 67: 'DHCP', 80: 'HTTP', 110: 'POP3' }[p.daten.zielPort];
  return `${p.protokoll} an Port ${p.daten.zielPort}${dienst ? ` (${dienst})` : ''}`;
}
