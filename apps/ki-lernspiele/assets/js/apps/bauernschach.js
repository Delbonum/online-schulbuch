import { createApp } from '../ui/app.js';
import { createHexapawn } from '../games/hexapawn.js';
import { hexapawnView } from '../ui/views/hexapawn-view.js';

createApp(document.getElementById('app'), {
  makeGame: () => createHexapawn(),
  view: hexapawnView,
  humanSide: () => 0,
  ada: { modes: ['suchbaum'] },
  kai: { prefill: true },
  texts: { yourTurn: 'Du bist dran (Weiß) – klicke erst auf einen Bauern, dann auf sein Ziel.' },
});
