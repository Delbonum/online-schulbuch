// Bauernschach (Hexapawn) auf einem 3×3-Brett – Spiellogik (ohne DOM).
//
// Felder:  0 | 1 | 2     Reihe 0: Startreihe Schwarz (B)
//          3 | 4 | 5
//          6 | 7 | 8     Reihe 2: Startreihe Weiß (W)
//
// Weiß (Spieler 0) beginnt und zieht nach oben, Schwarz (Spieler 1) nach unten.
// Ein Bauer zieht ein Feld geradeaus auf ein freies Feld oder schlägt schräg
// nach vorne einen gegnerischen Bauern.
// Gewonnen hat, wer die gegenüberliegende Grundreihe erreicht, alle
// gegnerischen Bauern schlägt oder den Gegner zugunfähig macht.
// Zug: String "von-nach", z. B. "7-4".

export const PIECES = ['W', 'B'];
const DIR = [-1, 1];
const mirrorCell = (c) => Math.floor(c / 3) * 3 + (2 - (c % 3));
const mirrorBoard = (b) => [0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => b[mirrorCell(c)]).join('');
const mirrorMove = (m) => m.split('-').map((c) => mirrorCell(Number(c))).join('-');

export const parseMove = (m) => m.split('-').map(Number);
const COLS = 'abc';
export const cellName = (c) => `${COLS[c % 3]}${3 - Math.floor(c / 3)}`;

function movesFor(b, turn) {
  const me = PIECES[turn];
  const opp = PIECES[1 - turn];
  const moves = [];
  for (let c = 0; c < 9; c++) {
    if (b[c] !== me) continue;
    const r = Math.floor(c / 3) + DIR[turn];
    const col = c % 3;
    if (r < 0 || r > 2) continue;
    if (b[r * 3 + col] === '.') moves.push(`${c}-${r * 3 + col}`);
    for (const dc of [-1, 1]) {
      const nc = col + dc;
      if (nc >= 0 && nc <= 2 && b[r * 3 + nc] === opp) moves.push(`${c}-${r * 3 + nc}`);
    }
  }
  return moves;
}

function result(s) {
  const b = s.b;
  if (b.slice(0, 3).includes('W')) return { winner: 0, reason: 'goal' };
  if (b.slice(6, 9).includes('B')) return { winner: 1, reason: 'goal' };
  if (!b.includes(PIECES[s.turn])) return { winner: 1 - s.turn, reason: 'captured' };
  if (movesFor(b, s.turn).length === 0) return { winner: 1 - s.turn, reason: 'blocked' };
  return null;
}

export function createHexapawn() {
  const game = {
    id: 'hexapawn',
    settingsKey: '',
    initialState: () => ({ b: 'BBB...WWW', turn: 0 }),
    toMove: (s) => s.turn,
    legalMoves: (s) => (result(s) ? [] : movesFor(s.b, s.turn)),
    play(s, m) {
      const [from, to] = parseMove(m);
      const arr = s.b.split('');
      arr[to] = arr[from];
      arr[from] = '.';
      return { b: arr.join(''), turn: 1 - s.turn };
    },
    result,
    key: (s) => s.b + s.turn,
    moveName(m, s) {
      const [from, to] = parseMove(m);
      const capture = s && s.b[to] !== '.';
      return `${cellName(from)} ${capture ? '×' : '→'} ${cellName(to)}`;
    },

    // Spiegelbildliche Stellungen (links/rechts) teilen sich eine Schachtel.
    canonical(s) {
      const mb = mirrorBoard(s.b);
      const mirrored = mb < s.b;
      const cb = mirrored ? mb : s.b;
      const state = { b: cb, turn: s.turn };
      let moves = movesFor(cb, s.turn);
      if (s.b === mb) {
        // Symmetrische Stellung: gespiegelte Züge sind gleichwertig.
        moves = moves.filter((m) => m <= mirrorMove(m));
      }
      return {
        key: cb + s.turn,
        state,
        moves: result(state) ? [] : moves,
        fromCanon: (m) => (mirrored ? mirrorMove(m) : m),
      };
    },

    // Alle erreichbaren Stellungen, in denen Schwarz am Zug ist.
    aiStates() {
      const seen = new Map();
      const walk = (s, depth) => {
        const k = game.key(s);
        if (seen.has(k) || result(s)) return;
        seen.set(k, { s, depth });
        for (const m of movesFor(s.b, s.turn)) walk(game.play(s, m), depth + 1);
      };
      walk(game.initialState(), 0);
      return [...seen.values()]
        .filter((e) => e.s.turn === 1)
        .sort((a, b) => a.depth - b.depth)
        .map((e) => e.s);
    },
  };
  return game;
}
