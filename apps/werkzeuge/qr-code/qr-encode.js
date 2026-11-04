// Erzeugt einen vollständigen QR-Code (Byte-Modus, Fehlerkorrektur M, Version 1–10) aus einem Text –
// z. B. für den Link zu einer Umfrage. Ohne Abhängigkeiten; folgt dem Standard ISO/IEC 18004.
//
//   const { size, modules } = qrEncode('https://…');   modules[y][x] === true → dunkles Modul
//   qrSvg('https://…')                                  fertiges SVG (mit Ruhezone)

// Fehlerkorrektur M: Prüfbytes je Block und Anzahl der Blöcke, Index = Version
const ECC_PER_BLOCK = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const BLOCKS = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
const FORMAT_M = 0; // Formatbits der Stufe M

const bit = (x, i) => ((x >>> i) & 1) !== 0;

function rohModule(ver) {
  let n = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const anzahl = Math.floor(ver / 7) + 2;
    n -= (25 * anzahl - 10) * anzahl - 55;
    if (ver >= 7) n -= 36;
  }
  return n;
}
const datenBytes = (ver) => Math.floor(rohModule(ver) / 8) - ECC_PER_BLOCK[ver] * BLOCKS[ver];

// Rechnen im Galois-Feld GF(2^8) mit dem Polynom 0x11D
function gfMal(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}
function rsTeiler(grad) {
  const r = new Array(grad).fill(0);
  r[grad - 1] = 1;
  let wurzel = 1;
  for (let i = 0; i < grad; i++) {
    for (let j = 0; j < r.length; j++) {
      r[j] = gfMal(r[j], wurzel);
      if (j + 1 < r.length) r[j] ^= r[j + 1];
    }
    wurzel = gfMal(wurzel, 0x02);
  }
  return r;
}
function rsRest(daten, teiler) {
  const r = new Array(teiler.length).fill(0);
  for (const b of daten) {
    const faktor = b ^ r.shift();
    r.push(0);
    teiler.forEach((k, i) => { r[i] ^= gfMal(k, faktor); });
  }
  return r;
}

function ausrichtungsPositionen(ver, size) {
  if (ver === 1) return [];
  const anzahl = Math.floor(ver / 7) + 2;
  const schritt = Math.ceil((ver * 4 + 4) / (anzahl * 2 - 2)) * 2;
  const r = [6];
  for (let pos = size - 7; r.length < anzahl; pos -= schritt) r.splice(1, 0, pos);
  return r;
}

export function qrEncode(text) {
  const bytes = [...new TextEncoder().encode(text)];
  let ver = 1;
  const bitsFuer = (v) => 4 + (v < 10 ? 8 : 16) + bytes.length * 8;
  while (ver <= 10 && bitsFuer(ver) > datenBytes(ver) * 8) ver++;
  if (ver > 10) throw new Error('Text zu lang für einen QR-Code bis Version 10.');
  const size = ver * 4 + 17;

  // Datenbits: Modus 0100 (Byte), Länge, Bytes, Abschluss, Füllbytes
  const bits = [];
  const schreib = (wert, n) => { for (let i = n - 1; i >= 0; i--) bits.push((wert >>> i) & 1); };
  schreib(4, 4);
  schreib(bytes.length, ver < 10 ? 8 : 16);
  for (const b of bytes) schreib(b, 8);
  const kapazitaet = datenBytes(ver) * 8;
  schreib(0, Math.min(4, kapazitaet - bits.length));
  schreib(0, (8 - (bits.length % 8)) % 8);
  for (let f = 0xec; bits.length < kapazitaet; f ^= 0xec ^ 0x11) schreib(f, 8);
  const daten = [];
  for (let i = 0; i < bits.length; i += 8) daten.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));

  // In Blöcke teilen, Prüfbytes anhängen, verschränken
  const anzahlBloecke = BLOCKS[ver];
  const eccLaenge = ECC_PER_BLOCK[ver];
  const roh = Math.floor(rohModule(ver) / 8);
  const kurze = anzahlBloecke - (roh % anzahlBloecke);
  const kurzLaenge = Math.floor(roh / anzahlBloecke);
  const teiler = rsTeiler(eccLaenge);
  const bloecke = [];
  for (let i = 0, k = 0; i < anzahlBloecke; i++) {
    const stueck = daten.slice(k, k + kurzLaenge - eccLaenge + (i < kurze ? 0 : 1));
    k += stueck.length;
    const ecc = rsRest(stueck, teiler);
    if (i < kurze) stueck.push(0);
    bloecke.push(stueck.concat(ecc));
  }
  const codewoerter = [];
  for (let i = 0; i < bloecke[0].length; i++) {
    bloecke.forEach((b, j) => { if (i !== kurzLaenge - eccLaenge || j >= kurze) codewoerter.push(b[i]); });
  }

  // Funktionsmuster
  const modules = Array.from({ length: size }, () => new Array(size).fill(false));
  const funktion = Array.from({ length: size }, () => new Array(size).fill(false));
  const setze = (x, y, dunkel) => { modules[y][x] = dunkel; funktion[y][x] = true; };
  for (let i = 0; i < size; i++) { setze(6, i, i % 2 === 0); setze(i, 6, i % 2 === 0); }
  for (const [fx, fy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const x = fx + dx;
        const y = fy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) setze(x, y, d !== 2 && d !== 4);
      }
    }
  }
  const pos = ausrichtungsPositionen(ver, size);
  pos.forEach((px, i) => pos.forEach((py, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === pos.length - 1) || (i === pos.length - 1 && j === 0)) return;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setze(px + dx, py + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }));
  const formatZeichnen = (maske) => {
    const d = (FORMAT_M << 3) | maske;
    let rest = d;
    for (let i = 0; i < 10; i++) rest = (rest << 1) ^ ((rest >>> 9) * 0x537);
    const b = ((d << 10) | rest) ^ 0x5412;
    for (let i = 0; i <= 5; i++) setze(8, i, bit(b, i));
    setze(8, 7, bit(b, 6));
    setze(8, 8, bit(b, 7));
    setze(7, 8, bit(b, 8));
    for (let i = 9; i < 15; i++) setze(14 - i, 8, bit(b, i));
    for (let i = 0; i < 8; i++) setze(size - 1 - i, 8, bit(b, i));
    for (let i = 8; i < 15; i++) setze(8, size - 15 + i, bit(b, i));
    setze(8, size - 8, true);
  };
  formatZeichnen(0); // reserviert die Felder
  if (ver >= 7) {
    let rest = ver;
    for (let i = 0; i < 12; i++) rest = (rest << 1) ^ ((rest >>> 11) * 0x1f25);
    const b = (ver << 12) | rest;
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3);
      const c = Math.floor(i / 3);
      setze(a, c, bit(b, i));
      setze(c, a, bit(b, i));
    }
  }

  // Codewörter im Zickzack eintragen
  let i = 0;
  for (let rechts = size - 1; rechts >= 1; rechts -= 2) {
    if (rechts === 6) rechts = 5;
    for (let v = 0; v < size; v++) {
      for (let j = 0; j < 2; j++) {
        const x = rechts - j;
        const y = ((rechts + 1) & 2) === 0 ? size - 1 - v : v;
        if (!funktion[y][x] && i < codewoerter.length * 8) {
          modules[y][x] = bit(codewoerter[i >>> 3], 7 - (i & 7));
          i++;
        }
      }
    }
  }

  // Beste Maske wählen (geringste Strafpunkte)
  const MASKEN = [
    (x, y) => (x + y) % 2 === 0,
    (x, y) => y % 2 === 0,
    (x) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];
  const maskieren = (m) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!funktion[y][x] && MASKEN[m](x, y)) modules[y][x] = !modules[y][x];
  };
  let beste = 0;
  let bestePunkte = Infinity;
  for (let m = 0; m < 8; m++) {
    maskieren(m);
    formatZeichnen(m);
    const p = strafpunkte(modules, size);
    if (p < bestePunkte) { beste = m; bestePunkte = p; }
    maskieren(m); // XOR macht die Maske wieder rückgängig
  }
  maskieren(beste);
  formatZeichnen(beste);
  return { size, version: ver, mask: beste, modules };
}

function strafpunkte(m, size) {
  let p = 0;
  const zeile = (get) => {
    let lauf = 1;
    for (let i = 1; i <= size; i++) {
      if (i < size && get(i) === get(i - 1)) { lauf++; continue; }
      if (lauf >= 5) p += lauf - 2;
      lauf = 1;
    }
    // Muster wie im Suchmuster: 1011101 mit vier hellen Modulen davor oder danach
    for (let i = 0; i + 7 <= size; i++) {
      const muster = [1, 0, 1, 1, 1, 0, 1].every((b, k) => get(i + k) === Boolean(b));
      if (!muster) continue;
      const hell = (a, e) => { for (let k = a; k < e; k++) if (k >= 0 && k < size && get(k)) return false; return true; };
      if (hell(i - 4, i) || hell(i + 7, i + 11)) p += 40;
    }
  };
  let dunkel = 0;
  for (let y = 0; y < size; y++) zeile((x) => m[y][x]);
  for (let x = 0; x < size; x++) zeile((y) => m[y][x]);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (m[y][x]) dunkel++;
      if (x < size - 1 && y < size - 1 && m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3;
    }
  }
  const gesamt = size * size;
  p += (Math.ceil(Math.abs(dunkel * 20 - gesamt * 10) / gesamt) - 1) * 10;
  return p;
}

/** QR-Code als SVG mit vier Modulen Ruhezone; Farbe über currentColor, Hintergrund weiß. */
export function qrSvg(text, { titel = 'QR-Code' } = {}) {
  const { size, modules } = qrEncode(text);
  const rand = 4;
  const voll = size + 2 * rand;
  let pfad = '';
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (modules[y][x]) pfad += `M${x + rand},${y + rand}h1v1h-1z`;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<svg class="qr" viewBox="0 0 ${voll} ${voll}" role="img" shape-rendering="crispEdges"><title>${esc(titel)}</title><rect width="${voll}" height="${voll}" fill="#fff"/><path d="${pfad}" fill="#000"/></svg>`;
}
