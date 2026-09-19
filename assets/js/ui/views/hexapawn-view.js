// Darstellung für Bauernschach (Hexapawn).
import { h, s } from '../dom.js';
import { PIECES, parseMove, cellName } from '../../games/hexapawn.js';

const PAWN_PATH = 'M50 16a12 12 0 0 1 8 21c6 4 9 10 9 17H33c0-7 3-13 9-17a12 12 0 0 1 8-21zM30 60h40l6 20H24z';
const ARROW_COLORS = ['#e8590c', '#1c7ed6', '#2f9e44', '#ae3ec9', '#f08c00', '#0c8599'];

function pawnSvg(piece) {
  return s('svg', { viewBox: '0 0 100 100', class: `pawn ${piece === 'W' ? 'white' : 'black'}`, 'aria-hidden': 'true' },
    s('path', { d: PAWN_PATH }));
}

const center = (c, size) => [(c % 3) * size + size / 2, Math.floor(c / 3) * size + size / 2];

function arrow(from, to, size, shorten) {
  const [x1, y1] = center(from, size);
  const [x2, y2] = center(to, size);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  return { x1: x1 + ux * shorten, y1: y1 + uy * shorten, x2: x2 - ux * shorten, y2: y2 - uy * shorten, ux, uy };
}

// Linie plus gefüllte Pfeilspitze (ohne SVG-Marker, damit jede Farbe klappt).
function arrowShape(a, head) {
  const bx = a.x2 - a.ux * head;
  const by = a.y2 - a.uy * head;
  const px = -a.uy * head * 0.6;
  const py = a.ux * head * 0.6;
  return [
    s('line', { x1: a.x1, y1: a.y1, x2: bx, y2: by }),
    s('path', { d: `M${a.x2} ${a.y2}L${bx + px} ${by + py}L${bx - px} ${by - py}Z`, class: 'head' }),
  ];
}

export const hexapawnView = {
  createBoard(host, { onMove }) {
    const wrap = h('div', { class: 'hp-wrap' });
    const grid = h('div', { class: 'hp-board' });
    const overlay = s('svg', { viewBox: '0 0 300 300', class: 'hp-overlay', 'aria-hidden': 'true' });
    wrap.append(grid, overlay);
    host.append(wrap);
    let selected = null;
    let current = null;
    const cells = Array.from({ length: 9 }, (_, i) => {
      const b = h('button', {
        type: 'button',
        class: `hp-cell ${(Math.floor(i / 3) + (i % 3)) % 2 ? 'dark' : 'light'}`,
        onclick: () => click(i),
      });
      grid.append(b);
      return b;
    });

    function click(i) {
      if (!current?.interactive) return;
      const { state, game, humanSide } = current;
      const legal = game.legalMoves(state);
      if (selected != null && legal.includes(`${selected}-${i}`)) {
        const m = `${selected}-${i}`;
        selected = null;
        onMove(m);
        return;
      }
      selected = state.b[i] === PIECES[humanSide] && legal.some((m) => m.startsWith(`${i}-`)) ? i : null;
      paint();
    }

    function paint() {
      const { state, game, interactive, lastMove, humanSide } = current;
      const legal = interactive ? game.legalMoves(state) : [];
      const targets = selected != null ? legal.filter((m) => m.startsWith(`${selected}-`)).map((m) => parseMove(m)[1]) : [];
      const [lastFrom, lastTo] = lastMove ? parseMove(lastMove) : [];
      cells.forEach((b, i) => {
        const p = state.b[i];
        b.replaceChildren(...(p === '.' ? [] : [pawnSvg(p)]));
        if (i % 3 === 0) b.append(h('span', { class: 'coord rank' }, 3 - Math.floor(i / 3)));
        if (i >= 6) b.append(h('span', { class: 'coord file' }, 'abc'[i % 3]));
        const movable = interactive && p === PIECES[humanSide] && legal.some((m) => m.startsWith(`${i}-`));
        b.disabled = !(movable || targets.includes(i));
        b.classList.toggle('selected', i === selected);
        b.classList.toggle('target', targets.includes(i));
        b.classList.toggle('movable', movable);
        b.classList.toggle('last', i === lastFrom || i === lastTo);
        const name = p === 'W' ? 'weißer Bauer' : p === 'B' ? 'schwarzer Bauer' : 'leer';
        b.setAttribute('aria-label', `${cellName(i)}: ${name}${targets.includes(i) ? ' – hierhin ziehen' : ''}`);
      });
    }

    const clearMarks = () => {
      overlay.querySelectorAll('.hp-arrow').forEach((a) => a.remove());
    };

    return {
      render(state, opts) {
        current = { state, ...opts };
        if (!opts.interactive) selected = null;
        clearMarks();
        paint();
      },
      mark(marks) {
        clearMarks();
        marks.forEach(({ move, cls, label }, idx) => {
          const [from, to] = parseMove(move);
          const a = arrow(from, to, 100, 22);
          const g = s('g', { class: `hp-arrow ${cls}`, style: `--arrow:${ARROW_COLORS[idx % ARROW_COLORS.length]}` },
            arrowShape(a, 18));
          if (label) {
            const lx = a.x1 + (a.x2 - a.x1) * 0.55;
            const ly = a.y1 + (a.y2 - a.y1) * 0.55;
            g.append(s('circle', { cx: lx, cy: ly, r: 13 }), s('text', { x: lx, y: ly + 5 }, label));
          }
          overlay.append(g);
        });
      },
      clearMarks,
    };
  },

  renderMini(state, { entries = [], mode, lastMove, small } = {}) {
    const svg = s('svg', { viewBox: '0 0 30 30', class: `mini mini-hp${small ? ' small' : ''}`, 'aria-hidden': 'true' });
    for (let i = 0; i < 9; i++) {
      svg.append(s('rect', { x: (i % 3) * 10, y: Math.floor(i / 3) * 10, width: 10, height: 10, class: (Math.floor(i / 3) + (i % 3)) % 2 ? 'sq-dark' : 'sq-light' }));
    }
    for (let i = 0; i < 9; i++) {
      const [x, y] = center(i, 10);
      if (state.b[i] === 'W') svg.append(s('circle', { cx: x, cy: y, r: 3, class: 'mini-white' }));
      if (state.b[i] === 'B') svg.append(s('circle', { cx: x, cy: y, r: 3, class: 'mini-black' }));
    }
    const drawArrow = (move, cls, color, label) => {
      const [from, to] = parseMove(move);
      const a = arrow(from, to, 10, 2.5);
      const g = s('g', { class: `mini-arrow ${cls}`, style: `--arrow:${color}` }, arrowShape(a, 2.2));
      if (label != null) {
        const lx = (a.x1 + a.x2) / 2;
        const ly = (a.y1 + a.y2) / 2;
        g.append(s('circle', { cx: lx, cy: ly, r: 2.4, class: 'mini-label' }), s('text', { x: lx, y: ly + 1.1, class: 'mini-num' }, label));
      }
      svg.append(g);
    };
    entries.forEach((e, idx) => {
      const off = mode === 'perlen' ? e.beads === 0 : e.struck;
      drawArrow(e.move, off ? 'off' : '', ARROW_COLORS[idx % ARROW_COLORS.length], mode === 'perlen' ? e.beads : null);
    });
    if (lastMove) drawArrow(lastMove, 'last', 'var(--accent)', null);
    return svg;
  },

  resultReason(r) {
    return {
      goal: 'Ein Bauer hat die gegnerische Grundreihe erreicht.',
      captured: 'Alle gegnerischen Bauern wurden geschlagen.',
      blocked: 'Die andere Seite kann nicht mehr ziehen.',
    }[r.reason] ?? '';
  },
};
