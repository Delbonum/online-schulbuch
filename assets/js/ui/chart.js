// Lernkurve: gestapelte Balken, je Balken ein Block von Spielen.
import { h, s, formatNumber } from './dom.js';

export function renderChart(host, outcomes) {
  host.replaceChildren();
  const n = outcomes.length;
  if (!n) {
    host.append(h('p', { class: 'muted small' }, 'Noch keine Spiele. Spiele gegen Kai oder trainiere ihn, dann siehst du hier, wie er besser wird.'));
    return;
  }
  const size = Math.ceil(n / 40);
  const blocks = [];
  for (let i = 0; i < n; i += size) {
    const part = outcomes.slice(i, i + size);
    const c = { from: i + 1, to: i + part.length, win: 0, draw: 0, loss: 0 };
    for (const o of part) c[o]++;
    c.total = part.length;
    blocks.push(c);
  }
  const W = 400;
  const H = 110;
  const gap = blocks.length > 20 ? 1 : 2;
  const bw = W / blocks.length;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', class: 'chart', role: 'img', 'aria-label': 'Lernkurve von Kai' });
  blocks.forEach((b, i) => {
    let y = H;
    const g = s('g', {}, s('title', {}, `Spiel ${formatNumber(b.from)}–${formatNumber(b.to)}: ${b.win} gewonnen, ${b.draw} unentschieden, ${b.loss} verloren`));
    for (const key of ['loss', 'draw', 'win']) {
      const hgt = (b[key] / b.total) * H;
      y -= hgt;
      if (hgt > 0) g.append(s('rect', { x: i * bw + gap / 2, y, width: Math.max(1, bw - gap), height: hgt, class: `bar-${key}` }));
    }
    svg.append(g);
  });
  const recent = outcomes.slice(-50);
  const recentLoss = Math.round((recent.filter((o) => o === 'loss').length / recent.length) * 100);
  host.append(
    svg,
    h('div', { class: 'chart-axis' }, h('span', {}, 'Spiel 1'), h('span', {}, size > 1 ? `je Balken ${size} Spiele` : 'je Balken 1 Spiel'), h('span', {}, `Spiel ${formatNumber(n)}`)),
    h('div', { class: 'legend' },
      h('span', {}, h('i', { class: 'dot bar-win' }), 'Kai gewinnt'),
      h('span', {}, h('i', { class: 'dot bar-draw' }), 'Unentschieden'),
      h('span', {}, h('i', { class: 'dot bar-loss' }), 'Kai verliert')),
    h('p', { class: 'small muted' }, `In den letzten ${recent.length} Spielen hat Kai ${recentLoss} % verloren.`),
  );
}
