// NIM (Streichholz-Variante mit einem Haufen) – Spiellogik und Adas Regel.
//
// Auf dem Tisch liegen n Hölzer. Wer am Zug ist, nimmt 1 bis maxTake Hölzer.
// misere = true:  Wer das letzte Holz nimmt, verliert.
// misere = false: Wer das letzte Holz nimmt, gewinnt.
// Zustand: { n, turn } – Spieler 0 beginnt.

export function createNim({ sticks = 15, maxTake = 3, misere = true } = {}) {
  const game = {
    id: 'nim',
    settings: { sticks, maxTake, misere },
    settingsKey: `${sticks}-${maxTake}-${misere ? 'm' : 'n'}`,
    initialState: () => ({ n: sticks, turn: 0 }),
    toMove: (s) => s.turn,
    legalMoves(s) {
      const moves = [];
      for (let k = 1; k <= Math.min(maxTake, s.n); k++) moves.push(k);
      return moves;
    },
    play: (s, k) => ({ n: s.n - k, turn: 1 - s.turn }),
    // Bei n = 0 hat der Spieler, der zuletzt gezogen hat (1 - turn), das letzte Holz genommen.
    result: (s) => (s.n === 0 ? { winner: misere ? s.turn : 1 - s.turn } : null),
    key: (s) => String(s.n),
    moveName: (k) => (k === 1 ? '1 Holz nehmen' : `${k} Hölzer nehmen`),
    // Alle Stellungen, in denen Kai am Zug sein kann (für die Schachteln).
    aiStates: () => {
      const out = [];
      for (let n = sticks; n >= 1; n--) out.push({ n, turn: 1 });
      return out;
    },
    // Zielzahlen: Wer dem Gegner eine solche Anzahl hinterlässt, gewinnt.
    isTarget: (n) => (misere ? (n - 1) % (maxTake + 1) === 0 : n % (maxTake + 1) === 0),
  };
  return game;
}

export function adaRuleLines(game, n) {
  const { maxTake, misere } = game.settings;
  const m = maxTake + 1;
  const targets = [];
  for (let t = misere ? 1 : 0; t <= game.settings.sticks; t += m) targets.push(t);
  const r = n == null ? '?' : misere ? (n - 1) % m : n % m;
  return [
    `Zähle die Hölzer, die noch übrig sind:  n = ${n ?? '?'}`,
    misere
      ? `Berechne den Rest  r = (n − 1) mod ${m}  →  r = ${r}`
      : `Berechne den Rest  r = n mod ${m}  →  r = ${r}`,
    'WENN r > 0:',
    `    nimm r Hölzer. Dann bleibt eine Zielzahl (${targets.join(', ')}) für den Gegner.`,
    'SONST:',
    '    ich stehe selbst auf einer Zielzahl – nimm 1 Holz und hoffe auf einen Fehler.',
  ];
}

export function adaRules(game, state) {
  const { maxTake, misere } = game.settings;
  const m = maxTake + 1;
  const r = misere ? (state.n - 1) % m : state.n % m;
  const trace = [
    { line: 0, ok: true },
    { line: 1, ok: true },
  ];
  if (r > 0) {
    trace.push({ line: 2, ok: true });
    trace.push({ line: 3, action: true, cells: [r] });
    return { trace, candidates: [r], lines: adaRuleLines(game, state.n) };
  }
  trace.push({ line: 2, ok: false });
  trace.push({ line: 4, ok: true });
  trace.push({ line: 5, action: true, cells: [1] });
  return { trace, candidates: [1], lines: adaRuleLines(game, state.n) };
}
