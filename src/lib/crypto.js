// Klassische Verschlüsselungsverfahren und Hilfsfunktionen für die Kryptoanalyse.
// Alle Funktionen arbeiten mit dem lateinischen Alphabet A–Z; andere Zeichen bleiben erhalten,
// sofern nicht anders angegeben.

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Buchstabenhäufigkeiten im Deutschen in Prozent, absteigend sortiert. */
export const GERMAN_FREQUENCIES = {
  E: 17.4,
  N: 9.78,
  I: 7.55,
  S: 7.27,
  R: 7.0,
  A: 6.51,
  T: 6.15,
  D: 5.08,
  H: 4.76,
  U: 4.35,
  L: 3.44,
  C: 3.06,
  G: 3.01,
  M: 2.53,
  O: 2.51,
  B: 1.89,
  W: 1.89,
  F: 1.66,
  K: 1.21,
  Z: 1.13,
  P: 0.79,
  V: 0.67,
  J: 0.27,
  Y: 0.04,
  X: 0.03,
  Q: 0.02,
};

export const GERMAN_BY_FREQUENCY = Object.keys(GERMAN_FREQUENCIES).join("");

export const mod = (n, m) => ((n % m) + m) % m;

export const letterIndex = (letter) => ALPHABET.indexOf(letter.toUpperCase());

export const letterAt = (index) => ALPHABET[mod(index, 26)];

/** Nur Großbuchstaben A–Z behalten. */
export const lettersOnly = (text) => text.toUpperCase().replace(/[^A-Z]/g, "");

/** Verschiebt jeden Buchstaben um `shift` Stellen; Groß-/Kleinschreibung bleibt erhalten. */
export function caesar(text, shift) {
  return text.replace(/[A-Za-z]/g, (char) => {
    const base = char <= "Z" ? 65 : 97;
    return String.fromCharCode(base + mod(char.charCodeAt(0) - base + shift, 26));
  });
}

/** Geheimtextalphabet einer Verschiebung, z. B. shift 3 → "DEFG…ABC". */
export const shiftedAlphabet = (shift) => caesar(ALPHABET, shift);

/**
 * Ersetzungsverfahren: `key` ist das Geheimtextalphabet (26 verschiedene Buchstaben).
 * Buchstaben ohne Zuordnung bleiben unverändert.
 */
export function substitute(text, key, decrypt = false) {
  const from = decrypt ? key : ALPHABET;
  const to = decrypt ? ALPHABET : key;
  return text.toUpperCase().replace(/[A-Z]/g, (char) => {
    const i = from.indexOf(char);
    return i === -1 || !to[i] ? char : to[i];
  });
}

/** Schlüsseleingabe bereinigen: nur Buchstaben, jeder höchstens einmal. */
export const normalizeSubstitutionKey = (value) => [...new Set(lettersOnly(value))].join("");

/**
 * Vigenère-Verfahren. Nicht-Buchstaben werden entfernt, damit Schlüssel und Text
 * eindeutig untereinanderstehen.
 */
export function vigenere(text, key, decrypt = false) {
  const cleanKey = lettersOnly(key);
  if (!cleanKey) return "";
  const direction = decrypt ? -1 : 1;
  return [...lettersOnly(text)]
    .map((char, i) => letterAt(letterIndex(char) + direction * letterIndex(cleanKey[i % cleanKey.length])))
    .join("");
}

/** Schlüssel so oft wiederholen, dass er so lang ist wie der Text. */
export function repeatKey(key, length) {
  const cleanKey = lettersOnly(key);
  if (!cleanKey) return "";
  return cleanKey.repeat(Math.ceil(length / cleanKey.length)).slice(0, length);
}

/** Absolute Häufigkeit jedes vorkommenden Buchstabens. */
export function letterCounts(text) {
  const counts = {};
  for (const char of lettersOnly(text)) {
    counts[char] = (counts[char] || 0) + 1;
  }
  return counts;
}

/** [[Buchstabe, Anzahl], …] absteigend nach Häufigkeit, bei Gleichstand alphabetisch. */
export const sortedCounts = (counts) => Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

export const mostFrequentLetter = (text) => sortedCounts(letterCounts(text))[0]?.[0] ?? null;

/**
 * Vermutete Verschiebezahl, wenn der häufigste Geheimtextbuchstabe für "E" steht.
 */
export function guessCaesarShift(text) {
  const top = mostFrequentLetter(text);
  return top === null ? null : mod(letterIndex(top) - letterIndex("E"), 26);
}

/**
 * Erste Zuordnung für das Ersetzungsverfahren: häufigster Geheimtextbuchstabe → E,
 * zweithäufigster → N usw. Ergebnis: Array mit Klartextbuchstaben, Index = Geheimtextbuchstabe.
 */
export function frequencyMapping(text) {
  const mapping = Array(26).fill("");
  sortedCounts(letterCounts(text)).forEach(([cipherLetter], rank) => {
    mapping[letterIndex(cipherLetter)] = GERMAN_BY_FREQUENCY[rank] ?? "";
  });
  return mapping;
}

/** Wendet eine (teilweise) Zuordnung Geheimtext → Klartext an. */
export function applyMapping(text, mapping) {
  return text.toUpperCase().replace(/[A-Z]/g, (char) => mapping[letterIndex(char)] || char);
}

/** Text in `length` Kolonnen aufteilen (1., 1+length., … Buchstabe usw.). */
export function splitColumns(text, length) {
  const columns = Array.from({ length }, () => "");
  [...lettersOnly(text)].forEach((char, i) => {
    columns[i % length] += char;
  });
  return columns;
}

/**
 * Kasiski-Test: gleiche Buchstabengruppen und ihre Abstände.
 * Liefert für jede Wiederholung die Positionen (ab 0) und den Abstand zum vorherigen Vorkommen.
 */
export function repeatedSequences(text, size = 3) {
  const clean = lettersOnly(text);
  const positions = {};
  for (let i = 0; i + size <= clean.length; i++) {
    const sequence = clean.slice(i, i + size);
    (positions[sequence] ||= []).push(i);
  }
  const result = [];
  for (const [sequence, list] of Object.entries(positions)) {
    for (let i = 1; i < list.length; i++) {
      result.push({ sequence, first: list[i - 1], second: list[i], distance: list[i] - list[i - 1] });
    }
  }
  return result.sort((a, b) => a.first - b.first);
}

export function gcd(a, b) {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

/**
 * Schnelle modulare Exponentiation (Square-and-Multiply).
 * Exakt für Moduln bis 94 906 265, weil Zwischenergebnisse unter 2^53 bleiben müssen.
 */
export function modPow(base, exponent, modulus) {
  if (modulus === 1) return 0;
  let result = 1;
  let b = mod(base, modulus);
  let e = exponent;
  while (e > 0) {
    if (e % 2 === 1) result = (result * b) % modulus;
    b = (b * b) % modulus;
    e = Math.floor(e / 2);
  }
  return result;
}

export function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let d = 2; d * d <= n; d++) {
    if (n % d === 0) return false;
  }
  return true;
}

/**
 * Regel für die progressive Caesar-Chiffre auswerten, z. B. "+1", "*2", "*3-1" oder "n*2+1".
 * Erlaubt sind nur Zahlen, n, + - * / und Klammern – es wird kein Code ausgeführt.
 * Liefert eine Funktion n → nächste Verschiebezahl oder wirft einen Fehler.
 */
export function parseShiftRule(rule) {
  let source = rule.replace(/\s+/g, "");
  if (!source) throw new Error("Leere Regel");
  if (/^[+\-*/]/.test(source)) source = "n" + source;
  if (!/^[0-9n+\-*/()]+$/.test(source)) throw new Error("Ungültige Zeichen");

  const tokens = source.match(/\d+|n|[+\-*/()]/g);
  let pos = 0;
  // Rekursiver Abstieg: expr = term (('+'|'-') term)*, term = factor (('*'|'/') factor)*
  const parseExpr = () => {
    let node = parseTerm();
    while (tokens[pos] === "+" || tokens[pos] === "-") {
      const op = tokens[pos++];
      const left = node;
      const right = parseTerm();
      node = op === "+" ? (n) => left(n) + right(n) : (n) => left(n) - right(n);
    }
    return node;
  };
  const parseTerm = () => {
    let node = parseFactor();
    while (tokens[pos] === "*" || tokens[pos] === "/") {
      const op = tokens[pos++];
      const left = node;
      const right = parseFactor();
      node = op === "*" ? (n) => left(n) * right(n) : (n) => Math.trunc(left(n) / right(n));
    }
    return node;
  };
  const parseFactor = () => {
    const token = tokens[pos++];
    if (token === "n") return (n) => n;
    if (token === "-") {
      const inner = parseFactor();
      return (n) => -inner(n);
    }
    if (token === "(") {
      const inner = parseExpr();
      if (tokens[pos++] !== ")") throw new Error("Klammer fehlt");
      return inner;
    }
    if (token !== undefined && /^\d+$/.test(token)) {
      const value = Number(token);
      return () => value;
    }
    throw new Error("Unerwartetes Ende");
  };

  const fn = parseExpr();
  if (pos !== tokens.length) throw new Error("Ungültige Regel");
  return (n) => {
    const value = fn(n);
    if (!Number.isFinite(value)) throw new Error("Division durch 0");
    return mod(value, 26);
  };
}

/** Progressive Caesar-Chiffre: liefert Geheimtext und die verwendete Verschiebezahl je Zeichen. */
export function progressiveCaesar(text, start, nextShift, decrypt = false) {
  let shift = mod(start, 26);
  const shifts = [];
  const result = [...text.toUpperCase()]
    .map((char) => {
      if (!ALPHABET.includes(char)) {
        shifts.push(null);
        return char;
      }
      shifts.push(shift);
      const out = letterAt(letterIndex(char) + (decrypt ? -shift : shift));
      shift = nextShift(shift);
      return out;
    })
    .join("");
  return { result, shifts };
}

/** Alle Primitivwurzeln (Erzeuger) modulo einer Primzahl p. */
export function primitiveRoots(p) {
  if (!isPrime(p)) return [];
  const roots = [];
  for (let g = 2; g < p; g++) {
    const seen = new Set();
    let value = 1;
    for (let i = 1; i < p; i++) {
      value = (value * g) % p;
      seen.add(value);
    }
    if (seen.size === p - 1) roots.push(g);
  }
  return p === 2 ? [1] : roots;
}

/** Zwischenschritte von g^x mod p durch wiederholtes Multiplizieren: [g¹ mod p, g² mod p, …]. */
export function powerSteps(g, x, p) {
  const steps = [];
  let value = 1 % p;
  for (let i = 1; i <= x; i++) {
    value = (value * mod(g, p)) % p;
    steps.push(value);
  }
  return steps;
}
