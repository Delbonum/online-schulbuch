// Adas Suchbaum: Minimax (in der kompakten "Negamax"-Form).
//
// Ada spielt in Gedanken jede mögliche Zugfolge bis zum Spielende durch.
// Dabei nimmt sie an, dass beide Seiten immer ihren besten Zug wählen.
//
// Wert einer Stellung aus Sicht dessen, der am Zug ist:
//   > 0  gewinnt (je größer, desto schneller)
//   = 0  unentschieden
//   < 0  verliert (je kleiner, desto schneller)

export const WIN = 100;

// Ein Sieg in 3 Zügen ist weniger wert als ein Sieg in 1 Zug.
const shrink = (v) => (v > 0 ? v - 1 : v < 0 ? v + 1 : 0);

export function createSolver(game) {
  const memo = new Map();
  let nodes = 0;

  function value(state) {
    const k = game.key(state);
    const cached = memo.get(k);
    if (cached !== undefined) return cached;
    nodes++;
    const r = game.result(state);
    let v;
    if (r) {
      v = r.winner === null ? 0 : r.winner === game.toMove(state) ? WIN : -WIN;
    } else {
      v = -Infinity;
      for (const m of game.legalMoves(state)) {
        const cv = shrink(-value(game.play(state, m)));
        if (cv > v) v = cv;
      }
    }
    memo.set(k, v);
    return v;
  }

  // Bewertet jeden möglichen Zug aus Sicht des Spielers am Zug.
  function evaluate(state) {
    return game.legalMoves(state).map((move) => {
      const v = shrink(-value(game.play(state, move)));
      return { move, value: v, ...describe(v) };
    });
  }

  function bestMoves(state) {
    const evals = evaluate(state);
    const best = Math.max(...evals.map((e) => e.value));
    return { evals, best: evals.filter((e) => e.value === best) };
  }

  return {
    value,
    evaluate,
    bestMoves,
    get nodes() { return nodes; },
    get size() { return memo.size; },
  };
}

export function describe(v) {
  if (v === 0) return { outcome: 'draw', plies: null };
  return { outcome: v > 0 ? 'win' : 'loss', plies: WIN - Math.abs(v) };
}
