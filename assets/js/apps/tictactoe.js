import { createApp } from '../ui/app.js';
import { createTicTacToe, adaRules, ADA_RULES } from '../games/tictactoe.js';
import { tictactoeView } from '../ui/views/tictactoe-view.js';

createApp(document.getElementById('app'), {
  makeGame: () => createTicTacToe(),
  view: tictactoeView,
  settings: [{
    id: 'first',
    label: 'Wer beginnt?',
    value: 'human',
    options: [{ value: 'human', label: 'Du (X)' }, { value: 'ai', label: 'Die KI (X)' }],
  }],
  humanSide: (st) => (st.first === 'human' ? 0 : 1),
  ada: {
    modes: ['regeln', 'suchbaum'],
    rules: (game, state) => ({ lines: ADA_RULES, ...(state ? adaRules(state) : {}) }),
  },
  kai: { prefill: false },
  texts: { yourTurn: 'Du bist dran – klicke auf ein freies Feld.' },
});
