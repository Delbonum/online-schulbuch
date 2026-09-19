// Darstellung für NIM (Streichhölzer).
import { h } from '../dom.js';

export const nimView = {
  createBoard(host, { onMove }) {
    const row = h('div', { class: 'nim-sticks', role: 'group', 'aria-label': 'Streichhölzer' });
    const takeRow = h('div', { class: 'nim-take' });
    const counter = h('p', { class: 'nim-counter' });
    host.append(counter, row, takeRow);
    let current = null;
    let sticks = [];
    let buttons = [];

    const clearHover = () => sticks.forEach((st) => st.classList.remove('will-take'));
    const clearMarks = () => {
      host.querySelectorAll('.mark').forEach((m) => m.remove());
      sticks.forEach((st) => st.classList.remove('hint-take'));
    };

    return {
      render(state, { game, interactive, moves = [], humanSide }) {
        current = { state, game, interactive };
        const { sticks: total, maxTake } = game.settings;
        // Wer hat welches Holz genommen?
        const takenBy = new Array(total).fill(null);
        let n = total;
        for (const { move, side } of moves) {
          for (let i = n - move; i < n; i++) takenBy[i] = side === humanSide ? 'human' : 'ai';
          n -= move;
        }
        counter.replaceChildren(h('b', {}, state.n), state.n === 1 ? ' Holz übrig' : ' Hölzer übrig');
        sticks = [];
        row.replaceChildren(...Array.from({ length: total }, (_, i) => {
          const active = i < state.n;
          const count = state.n - i;
          const st = h('button', {
            type: 'button',
            class: `stick${active ? '' : ` taken ${takenBy[i]}`}`,
            disabled: !active || !interactive || count > maxTake,
            'aria-label': active ? `Holz ${i + 1}${count <= maxTake ? ` – ${count} nehmen` : ''}` : `Holz ${i + 1} (weg)`,
            onmouseenter: () => {
              if (!current.interactive || !active || count > maxTake) return;
              for (let j = i; j < state.n; j++) sticks[j].classList.add('will-take');
            },
            onmouseleave: clearHover,
            onclick: () => { clearHover(); onMove(count); },
          });
          sticks.push(st);
          return st;
        }));
        buttons = [];
        takeRow.replaceChildren(...Array.from({ length: maxTake }, (_, i) => {
          const k = i + 1;
          const b = h('button', {
            type: 'button',
            class: 'btn take',
            disabled: !interactive || k > state.n,
            onclick: () => onMove(k),
            onmouseenter: () => { if (current.interactive && k <= state.n) for (let j = state.n - k; j < state.n; j++) sticks[j].classList.add('will-take'); },
            onmouseleave: clearHover,
          }, `${k} nehmen`);
          buttons[k] = b;
          return b;
        }));
      },
      mark(marks) {
        clearMarks();
        const n = current.state.n;
        for (const { move, cls, label } of marks) {
          if (buttons[move]) buttons[move].append(h('span', { class: `mark ${cls}` }, label ?? ''));
          if (/action|chosen/.test(cls)) for (let j = n - move; j < n; j++) sticks[j]?.classList.add('hint-take');
        }
      },
      clearMarks,
    };
  },

  renderMini(state, { entries = [], mode, lastMove, small } = {}) {
    const box = h('div', { class: `mini mini-nim${small ? ' small' : ''}`, 'aria-hidden': 'true' },
      h('div', { class: 'nim-mini-count' }, h('b', {}, state.n), h('span', {}, state.n === 1 ? 'Holz' : 'Hölzer')));
    if (small && lastMove != null) return box;
    if (entries.length) {
      box.append(h('div', { class: 'chips' }, entries.map((e) => {
        const off = mode === 'perlen' ? e.beads === 0 : e.struck;
        return h('span', { class: `chip k${e.move}${off ? ' off' : ''}`, title: `${e.move} nehmen` },
          h('b', {}, `−${e.move}`),
          mode === 'perlen' ? h('small', {}, e.beads > 6 ? `●×${e.beads}` : '●'.repeat(e.beads) || '–') : null);
      })));
    }
    return box;
  },

  resultReason: (r, humanSide, game) => (game.settings.misere ? 'Wer das letzte Holz nimmt, verliert.' : 'Wer das letzte Holz nimmt, gewinnt.'),
};
