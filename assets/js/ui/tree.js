// Aufklappbarer Suchbaum für Adas Minimax-Modus.
import { h } from './dom.js';

export function valueBadge(v) {
  const cls = v > 0 ? 'win' : v < 0 ? 'loss' : 'draw';
  const text = v > 0 ? '+1' : v < 0 ? '−1' : '0';
  const title = v > 0 ? 'Ada gewinnt' : v < 0 ? 'Ada verliert' : 'Unentschieden';
  return h('span', { class: `val val-${cls}`, title }, text);
}

export function renderTree(host, { game, solver, state, adaSide, view, chosen }) {
  host.replaceChildren();
  // Wert immer aus Adas Sicht
  const adaValue = (st) => {
    const v = solver.value(st);
    return game.toMove(st) === adaSide ? v : -v;
  };

  const levelNote = (st) => (game.toMove(st) === adaSide
    ? h('p', { class: 'tree-level max' }, 'Ada ist am Zug → sie nimmt den größten Wert (Maximum).')
    : h('p', { class: 'tree-level min' }, 'Du bist am Zug → Ada rechnet damit, dass du den für sie kleinsten Wert wählst (Minimum).'));

  function childList(parent) {
    const ul = h('ul', { class: 'tree-list' });
    for (const move of game.legalMoves(parent)) ul.append(node(parent, move));
    return h('div', { class: 'tree-children' }, levelNote(parent), ul);
  }

  function node(parent, move) {
    const st = game.play(parent, move);
    const r = game.result(st);
    const who = game.toMove(parent) === adaSide ? 'Ada' : 'Du';
    const li = h('li', { class: `tree-node${chosen !== undefined && parent === state && move === chosen ? ' chosen' : ''}` });
    let children = null;
    const toggle = r
      ? h('span', { class: 'tree-toggle leaf', 'aria-hidden': 'true' }, '•')
      : h('button', {
        type: 'button',
        class: 'tree-toggle',
        'aria-expanded': 'false',
        'aria-label': 'Folgezüge anzeigen',
        onclick: () => {
          const open = toggle.getAttribute('aria-expanded') === 'true';
          toggle.setAttribute('aria-expanded', String(!open));
          if (!children) {
            children = childList(st);
            li.append(children);
          }
          children.hidden = open;
        },
      }, '▸');
    const endText = r ? (r.winner === null ? 'Spielende: unentschieden' : r.winner === adaSide ? 'Spielende: Ada gewinnt' : 'Spielende: du gewinnst') : '';
    li.append(h('div', { class: 'tree-row' },
      toggle,
      view.renderMini(st, { lastMove: move, prev: parent, small: true }),
      h('span', { class: 'tree-move' }, h('b', {}, `${who}: `), game.moveName(move, parent), r ? h('span', { class: 'tree-end' }, endText) : null),
      valueBadge(adaValue(st))));
    return li;
  }

  host.append(
    h('div', { class: 'legend' },
      h('span', {}, h('span', { class: 'val val-win' }, '+1'), ' Ada gewinnt'),
      h('span', {}, h('span', { class: 'val val-draw' }, '0'), ' unentschieden'),
      h('span', {}, h('span', { class: 'val val-loss' }, '−1'), ' Ada verliert')),
    childList(state),
  );
}
