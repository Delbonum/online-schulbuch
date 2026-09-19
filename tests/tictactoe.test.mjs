import test from 'node:test';
import assert from 'node:assert/strict';
import { createTicTacToe, adaRules } from '../assets/js/games/tictactoe.js';
import { createSolver } from '../assets/js/core/minimax.js';
import { MatchboxLearner } from '../assets/js/core/learner.js';
import { randomChoice } from '../assets/js/core/util.js';

const game = createTicTacToe();

// Spielt alle Partien durch: Gegner probiert jeden Zug, Ada jede ihrer Kandidaten.
function exploreAda(adaSide) {
  let games = 0;
  const losses = [];
  const walk = (s, path) => {
    const r = game.result(s);
    if (r) {
      games++;
      if (r.winner === 1 - adaSide) losses.push(path);
      return;
    }
    if (s.turn === adaSide) {
      const { candidates } = adaRules(s);
      assert.ok(candidates.length > 0, `keine Kandidaten bei ${s.b}`);
      for (const c of candidates) {
        assert.equal(s.b[c], '.', `Ada wählt belegtes Feld ${c} bei ${s.b}`);
        walk(game.play(s, c), [...path, c]);
      }
    } else {
      for (const m of game.legalMoves(s)) walk(game.play(s, m), [...path, m]);
    }
  };
  walk(game.initialState(), []);
  return { games, losses };
}

test('Ada (Regeln) verliert nie als O', () => {
  const { games, losses } = exploreAda(1);
  assert.ok(games > 0);
  assert.deepEqual(losses, []);
});

test('Ada (Regeln) verliert nie als X', () => {
  const { losses } = exploreAda(0);
  assert.deepEqual(losses, []);
});

test('Minimax: leeres Brett ist unentschieden', () => {
  const solver = createSolver(game);
  assert.equal(solver.value(game.initialState()), 0);
  assert.equal(solver.size, 5478);
});

test('Minimax erkennt Sofortgewinn', () => {
  const solver = createSolver(game);
  const s = { b: 'XX.OO....', turn: 0 };
  const { best } = solver.bestMoves(s);
  assert.deepEqual(best.map((e) => e.move), [2]);
  assert.equal(best[0].plies, 1);
});

test('Symmetrie: gedrehte Stellungen landen in derselben Schachtel', () => {
  const a = game.canonical({ b: 'X........', turn: 1 });
  const b = game.canonical({ b: '........X', turn: 1 });
  assert.equal(a.key, b.key);
  // Leeres Brett hat nur 3 verschiedene Züge: Ecke, Rand, Mitte
  assert.equal(game.canonical(game.initialState()).moves.length, 3);
});

test('Symmetrie: fromCanon liefert einen legalen Zug', () => {
  const s = { b: '..X.O....', turn: 0 };
  const c = game.canonical(s);
  for (const m of c.moves) {
    const real = c.fromCanon(m);
    assert.equal(s.b[real], '.');
    // Der echte Zug ergibt (bis auf Symmetrie) dieselbe Folgestellung.
    assert.equal(game.canonical(game.play(s, real)).key, game.canonical(game.play(c.state, m)).key);
  }
});

function trainAgainstRandom(mode, games, rng) {
  const learner = new MatchboxLearner(game, { mode });
  let lateLosses = 0;
  for (let i = 0; i < games; i++) {
    learner.startGame();
    let s = game.initialState();
    let resigned = false;
    while (!game.result(s)) {
      if (s.turn === 1) {
        const c = learner.choose(s, rng);
        if (c.resigned) { resigned = true; break; }
        s = game.play(s, c.move);
      } else {
        s = game.play(s, randomChoice(game.legalMoves(s), rng));
      }
    }
    const r = game.result(s);
    const outcome = resigned || r.winner === 0 ? 'loss' : r.winner === 1 ? 'win' : 'draw';
    learner.endGame(outcome);
    if (i >= games - 500 && outcome === 'loss') lateLosses++;
  }
  return { learner, lateLosses };
}

function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

test('Kai (Streichen) verliert nach Training kaum noch gegen Zufall', () => {
  const { learner, lateLosses } = trainAgainstRandom('streichen', 4000, seeded(1));
  assert.ok(lateLosses < 10, `noch ${lateLosses} Niederlagen in den letzten 500 Spielen`);
  // Der erste Zug darf nie komplett gestrichen werden (Unentschieden ist immer möglich).
  assert.ok(learner.stats().boxes > 50);
});

test('Kai (Perlen) wird deutlich besser', () => {
  const { learner } = trainAgainstRandom('perlen', 4000, seeded(2));
  const o = learner.outcomes;
  const lossRate = (arr) => arr.filter((x) => x === 'loss').length / arr.length;
  const before = lossRate(o.slice(0, 500));
  const after = lossRate(o.slice(-500));
  assert.ok(after < before * 0.7, `vorher ${before}, nachher ${after}`);
});

test('Streichen: leere Schachtel streicht auch den Zug davor', () => {
  const learner = new MatchboxLearner(game, { mode: 'streichen', symmetry: false });
  // Stellung, in der O (Kai) nur noch einen Zug hat.
  const s1 = { b: 'XOXXOOOX.', turn: 1 };
  learner.getBox(s1).box.moves.forEach((e) => { e.struck = false; });
  const s0 = { b: 'XOXXOO.X.', turn: 1 }; // hypothetischer Vorgänger
  learner.startGame();
  learner.choose(s0, () => 0);
  learner.choose(s1, () => 0);
  const changes = learner.endGame('loss');
  assert.equal(changes.length, 2);
  assert.equal(changes[1].chained, true);
});
