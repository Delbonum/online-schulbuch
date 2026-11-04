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
// Gespeichert wird nur der Entwurf (Geräte, Einstellungen, installierte Software, Daten der Server); der Zustand
// während der Simulation (ARP-Tabellen, Verbindungen, Protokolle) entsteht bei start() neu.

export const BROADCAST_MAC = 'FF:FF:FF:FF:FF:FF';
export const TYPEN = ['rechner', 'notebook', 'switch', 'router'];
export const SOFTWARE = {
  befehlszeile: 'Befehlszeile',
  webbrowser: 'Webbrowser',
  webserver: 'Webserver',
  dnsserver: 'DNS-Server',
};
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

// ------------------------------------------------------------------ Netz

export class Netz {
  constructor() {
    this.geraete = new Map();
    this.kabel = [];
    this.zaehler = 1;
    this.laeuft = false;
    this.zeit = 0;
  }

  // ---------------------------------------------------------------- Entwurf

  neuesGeraet(typ, { x = 100, y = 100, name } = {}) {
    if (!TYPEN.includes(typ)) throw new Error(`Unbekannter Gerätetyp: ${typ}`);
    const id = `g${this.zaehler++}`;
    const nummer = [...this.geraete.values()].filter((g) => g.typ === typ).length + 1;
    const grund = { rechner: 'Rechner', notebook: 'Notebook', switch: 'Switch', router: 'Router' }[typ];
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
    if (typ === 'rechner' || typ === 'notebook') {
      g.nics.push({ ...this.neueNic(), ip: `192.168.0.${10 + this.geraete.size}`, maske: '255.255.255.0' });
      g.software = ['befehlszeile'];
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

  toJSON() {
    return { format: 'online-schulbuch-netzwerk', version: 1, zaehler: this.zaehler, geraete: [...this.geraete.values()], kabel: this.kabel };
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
    }
    n.kabel = (daten.kabel ?? []).filter((k) => n.geraete.has(k.a?.g) && n.geraete.has(k.b?.g));
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
      if (g) this.empfange(g, ziel.nic, f.rahmen);
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
    if (fuerMich) { this.zustellen(g, nic, p); return; }
    if (g.typ !== 'router') return; // Rechner leiten nicht weiter
    if (p.ttl <= 1) {
      this.sendeIp(g, { ziel: p.quelle, quelle: g.nics[nic].ip, protokoll: 'ICMP', daten: { typ: 'zeit', bemerkung: 'TTL abgelaufen', id: p.daten?.id, seq: p.daten?.seq } });
      return;
    }
    const fehler = this.sendeIp(g, { ...p, ttl: p.ttl - 1 });
    if (fehler && (p.protokoll !== 'ICMP' || p.daten?.typ === 'anfrage')) {
      this.sendeIp(g, { ziel: p.quelle, quelle: g.nics[nic].ip, protokoll: 'ICMP', daten: { typ: 'unerreichbar', bemerkung: 'Ziel nicht erreichbar', id: p.daten?.id, seq: p.daten?.seq } });
    }
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
  // Ablauf je Anfrage: SYN – SYN,ACK – ACK – Daten (PSH,ACK) – ACK – Antwort (PSH,ACK) – ACK – FIN,ACK – FIN,ACK – ACK

  tcpAnfrage(g, ziel, zielPort, text, fertig) {
    const z = this.zustand.get(g.id);
    const quellPort = this.freierPort();
    const v = { ziel, zielPort, quellPort, zustand: 'syn-gesendet', seq: 1000, ack: 0, text, fertig, client: true };
    z.tcp.set(`${ziel}:${zielPort}:${quellPort}`, v);
    const fehler = this.tcpSende(g, v, ['SYN']);
    if (fehler) { z.tcp.delete(`${ziel}:${zielPort}:${quellPort}`); fertig({ fehler }); return; }
    this.nachTakten(120, () => {
      if (v.zustand !== 'fertig') { z.tcp.delete(`${ziel}:${zielPort}:${quellPort}`); v.zustand = 'fertig'; fertig({ fehler: 'Zeitüberschreitung – keine Antwort vom Server' }); }
    });
  }

  tcpSende(g, v, flags, nutzdaten = '') {
    const segment = { quellPort: v.quellPort, zielPort: v.zielPort, flags, seq: v.seq, ack: v.ack, nutzdaten };
    v.seq += nutzdaten.length + (flags.includes('SYN') || flags.includes('FIN') ? 1 : 0);
    return this.sendeIp(g, { ziel: v.ziel, quelle: v.quelle, protokoll: 'TCP', daten: segment });
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
      v.zustand = 'syn-empfangen';
      z.tcp.set(schluessel, v);
      this.tcpSende(g, v, ['SYN', 'ACK']);
      return;
    }
    v.ack = s.seq + zaehlt;
    if (s.flags.includes('RST')) {
      z.tcp.delete(schluessel);
      if (v.client && v.zustand !== 'fertig') { v.zustand = 'fertig'; v.fertig({ fehler: 'Verbindung abgelehnt (kein Server auf diesem Port)' }); }
      return;
    }
    if (v.client) {
      if (v.zustand === 'syn-gesendet' && s.flags.includes('SYN')) {
        v.zustand = 'verbunden';
        this.tcpSende(g, v, ['ACK']);
        this.tcpSende(g, v, ['PSH', 'ACK'], v.text);
        v.zustand = 'wartet';
      } else if (v.zustand === 'wartet' && s.nutzdaten) {
        v.antwort = s.nutzdaten;
        this.tcpSende(g, v, ['ACK']);
        this.tcpSende(g, v, ['FIN', 'ACK']);
        v.zustand = 'fin-gesendet';
      } else if (v.zustand === 'fin-gesendet' && s.flags.includes('FIN')) {
        this.tcpSende(g, v, ['ACK']);
        z.tcp.delete(schluessel);
        v.zustand = 'fertig';
        v.fertig({ antwort: v.antwort });
      }
      return;
    }
    // Server
    if (s.nutzdaten) {
      this.tcpSende(g, v, ['ACK']);
      const antwort = v.dienst(s.nutzdaten, p.quelle);
      this.tcpSende(g, v, ['PSH', 'ACK'], antwort);
    } else if (s.flags.includes('FIN')) {
      this.tcpSende(g, v, ['FIN', 'ACK']);
      z.tcp.delete(schluessel);
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
      z.tcpDienste.set(80, (anfrage) => this.http(g, anfrage));
    }
    if (g.software.includes('dnsserver') && d.dnsserver?.laeuft) {
      z.udp.set(53, (p) => {
        const name = String(p.daten.nutzdaten.name ?? '').toLowerCase().replace(/\.$/, '');
        const eintrag = (d.dnsserver.eintraege ?? []).find((e) => e.name.toLowerCase().replace(/\.$/, '') === name);
        this.sendeUdp(g, p.quelle, p.daten.quellPort, 53, { dns: 'antwort', name, ip: eintrag?.ip ?? null, id: p.daten.nutzdaten.id });
      });
    }
    if (g.dhcpServer?.aktiv) z.udp.set(67, (p) => this.dhcpServer(g, p));
  }

  http(g, anfrage) {
    const zeile = String(anfrage).split('\n')[0];
    const m = /^GET\s+(\S+)/.exec(zeile);
    const dateien = g.daten.webserver?.dateien ?? {};
    let pfad = m ? decodeURIComponent(m[1]).replace(/^\/+/, '') : '';
    if (pfad === '' || pfad.endsWith('/')) pfad += 'index.html';
    if (m && Object.prototype.hasOwnProperty.call(dateien, pfad)) return `HTTP/1.1 200 OK\n\n${dateien[pfad]}`;
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

  /** Name → IP über den eingetragenen DNS-Server (IP-Adressen bleiben, wie sie sind). */
  namensaufloesung(g, name, fertig) {
    name = String(name ?? '').trim().replace(/^https?:\/\//, '').split('/')[0];
    if (gueltigeIp(name)) { fertig(name); return; }
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
      fertig(ip, ip ? null : `${name}: Name unbekannt (der DNS-Server kennt ihn nicht).`);
    });
    const f = this.sendeUdp(g, g.dns, 53, port, { dns: 'anfrage', name, id });
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
  if (p.protokoll === 'UDP' && n?.dns) return { protokoll: 'DNS', bemerkung: n.dns === 'anfrage' ? `Anfrage: Adresse von ${n.name}?` : `Antwort: ${n.name} = ${n.ip ?? 'unbekannt'}` };
  if (p.protokoll === 'TCP' && n) {
    const erste = String(n).split('\n')[0];
    return { protokoll: 'HTTP', bemerkung: erste.length > 80 ? `${erste.slice(0, 80)} …` : erste };
  }
  return null;
}
