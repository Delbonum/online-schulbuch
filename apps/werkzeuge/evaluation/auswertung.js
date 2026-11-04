// Auswertung einer Evaluation (ohne DOM, testbar). Antworten kommen als ganze Bögen: {Frage-ID: Wert oder Text}.
// Auswahl-Antworten zählen als Stufe 1 … n (erste Vorgabe = 1), Skalen mit ihrem Wert. Umgepolte Aussagen
// (reverse) gehen gespiegelt in die Skala ein. Skalenwert einer Person = Mittelwert ihrer beantworteten Aussagen.

import { quantil } from '../umfragen/statistik.js';

/** Zahlenwert einer Antwort (Stufe 1 … n bzw. Skalenwert), optional umgepolt */
export function wert(frage, roh, umpolen = false) {
  if (typeof roh !== 'number') return null;
  if (frage.type === 'choice') {
    const n = frage.options.length;
    return umpolen && frage.reverse ? n - roh : roh + 1;
  }
  if (frage.type === 'scale') return umpolen && frage.reverse ? frage.min + frage.max - roh : roh;
  return null;
}

/** Kennzahlen wie in der Auswertungsmaske: Median, Mittelwert, Standardabweichung (Grundgesamtheit), Min, Max */
export function kennzahlen(werte) {
  const n = werte.length;
  if (!n) return { n: 0, mittel: null, median: null, sd: null, min: null, max: null };
  const s = [...werte].sort((a, b) => a - b);
  const mittel = werte.reduce((a, b) => a + b, 0) / n;
  return {
    n,
    mittel,
    median: quantil(s, 0.5),
    sd: Math.sqrt(werte.reduce((a, w) => a + (w - mittel) ** 2, 0) / n),
    min: s[0],
    max: s[n - 1],
  };
}

/** Skalen (Dimensionen): Reihenfolge und Hinweise aus den Einstellungen, weitere aus den Fragen */
export function skalen(fragen, boegen, dimensionen = []) {
  const namen = [...dimensionen.map((d) => d.name)];
  for (const f of fragen) if (f.dimension && !namen.includes(f.dimension)) namen.push(f.dimension);
  return namen.map((name) => {
    const info = dimensionen.find((d) => d.name === name) ?? { name, group: '', hint: '' };
    const items = fragen.filter((f) => f.dimension === name && (f.type === 'choice' || f.type === 'scale'));
    const personen = boegen.map((b) => {
      const w = items.map((f) => wert(f, b[f.id], true)).filter((x) => x !== null);
      return w.length ? w.reduce((a, c) => a + c, 0) / w.length : null;
    }).filter((x) => x !== null);
    const bereich = items.length ? [Math.min(...items.map((f) => wert(f, f.type === 'choice' ? 0 : f.min))), Math.max(...items.map((f) => wert(f, f.type === 'choice' ? f.options.length - 1 : f.max)))] : [1, 4];
    return { ...info, items: items.length, bereich, ...kennzahlen(personen) };
  }).filter((s) => s.items > 0);
}

/** Einzelne Aussagen: Kennzahlen (ungepolt, wie angekreuzt) und Häufigkeit je Stufe */
export function aussagen(fragen, boegen) {
  return fragen.filter((f) => f.type === 'choice' || f.type === 'scale').map((f) => {
    const werte = boegen.map((b) => wert(f, b[f.id])).filter((x) => x !== null);
    const verteilung = f.type === 'choice' ? f.options.map((_, i) => werte.filter((w) => w === i + 1).length) : null;
    return { frage: f, verteilung, ...kennzahlen(werte) };
  });
}

/** Freitexte je Frage (Reihenfolge wie geliefert – der Server mischt die Bögen) */
export function freitexte(fragen, boegen) {
  return fragen.filter((f) => f.type === 'text').map((f) => ({ frage: f, texte: boegen.map((b) => b[f.id]).filter((t) => typeof t === 'string' && t.trim()) }));
}

/** Rohdaten als CSV für Tabellenkalkulationen (Semikolon, Dezimalkomma); Spalten = Kürzel der Fragen + Skalen */
export function csv(fragen, boegen, dimensionen = []) {
  const sk = skalen(fragen, boegen, dimensionen).map((s) => s.name);
  const feld = (x) => {
    if (x === null || x === undefined) return '';
    if (typeof x === 'number') return String(Math.round(x * 1000) / 1000).replace('.', ',');
    return `"${String(x).replace(/"/g, '""')}"`;
  };
  const kopf = ['Bogen', ...fragen.map((f) => f.id), ...sk.map((n) => `Skala: ${n}`)];
  const zeilen = boegen.map((b, i) => {
    const skalenwerte = sk.map((name) => {
      const w = fragen.filter((f) => f.dimension === name).map((f) => wert(f, b[f.id], true)).filter((x) => x !== null);
      return w.length ? w.reduce((a, c) => a + c, 0) / w.length : null;
    });
    return [i + 1, ...fragen.map((f) => (f.type === 'text' ? b[f.id] ?? '' : wert(f, b[f.id]))), ...skalenwerte].map(feld).join(';');
  });
  const legende = fragen.map((f) => `${feld(f.id)};${feld(f.text)}${f.reverse ? ';"umgepolt"' : ''}`);
  return `﻿${[kopf.map(feld).join(';'), ...zeilen, '', '"Kürzel";"Aussage"', ...legende].join('\r\n')}\r\n`;
}
