// Tic Tac Toe – Spiellogik und Adas Regelwerk (ohne DOM).
//
// Felder:  0 | 1 | 2
//          3 | 4 | 5
//          6 | 7 | 8
// Zustand: { b: '.........', turn: 0 | 1 }  – Spieler 0 = X (beginnt), 1 = O

export const SYMBOLS = ['X', 'O'];
export const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
export const CORNERS = [0, 2, 6, 8];
export const EDGES = [1, 3, 5, 7];
const OPPOSITE_CORNER = { 0: 8, 2: 6, 6: 2, 8: 0 };

// Die 8 Symmetrien des Quadrats (Drehungen und Spiegelungen), jeweils als
// Abbildung "Feld -> neues Feld".
const TRANSFORMS = (() => {
  const rot = (c) => (c % 3) * 3 + (2 - Math.floor(c / 3));
  const flip = (c) => Math.floor(c / 3) * 3 + (2 - (c % 3));
  const list = [];
  let t = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (let i = 0; i < 4; i++) {
    list.push(t);
    list.push(t.map(flip));
    t = t.map(rot);
  }
  return list;
})();

function transformBoard(b, t) {
  const out = new Array(9);
  for (let c = 0; c < 9; c++) out[t[c]] = b[c];
  return out.join('');
}

export function place(b, cell, symbol) {
  return b.slice(0, cell) + symbol + b.slice(cell + 1);
}

export function emptyCells(b) {
  const out = [];
  for (let c = 0; c < 9; c++) if (b[c] === '.') out.push(c);
  return out;
}

export function winnerLine(b) {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] !== '.' && b[a] === b[c] && b[a] === b[d]) return line;
  }
  return null;
}

// Felder, auf denen `symbol` sofort drei in einer Reihe hätte.
export function winningCells(b, symbol) {
  const cells = new Set();
  for (const line of LINES) {
    const own = line.filter((c) => b[c] === symbol).length;
    const free = line.filter((c) => b[c] === '.');
    if (own === 2 && free.length === 1) cells.add(free[0]);
  }
  return [...cells].sort((x, y) => x - y);
}

// Felder, auf denen `symbol` eine Gabel (zwei Drohungen gleichzeitig) bauen kann.
export function forkCells(b, symbol) {
  return emptyCells(b).filter((c) => winningCells(place(b, c, symbol), symbol).length >= 2);
}

export const CELL_NAMES = [
  'oben links', 'oben Mitte', 'oben rechts',
  'Mitte links', 'Mitte', 'Mitte rechts',
  'unten links', 'unten Mitte', 'unten rechts',
];

export function createTicTacToe() {
  const game = {
    id: 'tictactoe',
    settingsKey: '',
    initialState: () => ({ b: '.........', turn: 0 }),
    toMove: (s) => s.turn,
    legalMoves: (s) => (winnerLine(s.b) ? [] : emptyCells(s.b)),
    play: (s, m) => ({ b: place(s.b, m, SYMBOLS[s.turn]), turn: 1 - s.turn }),
    result(s) {
      const line = winnerLine(s.b);
      if (line) return { winner: SYMBOLS.indexOf(s.b[line[0]]), line };
      if (!s.b.includes('.')) return { winner: null };
      return null;
    },
    key: (s) => s.b,
    moveName: (m) => `Feld ${CELL_NAMES[m]}`,

    // Symmetrische Stellungen werden zu einer Schachtel zusammengefasst.
    canonical(s) {
      let best = null;
      let bestT = null;
      for (const t of TRANSFORMS) {
        const tb = transformBoard(s.b, t);
        if (best === null || tb < best) { best = tb; bestT = t; }
      }
      const inverse = new Array(9);
      bestT.forEach((to, from) => { inverse[to] = from; });
      // Züge, die in der kanonischen Stellung symmetrisch gleich sind, nur einmal.
      const stabilizers = TRANSFORMS.filter((t) => transformBoard(best, t) === best);
      const moves = emptyCells(best).filter((m) => stabilizers.every((t) => t[m] >= m));
      return { key: best, state: { b: best, turn: s.turn }, moves, fromCanon: (m) => inverse[m] };
    },
  };
  return game;
}

// ---------------------------------------------------------------------------
// Adas Regelwerk. Die Zeilen werden im Tool angezeigt und beim Nachdenken
// Schritt für Schritt hervorgehoben.

export const ADA_RULES = [
  'WENN ich mit einem Zug drei in einer Reihe schaffe:',
  '    setze dorthin und gewinne.',
  'SONST WENN mein Gegner mit einem Zug drei in einer Reihe schaffen könnte:',
  '    setze dorthin und blockiere ihn.',
  'SONST WENN ich eine Gabel bauen kann (zwei Drohungen auf einmal):',
  '    setze dorthin.',
  'SONST WENN mein Gegner im nächsten Zug eine Gabel bauen könnte:',
  '    WENN ich eine Drohung bauen kann, nach deren Abwehr er keine Gabel hat:',
  '        setze dorthin – er muss jetzt reagieren.',
  '    SONST:',
  '        setze auf sein Gabel-Feld.',
  'SONST WENN die Mitte frei ist:',
  '    setze in die Mitte.',
  'SONST WENN mein Gegner in einer Ecke steht und die Ecke gegenüber frei ist:',
  '    setze in die gegenüberliegende Ecke.',
  'SONST WENN eine Ecke frei ist:',
  '    setze in eine freie Ecke.',
  'SONST:',
  '    setze auf ein freies Randfeld.',
];

// Liefert { trace, candidates }.
// trace: Liste von { line, ok, cells } – ok=true: Bedingung erfüllt,
// ok=false: nicht erfüllt, action=true: diese Anweisung wird ausgeführt.
export function adaRules(state) {
  const b = state.b;
  const me = SYMBOLS[state.turn];
  const opp = SYMBOLS[1 - state.turn];
  const trace = [];
  const decide = (condLine, cells, actionLine, candidates = cells) => {
    trace.push({ line: condLine, ok: true, cells });
    trace.push({ line: actionLine, action: true, cells: candidates });
    return { trace, candidates };
  };

  const wins = winningCells(b, me);
  if (wins.length) return decide(0, wins, 1);
  trace.push({ line: 0, ok: false });

  const blocks = winningCells(b, opp);
  if (blocks.length) return decide(2, blocks, 3);
  trace.push({ line: 2, ok: false });

  const forks = forkCells(b, me);
  if (forks.length) return decide(4, forks, 5);
  trace.push({ line: 4, ok: false });

  const oppForks = forkCells(b, opp);
  if (oppForks.length) {
    trace.push({ line: 6, ok: true, cells: oppForks });
    const forcing = emptyCells(b).filter((c) => {
      const b2 = place(b, c, me);
      const threats = winningCells(b2, me);
      if (threats.length !== 1) return false;
      const b3 = place(b2, threats[0], opp);
      return winningCells(b3, opp).length < 2;
    });
    if (forcing.length) return decide(7, forcing, 8);
    trace.push({ line: 7, ok: false });
    trace.push({ line: 9, ok: true });
    trace.push({ line: 10, action: true, cells: oppForks });
    return { trace, candidates: oppForks };
  }
  trace.push({ line: 6, ok: false });

  if (b[4] === '.') return decide(11, [4], 12);
  trace.push({ line: 11, ok: false });

  const opposite = CORNERS.filter((c) => b[c] === opp && b[OPPOSITE_CORNER[c]] === '.').map((c) => OPPOSITE_CORNER[c]);
  if (opposite.length) return decide(13, opposite, 14);
  trace.push({ line: 13, ok: false });

  const corners = CORNERS.filter((c) => b[c] === '.');
  if (corners.length) return decide(15, corners, 16);
  trace.push({ line: 15, ok: false });

  const edges = EDGES.filter((c) => b[c] === '.');
  trace.push({ line: 17, ok: true });
  trace.push({ line: 18, action: true, cells: edges });
  return { trace, candidates: edges };
}
