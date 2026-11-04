// Wortwolke ohne DOM (testbar): Begriffe zählen und auf einer Spirale ohne Überlappung anordnen.

/** Fasst Begriffe ohne Rücksicht auf Groß-/Kleinschreibung zusammen; angezeigt wird die häufigste Schreibweise. */
export function zaehleWoerter(liste) {
  const gruppen = new Map();
  for (const roh of liste) {
    const text = String(roh).trim().replace(/\s+/g, ' ');
    if (!text) continue;
    const schluessel = text.toLowerCase();
    const g = gruppen.get(schluessel) ?? { schluessel, anzahl: 0, formen: new Map() };
    g.anzahl++;
    g.formen.set(text, (g.formen.get(text) ?? 0) + 1);
    gruppen.set(schluessel, g);
  }
  return [...gruppen.values()]
    .map((g) => ({ schluessel: g.schluessel, anzahl: g.anzahl, text: [...g.formen].sort((a, b) => b[1] - a[1])[0][0] }))
    .sort((a, b) => b.anzahl - a.anzahl || a.text.localeCompare(b.text, 'de'));
}

/**
 * Legt die Begriffe (häufigste zuerst) auf eine Spirale, bis keiner einen anderen überlappt.
 * @param {{text:string, anzahl:number}[]} woerter  absteigend nach Anzahl sortiert
 * @param {(text:string, groesse:number) => number} breite  misst die Textbreite in Pixeln
 * @returns {{teile: object[], box: {x:number,y:number,w:number,h:number}}}
 */
export function wolkeLayout(woerter, breite, { min = 18, max = 84 } = {}) {
  const liste = woerter.slice(0, 120);
  const hoch = liste[0]?.anzahl ?? 1;
  const tief = liste[liste.length - 1]?.anzahl ?? 1;
  const groesse = (a) => (hoch === tief ? (liste.length === 1 ? max : (min + max) / 2) : min + ((Math.sqrt(a) - Math.sqrt(tief)) / (Math.sqrt(hoch) - Math.sqrt(tief))) * (max - min));
  const teile = [];
  const ueberlappt = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (const w of liste) {
    const g = Math.round(groesse(w.anzahl));
    const bw = breite(w.text, g) + g * 0.3;
    const bh = g * 1.05;
    for (let t = 0; t < 6000; t++) {
      const winkel = t * 0.3;
      const radius = 1.6 * winkel;
      const box = { x: Math.cos(winkel) * radius * 1.7 - bw / 2, y: Math.sin(winkel) * radius - bh / 2, w: bw, h: bh };
      if (!teile.some((p) => ueberlappt(p, box))) {
        teile.push({ ...box, text: w.text, schluessel: w.schluessel, anzahl: w.anzahl, groesse: g });
        break;
      }
    }
  }
  if (!teile.length) return { teile, box: { x: 0, y: 0, w: 1, h: 1 } };
  const x = Math.min(...teile.map((p) => p.x));
  const y = Math.min(...teile.map((p) => p.y));
  return { teile, box: { x, y, w: Math.max(...teile.map((p) => p.x + p.w)) - x, h: Math.max(...teile.map((p) => p.y + p.h)) - y } };
}
