import test from 'node:test';
import assert from 'node:assert/strict';
import { createNim, adaRules as nimRules } from '../assets/js/games/nim.js';
import { createHexapawn } from '../assets/js/games/hexapawn.js';
import { createSolver } from '../assets/js/core/minimax.js';
import { MatchboxLearner } from '../assets/js/core/learner.js';
import { randomChoice } from '../assets/js/core/util.js';

test('NIM: Adas Regel stimmt mit Minimax überein (alle Varianten)', () => {
  for (const misere of [true, false]) {
    for (const maxTake of [2, 3, 4]) {
      const game = createNim({ sticks: 21, maxTake, misere });
      const solver = createSolver(game);
      for (let n = 1; n <= 21; n++) {
        const s = { n, turn: 0 };
        const winning = solver.value(s) > 0;
        const { candidates } = nimRules(game, s);
        assert.equal(winning, !game.isTarget(n), `n=${n} maxTake=${maxTake} misere=${misere}`);
        if (winning) {
          const after = solver.value(game.play(s, candidates[0]));
          assert.ok(after < 0, `Adas Zug bei n=${n} ist nicht optimal`);
        }
      }
    }
  }
});

test('NIM: Ergebnis bei n = 0', () => {
  const m = createNim({ misere: true });
  // Spieler 0 hat das letzte Holz genommen -> jetzt ist 1 am Zug -> 1 gewinnt
  assert.equal(m.result({ n: 0, turn: 1 }).winner, 1);
  const n = createNim({ misere: false });
  assert.equal(n.result({ n: 0, turn: 1 }).winner, 0);
});

const hp = createHexapawn();

test('Bauernschach: Startzüge und Regeln', () => {
  const s = hp.initialState();
  assert.deepEqual(hp.legalMoves(s).sort(), ['6-3', '7-4', '8-5']);
  // Weiß erreicht die Grundreihe
  assert.equal(hp.result({ b: 'W.B.B....', turn: 1 }).winner, 0);
  // Schlagen schräg
  const s2 = { b: 'B.B.B.WW.', turn: 0 };
  assert.ok(!hp.legalMoves({ b: 'BBB.W.W.W', turn: 1 }).includes('1-4'), 'geradeaus blockiert');
  assert.ok(hp.legalMoves({ b: 'BBB.W.W.W', turn: 1 }).includes('0-4'), 'schräg schlagen');
  assert.ok(hp.result(s2) === null);
});

test('Bauernschach: Schwarz gewinnt bei perfektem Spiel', () => {
  const solver = createSolver(hp);
  assert.ok(solver.value(hp.initialState()) < 0);
});

test('Bauernschach: 19 Schachteln mit, 37 ohne Spiegel-Symmetrie', () => {
  const learner = new MatchboxLearner(hp, { mode: 'streichen', symmetry: true });
  learner.prefill(hp.aiStates());
  assert.equal(learner.boxes.size, 19);
  const plain = new MatchboxLearner(hp, { symmetry: false });
  plain.prefill(hp.aiStates());
  assert.equal(plain.boxes.size, 37);
});

test('Bauernschach: Kai lernt, gegen Zufall kaum noch zu verlieren', () => {
  const learner = new MatchboxLearner(hp, { mode: 'streichen' });
  learner.prefill(hp.aiStates());
  for (let i = 0; i < 400; i++) {
    learner.startGame();
    let s = hp.initialState();
    let resigned = false;
    while (!hp.result(s)) {
      if (s.turn === 1) {
        const c = learner.choose(s);
        if (c.resigned) { resigned = true; break; }
        assert.ok(hp.legalMoves(s).includes(c.move), 'Kai macht einen illegalen Zug');
        s = hp.play(s, c.move);
      } else {
        s = hp.play(s, randomChoice(hp.legalMoves(s)));
      }
    }
    learner.endGame(resigned || hp.result(s).winner === 0 ? 'loss' : 'win');
  }
  const last = learner.outcomes.slice(-100);
  assert.equal(last.filter((o) => o === 'loss').length, 0);
});
