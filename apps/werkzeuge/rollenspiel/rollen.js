// Rollenspiel „Nachrichten im Netzwerk“: Rollen und Datenblätter aus einer kurzen Konfiguration erzeugen (ohne DOM, testbar).
//
// Alles ergibt sich aus vier Zahlen – Anzahl der Mitspielenden, Anzahl der Gruppen (= Subnetze), Stufe und Zufallszahl –,
// zusammen der Code, z. B. „24-4-2-517“. Wer den Code und seine Nummer (1 … Anzahl) kennt, bekommt auf jedem Gerät
// dieselbe Karte. Es wird nichts gespeichert und nichts an einen Server geschickt.
//
// Adressschema (wie im Kapitel „Netzwerksysteme“):
//   Gruppe g = Subnetz 1.1.g.0 mit Netzmaske 255.255.255.0; Mitglied j (ab 0) hat die IP 1.1.g.(j+1).
//   Stufe 3: Mitglied 0 jeder Gruppe ist Router (rechte Hand 1.1.g.1, linke Hand 3.3.3.g im Backbone 3.3.3.0),
//            Mitglied 1 von Gruppe 1 ist der DNS-Server (1.1.1.2).
//   MAC-Adressen: zwei Hex-Bytes (vereinfacht, echte haben sechs), Rundsendung (Broadcast) = FF:FF.

export const STUFEN = {
  1: { titel: 'Stufe 1 · Ein Netz im Klassenzimmer (ohne ARP)', kurz: 'LAN ohne ARP' },
  2: { titel: 'Stufe 2 · Wer hat diese IP? (mit ARP)', kurz: 'LAN mit ARP' },
  3: { titel: 'Stufe 3 · Netze verbinden (Router, Gateway, DNS)', kurz: 'Router und DNS' },
};
export const MASKE = '255.255.255.0';
export const BROADCAST = 'FF:FF';
export const DNS_IP = '1.1.1.2';
export const GRENZEN = { minPersonen: 3, maxPersonen: 64, maxGruppen: 8, minJeGruppe: 3 };

const TIERE = ['adler', 'affe', 'ameise', 'biber', 'bison', 'dachs', 'dohle', 'elch', 'ente', 'esel', 'eule', 'falke', 'fink',
  'fuchs', 'gans', 'gecko', 'hai', 'hase', 'hirsch', 'hummel', 'igel', 'iltis', 'kauz', 'koala', 'krabbe', 'kranich', 'lama',
  'lemur', 'luchs', 'marder', 'maus', 'meise', 'molch', 'mops', 'nerz', 'otter', 'panda', 'pfau', 'pinguin', 'puma', 'rabe',
  'reh', 'robbe', 'spatz', 'specht', 'storch', 'tapir', 'taube', 'tiger', 'uhu', 'unke', 'wal', 'wiesel', 'wolf', 'yak', 'zebra',
  'zeisig', 'alpaka', 'delfin', 'gnu', 'hamster', 'kiwi', 'lachs', 'qualle', 'schaf', 'star', 'wachtel', 'wels'];

/** kleiner, reproduzierbarer Zufallsgenerator (mulberry32) */
function zufall(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mische(liste, rnd) {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Prüft eine Konfiguration; gibt einen Fehlertext oder null zurück. */
export function pruefe({ personen, gruppen, stufe, seed }) {
  if (![personen, gruppen, stufe, seed].every(Number.isInteger)) return 'Der Code besteht aus vier ganzen Zahlen, z. B. 24-4-2-517.';
  if (personen < GRENZEN.minPersonen || personen > GRENZEN.maxPersonen) return `Es können ${GRENZEN.minPersonen} bis ${GRENZEN.maxPersonen} Personen mitspielen.`;
  if (gruppen < 1 || gruppen > GRENZEN.maxGruppen) return `Es sind 1 bis ${GRENZEN.maxGruppen} Gruppen möglich.`;
  if (!STUFEN[stufe]) return 'Die Stufe muss 1, 2 oder 3 sein.';
  if (seed < 0 || seed > 999) return 'Die letzte Zahl des Codes liegt zwischen 0 und 999.';
  if (Math.floor(personen / gruppen) < GRENZEN.minJeGruppe) return `Jede Gruppe braucht mindestens ${GRENZEN.minJeGruppe} Personen – weniger Gruppen wählen.`;
  if (stufe === 3 && gruppen < 2) return 'Für Stufe 3 (Netze verbinden) braucht es mindestens zwei Gruppen.';
  return null;
}

export const code = ({ personen, gruppen, stufe, seed }) => `${personen}-${gruppen}-${stufe}-${seed}`;

export function leseCode(text) {
  const m = String(text ?? '').trim().match(/^(\d{1,2})\s*-\s*(\d)\s*-\s*(\d)\s*-\s*(\d{1,3})$/);
  if (!m) return { fehler: 'Der Code hat die Form Anzahl-Gruppen-Stufe-Zahl, z. B. 24-4-2-517.' };
  const k = { personen: Number(m[1]), gruppen: Number(m[2]), stufe: Number(m[3]), seed: Number(m[4]) };
  const fehler = pruefe(k);
  return fehler ? { fehler } : k;
}

/** Gruppengrößen: so gleich wie möglich, die ersten Gruppen bekommen die übrigen Personen */
export function gruppenGroessen(personen, gruppen) {
  return Array.from({ length: gruppen }, (_, i) => Math.floor(personen / gruppen) + (i < personen % gruppen ? 1 : 0));
}

/**
 * Alle Rollen einer Konfiguration.
 * @returns {{karten: object[], gruppen: object[], dnsTabelle: {name: string, ip: string}[], stufe: number}}
 */
export function erzeuge(konfig) {
  const fehler = pruefe(konfig);
  if (fehler) throw new Error(fehler);
  const { personen, gruppen, stufe, seed } = konfig;
  const rnd = zufall(seed * 7919 + 13);
  const namen = mische(TIERE, rnd);
  // eindeutige MAC-Adressen (zwei Hex-Bytes, ohne 00:00 und FF:FF)
  const macs = new Set();
  const neueMac = () => {
    for (;;) {
      const z = 0x1000 + Math.floor(rnd() * 0xee00);
      const mac = `${(z >> 8).toString(16).toUpperCase().padStart(2, '0')}:${(z & 255).toString(16).toUpperCase().padStart(2, '0')}`;
      if (!macs.has(mac) && mac !== BROADCAST) { macs.add(mac); return mac; }
    }
  };
  const groessen = gruppenGroessen(personen, gruppen);
  const karten = [];
  const gruppenListe = [];
  let nr = 1;
  groessen.forEach((groesse, gi) => {
    const g = gi + 1;
    const mitglieder = [];
    for (let j = 0; j < groesse; j++, nr++) {
      const ip = `1.1.${g}.${j + 1}`;
      const istRouter = stufe === 3 && j === 0;
      const istDns = stufe === 3 && g === 1 && j === 1;
      const karte = {
        nr, gruppe: g, rolle: istRouter ? 'router' : istDns ? 'dns' : 'client',
        name: namen[(nr - 1) % namen.length] + (nr > namen.length ? String(Math.ceil(nr / namen.length)) : ''),
        nics: [{ hand: 'rechte Hand', mac: neueMac(), ip, maske: MASKE, netz: `1.1.${g}.x` }],
        gateway: stufe === 3 && !istRouter ? `1.1.${g}.1` : '',
        dns: stufe === 3 && !istRouter ? DNS_IP : '',
      };
      // die zweite MAC wird immer gezogen, damit alle Adressen in jeder Stufe gleich bleiben
      const macLinks = j === 0 ? neueMac() : '';
      if (istRouter) karte.nics.push({ hand: 'linke Hand', mac: macLinks, ip: `3.3.3.${g}`, maske: MASKE, netz: '3.3.3.x' });
      karten.push(karte);
      mitglieder.push(karte);
    }
    gruppenListe.push({ nr: g, netz: `1.1.${g}.x`, von: mitglieder[0].nr, bis: mitglieder.at(-1).nr, mitglieder });
  });
  // Routingtabellen der Router (Stufe 3): eigene Netze direkt, andere Gruppen über deren Router im Backbone
  if (stufe === 3) {
    for (const r of karten.filter((k) => k.rolle === 'router')) {
      const g = r.gruppe;
      r.routing = [
        { ziel: `1.1.${g}.1 oder 3.3.3.${g}`, aktion: 'selbst verarbeiten (das bin ich)', hand: '–' },
        { ziel: `1.1.${g}.x`, aktion: 'direkt an die Ziel-IP (ARP im eigenen Netz)', hand: 'rechte Hand' },
        { ziel: '3.3.3.x', aktion: 'direkt an die Ziel-IP (ARP im Backbone)', hand: 'linke Hand' },
        ...gruppenListe.filter((h) => h.nr !== g).map((h) => ({ ziel: `1.1.${h.nr}.x`, aktion: `an Router ${h.nr}: IP 3.3.3.${h.nr}`, hand: 'linke Hand' })),
        { ziel: 'alle anderen', aktion: 'verwerfen (gibt es in unserem Spiel nicht)', hand: '–' },
      ];
    }
  }
  const dnsTabelle = karten.map((k) => ({ name: k.name, ip: k.nics[0].ip }));
  const dnsKarte = karten.find((k) => k.rolle === 'dns');
  if (dnsKarte) dnsKarte.dnsTabelle = dnsTabelle;
  return { karten, gruppen: gruppenListe, dnsTabelle, stufe };
}

/** MAC-Liste einer Gruppe (Stufe 1: ersetzt ARP) */
export function macListe(ergebnis, gruppe) {
  return ergebnis.karten.filter((k) => k.gruppe === gruppe).map((k) => ({ name: k.name, ip: k.nics[0].ip, mac: k.nics[0].mac }));
}

export const neuerSeed = () => Math.floor(Math.random() * 1000);
