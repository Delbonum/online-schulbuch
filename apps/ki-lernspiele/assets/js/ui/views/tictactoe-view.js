// Darstellung für Tic Tac Toe.
import { h, s } from '../dom.js';
import { CELL_NAMES } from '../../games/tictactoe.js';

function symbolSvg(sym) {
  if (sym === 'X') {
    return s('svg', { viewBox: '0 0 100 100', class: 'sym sym-x', 'aria-hidden': 'true' },
      s('line', { x1: 22, y1: 22, x2: 78, y2: 78 }), s('line', { x1: 78, y1: 22, x2: 22, y2: 78 }));
  }
  return s('svg', { viewBox: '0 0 100 100', class: 'sym sym-o', 'aria-hidden': 'true' }, s('circle', { cx: 50, cy: 50, r: 29 }));
}

export const tictactoeView = {
  createBoard(host, { onMove }) {
    const grid = h('div', { class: 'ttt-board' });
    const cells = CELL_NAMES.map((name, i) => {
      const b = h('button', { type: 'button', class: 'ttt-cell', onclick: () => onMove(i) });
      grid.append(b);
      return b;
    });
    host.append(grid);

    const clearMarks = () => grid.querySelectorAll('.mark').forEach((m) => m.remove());
    return {
      render(state, { interactive, result, lastMove }) {
        clearMarks();
        cells.forEach((b, i) => {
          const v = state.b[i];
          b.replaceChildren(...(v === '.' ? [] : [symbolSvg(v)]));
          b.disabled = !interactive || v !== '.';
          b.classList.toggle('win', !!result?.line?.includes(i));
          b.classList.toggle('last', lastMove === i);
          b.setAttribute('aria-label', `${CELL_NAMES[i]}: ${v === '.' ? 'frei' : v}`);
        });
      },
      mark(marks) {
        clearMarks();
        for (const { move, cls, label } of marks) cells[move].append(h('span', { class: `mark ${cls}` }, label ?? ''));
      },
      clearMarks,
    };
  },

  // Kleines Brett für Schachteln und Suchbaum.
  renderMini(state, { entries = [], mode, lastMove, small } = {}) {
    const svg = s('svg', { viewBox: '0 0 30 30', class: `mini mini-ttt${small ? ' small' : ''}`, 'aria-hidden': 'true' });
    svg.append(
      s('rect', { x: 0, y: 0, width: 30, height: 30, class: 'mini-bg', rx: 1.5 }),
      s('path', { d: 'M10 1V29M20 1V29M1 10H29M1 20H29', class: 'mini-grid' }),
    );
    for (let i = 0; i < 9; i++) {
      const x = (i % 3) * 10 + 5;
      const y = Math.floor(i / 3) * 10 + 5;
      const v = state.b[i];
      if (i === lastMove) svg.append(s('rect', { x: x - 4.5, y: y - 4.5, width: 9, height: 9, class: 'mini-last', rx: 1 }));
      if (v === 'X') svg.append(s('path', { d: `M${x - 2.8} ${y - 2.8}L${x + 2.8} ${y + 2.8}M${x + 2.8} ${y - 2.8}L${x - 2.8} ${y + 2.8}`, class: 'mini-x' }));
      if (v === 'O') svg.append(s('circle', { cx: x, cy: y, r: 3, class: 'mini-o' }));
    }
    for (const e of entries) {
      const x = (e.move % 3) * 10 + 5;
      const y = Math.floor(e.move / 3) * 10 + 5;
      if (mode === 'perlen') {
        const empty = e.beads === 0;
        svg.append(s('circle', { cx: x, cy: y, r: 3.6, class: empty ? 'mini-bead empty' : 'mini-bead' }),
          s('text', { x, y: y + 1.5, class: 'mini-num' }, e.beads));
      } else if (e.struck) {
        svg.append(s('path', { d: `M${x - 2.2} ${y - 2.2}L${x + 2.2} ${y + 2.2}M${x + 2.2} ${y - 2.2}L${x - 2.2} ${y + 2.2}`, class: 'mini-struck' }));
      } else {
        svg.append(s('circle', { cx: x, cy: y, r: 2.2, class: 'mini-card' }));
      }
    }
    return svg;
  },

  resultReason: () => '',
};
