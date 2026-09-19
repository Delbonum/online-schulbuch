import { createApp } from '../ui/app.js';
import { createNim, adaRules, adaRuleLines } from '../games/nim.js';
import { nimView } from '../ui/views/nim-view.js';

createApp(document.getElementById('app'), {
  makeGame: (st) => createNim({ sticks: st.sticks, maxTake: st.maxTake, misere: st.misere }),
  view: nimView,
  settings: [
    {
      id: 'sticks', label: 'Hölzer', value: 15, resetsKai: true,
      options: [7, 9, 10, 11, 12, 13, 15, 17, 21].map((n) => ({ value: n, label: String(n) })),
    },
    {
      id: 'maxTake', label: 'Höchstens nehmen', value: 3, resetsKai: true,
      options: [2, 3, 4].map((n) => ({ value: n, label: String(n) })),
    },
    {
      id: 'misere', label: 'Das letzte Holz …', value: true, resetsKai: true,
      options: [{ value: true, label: '… verliert' }, { value: false, label: '… gewinnt' }],
    },
    {
      id: 'first', label: 'Wer beginnt?', value: 'human',
      options: [{ value: 'human', label: 'Du' }, { value: 'ai', label: 'Die KI' }],
    },
  ],
  humanSide: (st) => (st.first === 'human' ? 0 : 1),
  ada: {
    modes: ['regeln', 'suchbaum'],
    rules: (game, state) => (state ? adaRules(game, state) : { lines: adaRuleLines(game, null) }),
  },
  kai: { prefill: true },
  texts: { yourTurn: 'Du bist dran – klicke auf ein Holz oder einen Knopf.' },
});
