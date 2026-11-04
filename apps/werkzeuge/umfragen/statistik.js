// Kennzahlen für die Auswertung von Umfragen (ohne DOM, damit sie sich testen lassen).

/** Quantil mit linearer Interpolation (wie in Tabellenkalkulationen, QUANTIL.INKL). */
export function quantil(sortiert, p) {
  if (!sortiert.length) return null;
  const pos = (sortiert.length - 1) * p;
  const u = Math.floor(pos);
  const o = Math.ceil(pos);
  return sortiert[u] + (sortiert[o] - sortiert[u]) * (pos - u);
}

/**
 * Auswertung einer Skalenfrage.
 * @param {number[]} werte
 * @param {{min:number,max:number,step:number}} frage
 */
export function skala(werte, frage) {
  const n = werte.length;
  const sortiert = [...werte].sort((a, b) => a - b);
  const summe = werte.reduce((a, b) => a + b, 0);
  const mittel = n ? summe / n : null;
  const sd = n > 1 ? Math.sqrt(werte.reduce((a, w) => a + (w - mittel) ** 2, 0) / (n - 1)) : null;
  // Häufigkeiten: je möglichem Wert eine Säule, bei sehr feinen Skalen höchstens 20 Klassen
  const stufen = Math.round((frage.max - frage.min) / frage.step) + 1;
  const klassen = Math.min(stufen, 21);
  const breite = (frage.max - frage.min) / (klassen - 1 || 1);
  const haeufigkeit = new Array(klassen).fill(0);
  for (const w of werte) haeufigkeit[Math.min(klassen - 1, Math.max(0, Math.round((w - frage.min) / breite)))]++;
  const maxH = Math.max(0, ...haeufigkeit);
  const modi = maxH ? haeufigkeit.flatMap((h, i) => (h === maxH ? [frage.min + i * breite] : [])) : [];
  return {
    n,
    mittel,
    median: quantil(sortiert, 0.5),
    q1: quantil(sortiert, 0.25),
    q3: quantil(sortiert, 0.75),
    min: n ? sortiert[0] : null,
    max: n ? sortiert[n - 1] : null,
    sd,
    modi,
    klassen: haeufigkeit.map((h, i) => ({ wert: frage.min + i * breite, anzahl: h })),
  };
}

/**
 * Auswertung einer Auswahlfrage. Werte sind die Indizes der gewählten Vorgaben.
 * @param {number[]} werte
 * @param {{options:string[],correct?:number|null}} frage
 */
export function auswahl(werte, frage) {
  const n = werte.length;
  const anzahl = frage.options.map(() => 0);
  for (const w of werte) if (anzahl[w] !== undefined) anzahl[w]++;
  const maxA = Math.max(0, ...anzahl);
  const sortiert = [...werte].sort((a, b) => a - b);
  return {
    n,
    anzahl,
    anteil: anzahl.map((a) => (n ? a / n : 0)),
    haeufigste: maxA ? anzahl.flatMap((a, i) => (a === maxA ? [i] : [])) : [],
    richtig: frage.correct ?? null,
    anteilRichtig: frage.correct != null && n ? anzahl[frage.correct] / n : null,
    // Für Vorgaben mit Reihenfolge (nein … ja): mittlere Position, 1 = erste Vorgabe
    mittlerePosition: n ? werte.reduce((a, b) => a + b, 0) / n + 1 : null,
    medianPosition: n ? quantil(sortiert, 0.5) + 1 : null,
  };
}

/** Zahl im deutschen Format mit höchstens `stellen` Nachkommastellen. */
export function zahl(x, stellen = 1) {
  if (x === null || x === undefined || Number.isNaN(x)) return '–';
  return x.toLocaleString('de-DE', { maximumFractionDigits: stellen });
}

export function prozent(x) {
  return `${Math.round(x * 100)} %`;
}
