// Kais Gedächtnis: alle Schachteln als Karten.
import { h, formatNumber } from './dom.js';

const PAGE = 48;

export function renderMemory(host, { learner, view, filter, gameBoxes, currentBoxId, changedIds, limit = PAGE, onMore }) {
  host.replaceChildren();
  let boxes;
  if (filter === 'game') boxes = gameBoxes;
  else if (filter === 'learned') boxes = [...learner.boxes.values()].filter((b) => b.moves.some((e) => e.struck || e.beads !== learner.initialBeads));
  else boxes = [...learner.boxes.values()];

  if (!boxes.length) {
    host.append(h('p', { class: 'muted small' }, filter === 'game'
      ? 'In diesem Spiel hat Kai noch keine Schachtel geöffnet.'
      : filter === 'learned' ? 'Kai hat noch nichts gelernt.' : 'Noch keine Schachteln vorhanden – sie entstehen, sobald Kai eine neue Stellung sieht.'));
    return;
  }

  const grid = h('div', { class: 'memory-grid' });
  for (const box of boxes.slice(0, limit)) {
    const avail = learner.available(box).length;
    const classes = ['box-card'];
    if (box.id === currentBoxId) classes.push('current');
    if (changedIds?.has(box.id)) classes.push('changed');
    if (avail === 0) classes.push('empty');
    grid.append(h('figure', { class: classes.join(' ') },
      h('figcaption', {}, h('b', {}, `#${box.id}`), h('span', { class: 'muted' }, avail === 0 ? 'leer' : `${avail}/${box.moves.length} Züge`)),
      view.renderMini(box.state, { entries: box.moves, mode: learner.mode, learner })));
  }
  host.append(grid);
  if (boxes.length > limit) {
    host.append(h('button', { type: 'button', class: 'btn small', onclick: onMore }, `Weitere ${formatNumber(Math.min(PAGE, boxes.length - limit))} von ${formatNumber(boxes.length - limit)} anzeigen`));
  }
}

export const MEMORY_PAGE = PAGE;
