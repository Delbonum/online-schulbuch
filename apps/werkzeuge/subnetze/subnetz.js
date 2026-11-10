// Subnetz-Rechnungen (ohne DOM, testbar): IPv4-Adressen, Netzmasken, Netz- und Broadcast-Adresse, Aufgaben für den Trainer.

export function ipZahl(ip) {
  const t = String(ip ?? '').trim().split('.');
  if (t.length !== 4 || !t.every((x) => /^\d{1,3}$/.test(x) && Number(x) <= 255)) return null;
  return t.reduce((z, x) => z * 256 + Number(x), 0);
}
export const zahlIp = (z) => [z >>> 24, (z >>> 16) & 255, (z >>> 8) & 255, z & 255].join('.');
export const maskeAusSuffix = (n) => (n === 0 ? 0 : (0xffffffff << (32 - n)) >>> 0);

/** Anzahl der führenden Einsen einer gültigen Netzmaske, sonst null */
export function suffix(maske) {
  const z = typeof maske === 'number' ? maske : ipZahl(maske);
  if (z === null) return null;
  for (let n = 0; n <= 32; n++) if (maskeAusSuffix(n) === z >>> 0) return n;
  return null;
}

export const binaer = (z) => [24, 16, 8, 0].map((s) => ((z >>> s) & 255).toString(2).padStart(8, '0')).join('.');

/** Alles Wissenswerte über eine IP-Adresse mit Netzmaske */
export function analysiere(ip, maske) {
  const i = ipZahl(ip);
  const m = ipZahl(maske);
  const n = suffix(m);
  if (i === null) throw new Error('Das ist keine gültige IP-Adresse (vier Zahlen von 0 bis 255, mit Punkten getrennt).');
  if (n === null) throw new Error('Das ist keine gültige Netzmaske: Binär müssen erst nur Einsen und dann nur Nullen kommen.');
  const netz = (i & m) >>> 0;
  const broadcast = (netz | (~m >>> 0)) >>> 0;
  const adressen = 2 ** (32 - n);
  return {
    ip: zahlIp(i), maske: zahlIp(m), suffix: n,
    netz: zahlIp(netz), broadcast: zahlIp(broadcast),
    adressen, geraete: n >= 31 ? (n === 32 ? 1 : 2) : adressen - 2,
    erste: n >= 31 ? zahlIp(netz) : zahlIp(netz + 1), letzte: n >= 31 ? zahlIp(broadcast) : zahlIp(broadcast - 1),
    binaer: { ip: binaer(i), maske: binaer(m), netz: binaer(netz) },
  };
}

export const gleichesNetz = (a, b, maske) => ((ipZahl(a) & ipZahl(maske)) >>> 0) === ((ipZahl(b) & ipZahl(maske)) >>> 0);

// ------------------------------------------------------------------ Aufgaben

export const ARTEN = {
  gleich: 'Gleiches Subnetz?',
  netz: 'Netzadresse bestimmen',
  broadcast: 'Broadcast-Adresse bestimmen',
  anzahl: 'Wie viele Geräte passen ins Netz?',
  suffix: 'Netzmaske ↔ Suffix',
};

const zufallsZahl = (rnd, min, max) => min + Math.floor(rnd() * (max - min + 1));

/** Zufällige Aufgabe. krumm = auch Masken, die nicht auf Bytegrenzen enden. */
export function neueAufgabe(art, { krumm = false, rnd = Math.random } = {}) {
  const suffixe = krumm ? [8, 12, 16, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] : [8, 16, 24];
  const n = suffixe[zufallsZahl(rnd, 0, suffixe.length - 1)];
  const maske = zahlIp(maskeAusSuffix(n));
  const ersteZahl = [10, 88, 172, 192, 213][zufallsZahl(rnd, 0, 4)];
  const ip = zahlIp(((ersteZahl << 24) >>> 0) + zufallsZahl(rnd, 1, 0xfffffe));
  const a = analysiere(ip, maske);
  switch (art) {
    case 'gleich': {
      // Ziel-IP: zur Hälfte im selben Netz, sonst knapp daneben (andere Stelle in den Netz-Bits)
      const imNetz = rnd() < 0.5;
      const basis = ipZahl(a.netz);
      let ziel;
      if (imNetz) ziel = zahlIp(basis + zufallsZahl(rnd, 1, Math.max(1, a.adressen - 2)));
      else {
        const bit = 32 - n + zufallsZahl(rnd, 0, Math.min(7, n - 1));
        ziel = zahlIp(((ipZahl(ip) ^ (1 << bit)) >>> 0));
      }
      return { art, ip, maske, ziel, frage: `Liegt ${ziel} im selben Subnetz wie ${ip} (Netzmaske ${maske})?`, loesung: gleichesNetz(ip, ziel, maske) ? 'ja' : 'nein', analyse: a };
    }
    case 'netz': return { art, ip, maske, frage: `Wie lautet die Netzadresse von ${ip} mit der Netzmaske ${maske}?`, loesung: a.netz, analyse: a };
    case 'broadcast': return { art, ip, maske, frage: `Wie lautet die Broadcast-Adresse im Netz von ${ip} mit der Netzmaske ${maske}?`, loesung: a.broadcast, analyse: a };
    case 'anzahl': return { art, ip, maske, frage: `Wie viele Geräte kann man höchstens in ein Netz mit der Netzmaske ${maske} hängen?`, loesung: String(a.geraete), analyse: a };
    case 'suffix':
      return rnd() < 0.5
        ? { art, ip, maske, frage: `Welches Suffix (/…) gehört zur Netzmaske ${maske}?`, loesung: `/${n}`, analyse: a }
        : { art, ip, maske, frage: `Welche Netzmaske gehört zum Suffix /${n}?`, loesung: maske, analyse: a };
    default: throw new Error(`Unbekannte Aufgabenart: ${art}`);
  }
}

/** Antwort prüfen (Leerzeichen, „/“ und Groß-/Kleinschreibung egal) */
export function pruefeAntwort(aufgabe, antwort) {
  const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, '').replace(/^\//, '');
  if (aufgabe.art === 'anzahl') return Number(norm(antwort).replace(/[.']/g, '')) === Number(aufgabe.loesung);
  return norm(antwort) === norm(aufgabe.loesung);
}
