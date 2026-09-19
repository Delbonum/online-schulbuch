// Gemeinsame Oberfläche für alle Spiele: Spielfeld, Ada-Panel, Kai-Panel.
//
// cfg = {
//   makeGame(settings)         – erzeugt die Spiellogik
//   view                       – Darstellung (createBoard, renderMini)
//   settings: [{ id, label, value, options:[{value,label}], resetsKai }]
//   humanSide(settings)        – 0 oder 1
//   ada: { modes: ['regeln','suchbaum'], rules(game, state) -> {lines, trace, candidates} }
//   kai: { prefill: bool }
//   texts: { yourTurn }
// }

import { MatchboxLearner } from '../core/learner.js';
import { createSolver } from '../core/minimax.js';
import { randomChoice, sleep } from '../core/util.js';
import { h, segmented, formatNumber } from './dom.js';
import { renderChart } from './chart.js';
import { renderTree } from './tree.js';
import { renderMemory, MEMORY_PAGE } from './memory.js';

const NAMES = { ada: 'Ada', kai: 'Kai' };

export function createApp(root, cfg) {
  return new GameApp(root, cfg);
}

class GameApp {
  constructor(root, cfg) {
    this.root = root;
    this.cfg = cfg;
    this.settings = Object.fromEntries((cfg.settings ?? []).map((st) => [st.id, st.value]));
    this.opponent = location.hash === '#kai' ? 'kai' : 'ada';
    this.adaMode = cfg.ada.modes[0];
    this.kaiMode = 'streichen';
    this.symmetry = true;
    this.speed = 700;
    this.stepMode = false;
    this.memoryFilter = 'game';
    this.memoryLimit = MEMORY_PAGE;
    this.score = { ada: { human: 0, ai: 0, draw: 0 }, kai: { human: 0, ai: 0, draw: 0 } };
    this.gen = 0;
    this.moves = [];
    this.gameBoxes = [];
    this.changedIds = new Set();
    this.buildGame();
    this.buildDom();
    this.newGame();
  }

  // ---------------------------------------------------------------- Modell

  buildGame() {
    this.game = this.cfg.makeGame(this.settings);
    this.trainSolver = createSolver(this.game);
    this.resetKai();
  }

  resetKai() {
    this.learner = new MatchboxLearner(this.game, { mode: this.kaiMode, symmetry: this.symmetry });
    if (this.cfg.kai?.prefill && this.game.aiStates) this.learner.prefill(this.game.aiStates());
    this.changedIds = new Set();
    this.kaiLogLines = [];
  }

  get humanSide() { return this.cfg.humanSide ? this.cfg.humanSide(this.settings) : 0; }
  get aiSide() { return 1 - this.humanSide; }
  get aiName() { return NAMES[this.opponent]; }

  // ---------------------------------------------------------------- Aufbau

  buildDom() {
    const opp = segmented({
      label: 'Gegner wählen',
      className: 'opponent-switch',
      value: this.opponent,
      options: [
        { value: 'ada', title: 'Ada', sub: 'folgt einem Algorithmus' },
        { value: 'kai', title: 'Kai', sub: 'lernt aus Erfahrung' },
      ],
      onChange: (v) => {
        this.opponent = v;
        history.replaceState(null, '', v === 'kai' ? '#kai' : '#ada');
        this.renderBrain();
        this.renderScore();
        this.newGame();
      },
    });

    this.statusEl = h('p', { class: 'status', 'aria-live': 'polite' });
    this.boardHost = h('div', { class: 'board-host' });
    this.board = this.cfg.view.createBoard(this.boardHost, { onMove: (m) => this.humanMove(m) });

    const settingsEls = (this.cfg.settings ?? []).map((st) => h('label', { class: 'field' },
      h('span', {}, st.label),
      h('select', {
        onchange: (e) => this.changeSetting(st, e.target.value),
      }, st.options.map((o) => h('option', { value: o.value, selected: String(o.value) === String(st.value) }, o.label)))));

    this.speedInput = h('input', {
      type: 'range', min: 0, max: 2000, step: 100, value: this.speed,
      oninput: (e) => { this.speed = Number(e.target.value); },
      'aria-label': 'Denktempo der KI',
    });

    this.scoreEl = h('div', { class: 'score' });

    this.brainEl = h('section', { class: 'card brain', 'aria-label': 'So denkt die KI' });

    this.root.replaceChildren(
      opp,
      h('div', { class: 'layout' },
        h('section', { class: 'card play', 'aria-label': 'Spielfeld' },
          this.statusEl,
          this.boardHost,
          h('div', { class: 'controls' },
            h('button', { type: 'button', class: 'btn primary', onclick: () => this.newGame() }, 'Neues Spiel'),
            settingsEls,
            h('label', { class: 'field speed' }, h('span', {}, 'Tempo der KI'),
              h('span', { class: 'range' }, h('small', {}, 'schnell'), this.speedInput, h('small', {}, 'langsam')))),
          this.scoreEl),
        this.brainEl),
    );
    this.renderBrain();
    this.renderScore();
  }

  changeSetting(st, raw) {
    const opt = st.options.find((o) => String(o.value) === raw);
    this.settings[st.id] = opt ? opt.value : raw;
    if (st.resetsKai) {
      this.buildGame();
      this.renderBrain();
      this.kaiLog('Neue Spielregeln – Kai beginnt mit leerem Gedächtnis.');
    }
    this.newGame();
  }

  renderScore() {
    const sc = this.score[this.opponent];
    this.scoreEl.replaceChildren(
      h('div', { class: 'tile human' }, h('b', {}, sc.human), h('span', {}, 'Du')),
      h('div', { class: 'tile draw' }, h('b', {}, sc.draw), h('span', {}, 'Unentschieden')),
      h('div', { class: `tile ai ${this.opponent}` }, h('b', {}, sc.ai), h('span', {}, this.aiName)),
    );
  }

  // ---------------------------------------------------------------- Ablauf

  newGame() {
    this.gen++;
    this.busy = false;
    this.over = false;
    this.state = this.game.initialState();
    this.moves = [];
    this.gameBoxes = [];
    this.currentBoxId = null;
    this.learner.startGame();
    this.board.clearMarks();
    this.clearCode();
    if (this.nextBtn) this.nextBtn.disabled = true;
    this.renderBoard();
    if (this.opponent === 'kai') this.refreshMemory();
    if (this.opponent === 'ada' && this.treeEl) this.treeEl.replaceChildren(h('p', { class: 'muted small' }, 'Sobald Ada am Zug ist, siehst du hier ihren Suchbaum.'));
    if (this.game.toMove(this.state) === this.aiSide) this.aiTurn();
    else this.setStatus(this.cfg.texts?.yourTurn ?? 'Du bist dran.');
  }

  setStatus(text, cls = '') {
    this.statusEl.textContent = text;
    this.statusEl.className = `status ${cls}`;
  }

  renderBoard(result = null) {
    this.board.render(this.state, {
      game: this.game,
      interactive: !this.busy && !this.over && this.game.toMove(this.state) === this.humanSide,
      humanSide: this.humanSide,
      moves: this.moves,
      lastMove: this.moves.length ? this.moves[this.moves.length - 1].move : null,
      result,
    });
  }

  apply(move, side) {
    const prev = this.state;
    this.state = this.game.play(this.state, move);
    this.moves.push({ move, side, prev });
    this.board.clearMarks();
    this.renderBoard();
  }

  humanMove(move) {
    if (this.busy || this.over) return;
    if (this.game.toMove(this.state) !== this.humanSide) return;
    if (!this.game.legalMoves(this.state).includes(move)) return;
    this.clearCode();
    this.apply(move, this.humanSide);
    if (!this.checkEnd()) this.aiTurn();
  }

  async aiTurn() {
    const gen = this.gen;
    this.busy = true;
    this.renderBoard();
    this.setStatus(`${this.aiName} überlegt …`, `thinking ${this.opponent}`);
    let move;
    if (this.opponent === 'ada') {
      move = this.adaMode === 'regeln' ? await this.adaRulesMove(gen) : await this.adaSearchMove(gen);
    } else {
      const r = await this.kaiMove(gen);
      if (gen !== this.gen) return;
      if (r.resigned) {
        this.busy = false;
        this.finish({ winner: this.humanSide, resigned: true, box: r.box });
        return;
      }
      move = r.move;
    }
    if (gen !== this.gen || move == null) return;
    this.busy = false;
    if (this.nextBtn) this.nextBtn.disabled = true;
    this.apply(move, this.aiSide);
    if (!this.checkEnd()) {
      this.setStatus(this.cfg.texts?.yourTurn ?? 'Du bist dran.');
      this.renderBoard();
    }
  }

  checkEnd() {
    const r = this.game.result(this.state);
    if (!r) return false;
    this.finish(r);
    return true;
  }

  finish(r) {
    this.over = true;
    const who = r.winner === null ? 'draw' : r.winner === this.humanSide ? 'human' : 'ai';
    this.score[this.opponent][who]++;
    this.renderScore();
    this.renderBoard(r);
    const reason = this.cfg.view.resultReason?.(r, this.humanSide, this.game) ?? '';
    if (r.resigned) this.setStatus(`${this.aiName} gibt auf – du hast gewonnen! 🎉`, 'win');
    else if (who === 'human') this.setStatus(`Du hast gewonnen! 🎉 ${reason}`, 'win');
    else if (who === 'ai') this.setStatus(`${this.aiName} hat gewonnen. ${reason}`, 'loss');
    else this.setStatus('Unentschieden!', 'draw');

    if (this.opponent === 'kai') {
      const outcome = who === 'ai' ? 'win' : who === 'draw' ? 'draw' : 'loss';
      const changes = this.learner.endGame(outcome);
      this.explainLearning(outcome, changes, r);
      this.changedIds = new Set(changes.map((c) => c.box.id));
      this.refreshKai();
    }
  }

  // ---------------------------------------------------------------- Warten

  wait(gen, ms = this.speed) {
    if (this.opponent === 'ada' && this.stepMode) {
      this.nextBtn.disabled = false;
      return new Promise((resolve) => {
        this.resumeStep = () => {
          this.nextBtn.disabled = true;
          resolve();
        };
      });
    }
    return sleep(ms);
  }

  // ---------------------------------------------------------------- Ada

  renderBrain() {
    this.brainEl.replaceChildren();
    this.brainEl.classList.toggle('ada', this.opponent === 'ada');
    this.brainEl.classList.toggle('kai', this.opponent === 'kai');
    if (this.opponent === 'ada') this.renderAdaPanel();
    else this.renderKaiPanel();
  }

  renderAdaPanel() {
    const { modes } = this.cfg.ada;
    this.nextBtn = h('button', { type: 'button', class: 'btn small', disabled: true, onclick: () => this.resumeStep?.() }, 'Nächster Schritt ▶');
    const stepToggle = h('label', { class: 'check' },
      h('input', { type: 'checkbox', checked: this.stepMode, onchange: (e) => { this.stepMode = e.target.checked; if (!this.stepMode) this.resumeStep?.(); } }),
      'Schritt für Schritt');

    this.codeEl = h('ol', { class: 'pseudocode' });
    this.treeEl = h('div', { class: 'tree' });
    this.adaInfo = h('p', { class: 'small muted', 'aria-live': 'polite' });

    const modeIntro = {
      regeln: 'Ada hat keine eigenen Ideen. Ein Mensch hat ihr eine feste Liste von Regeln aufgeschrieben – einen Algorithmus. Sie prüft die Regeln immer von oben nach unten und führt die erste passende aus.',
      suchbaum: 'Ada probiert in Gedanken jeden möglichen Zug aus – und jede Antwort darauf, bis das Spiel zu Ende ist. So entsteht ein Suchbaum. Dann wählt sie den Zug mit dem besten Ergebnis (Minimax-Algorithmus).',
    };
    const intro = h('p', {}, modeIntro[this.adaMode]);

    this.brainEl.append(...[
      h('h2', {}, 'So denkt Ada'),
      modes.length > 1 ? segmented({
        label: 'Adas Vorgehen',
        value: this.adaMode,
        options: [{ value: 'regeln', label: 'Regeln' }, { value: 'suchbaum', label: 'Suchbaum' }],
        onChange: (v) => { this.adaMode = v; this.renderBrain(); this.newGame(); },
      }) : null,
      intro,
      h('div', { class: 'row' }, stepToggle, this.nextBtn),
    ].filter(Boolean));
    if (this.adaMode === 'regeln') {
      this.renderCode(this.cfg.ada.rules(this.game, null).lines);
      this.brainEl.append(
        this.codeEl,
        h('div', { class: 'legend' },
          h('span', {}, h('i', { class: 'dot ok' }), 'Bedingung erfüllt'),
          h('span', {}, h('i', { class: 'dot fail' }), 'nicht erfüllt'),
          h('span', {}, h('i', { class: 'dot action' }), 'wird ausgeführt')),
      );
    } else {
      this.brainEl.append(this.adaInfo, this.treeEl);
      this.treeEl.replaceChildren(h('p', { class: 'muted small' }, 'Sobald Ada am Zug ist, siehst du hier ihren Suchbaum.'));
    }
  }

  renderCode(lines) {
    if (!this.codeEl) return;
    this.codeEl.replaceChildren(...lines.map((text) => {
      const indent = text.match(/^ */)[0].length / 4;
      const li = h('li', { style: `--indent:${indent}` });
      // Schlüsselwörter hervorheben
      text.trim().split(/(\bWENN\b|\bSONST\b)/).forEach((part) => {
        li.append(part === 'WENN' || part === 'SONST' ? h('b', { class: 'kw' }, part) : part);
      });
      return li;
    }));
  }

  clearCode() {
    this.codeEl?.querySelectorAll('li').forEach((li) => { li.className = ''; });
  }

  async adaRulesMove(gen) {
    const res = this.cfg.ada.rules(this.game, this.state);
    this.renderCode(res.lines);
    const items = [...this.codeEl.children];
    for (const step of res.trace) {
      items.forEach((li) => li.classList.remove('current'));
      const li = items[step.line];
      li.classList.add(step.action ? 'action' : step.ok ? 'ok' : 'fail', 'current');
      this.board.clearMarks();
      if (step.cells?.length) {
        this.board.mark(step.cells.map((m) => ({ move: m, cls: step.action ? 'mark-action' : 'mark-hint' })));
      }
      await this.wait(gen);
      if (gen !== this.gen) return null;
    }
    return randomChoice(res.candidates);
  }

  async adaSearchMove(gen) {
    const solver = createSolver(this.game);
    const evals = solver.evaluate(this.state);
    this.adaInfo.textContent = `Ada hat ${formatNumber(solver.size)} verschiedene Stellungen bis zum Spielende durchgerechnet.`;
    const marks = [];
    for (const e of evals) {
      const text = e.value > 0 ? '+1' : e.value < 0 ? '−1' : '0';
      marks.push({ move: e.move, cls: `val-${e.outcome}`, label: text });
      this.board.mark(marks);
      await this.wait(gen, this.speed / 2);
      if (gen !== this.gen) return null;
    }
    const bestValue = Math.max(...evals.map((e) => e.value));
    // Der Wert enthält schon die Zuganzahl: schnellster Sieg bzw. späteste Niederlage zählt mehr.
    const best = evals.filter((e) => e.value === bestValue);
    const choice = randomChoice(best).move;
    renderTree(this.treeEl, { game: this.game, solver, state: this.state, adaSide: this.aiSide, view: this.cfg.view, chosen: choice });
    this.board.mark(marks.map((m) => (m.move === choice ? { ...m, cls: `${m.cls} mark-chosen` } : m)));
    await this.wait(gen);
    if (gen !== this.gen) return null;
    return choice;
  }

  // ---------------------------------------------------------------- Kai

  renderKaiPanel() {
    const hasSym = typeof this.game.canonical === 'function';
    const modeText = {
      streichen: 'Kai hat für jede Spielstellung eine Schachtel mit Kärtchen – eins für jeden möglichen Zug. Er zieht zufällig ein Kärtchen. Verliert er, wirft er das Kärtchen seines letzten Zuges weg. Ist eine Schachtel leer, war schon der Zug davor schlecht – dann fliegt auch dieses Kärtchen raus.',
      perlen: `Kai hat für jede Spielstellung eine Schachtel mit Perlen – für jeden möglichen Zug ${this.learner.initialBeads} Stück. Er zieht zufällig eine Perle: Züge mit vielen Perlen kommen öfter dran. Nach dem Spiel bekommt jeder seiner Züge Perlen dazu (Sieg +${this.learner.rewards.win}, Unentschieden +${this.learner.rewards.draw}) oder verliert eine (Niederlage ${this.learner.rewards.loss}).`,
    };

    this.kaiLogEl = h('div', { class: 'kai-log', 'aria-live': 'polite' });
    this.chartEl = h('div', { class: 'chart-host' });
    this.memoryEl = h('div', { class: 'memory' });
    this.memoryStatsEl = h('p', { class: 'small muted' });

    const countInput = h('input', { type: 'number', min: 1, max: 100000, value: 100, class: 'num', 'aria-label': 'Anzahl der Trainingsspiele' });
    const trainerSelect = h('select', { 'aria-label': 'Trainingsgegner' },
      h('option', { value: 'random' }, 'Zufallsspieler'),
      h('option', { value: 'ada' }, 'Ada (perfekt)'),
      h('option', { value: 'mix' }, 'gemischt'));
    this.progressEl = h('span', { class: 'small muted', 'aria-live': 'polite' });
    this.trainBtn = h('button', {
      type: 'button',
      class: 'btn primary',
      onclick: () => this.train(Math.max(1, Math.min(100000, Number(countInput.value) || 1)), trainerSelect.value),
    }, 'Trainieren');

    const fileInput = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: (e) => this.importKai(e.target.files[0]) });

    this.brainEl.append(...[
      h('h2', {}, 'So lernt Kai'),
      segmented({
        label: 'Kais Lernverfahren',
        value: this.kaiMode,
        options: [{ value: 'streichen', label: 'Züge streichen' }, { value: 'perlen', label: 'Perlen sammeln' }],
        onChange: (v) => { this.kaiMode = v; this.resetKai(); this.renderBrain(); this.newGame(); },
      }),
      h('p', {}, modeText[this.kaiMode]),
      hasSym ? h('label', { class: 'check' },
        h('input', { type: 'checkbox', checked: this.symmetry, onchange: (e) => { this.symmetry = e.target.checked; this.resetKai(); this.renderBrain(); this.newGame(); } }),
        'Symmetrie nutzen (gespiegelte/gedrehte Stellungen teilen sich eine Schachtel)') : null,
      h('p', { class: 'small muted' }, 'Ein Wechsel des Lernverfahrens löscht Kais Gedächtnis.'),
      this.kaiLogEl,
      h('h3', {}, 'Training'),
      h('div', { class: 'row wrap' }, h('span', {}, 'Kai spielt'), countInput, h('span', {}, 'Spiele gegen'), trainerSelect, this.trainBtn),
      this.progressEl,
      h('h3', {}, 'Lernkurve'),
      this.chartEl,
      h('div', { class: 'row between' },
        h('h3', {}, 'Kais Gedächtnis'),
        h('select', {
          'aria-label': 'Welche Schachteln anzeigen?',
          onchange: (e) => { this.memoryFilter = e.target.value; this.memoryLimit = MEMORY_PAGE; this.refreshMemory(); },
        },
        h('option', { value: 'game', selected: this.memoryFilter === 'game' }, 'Schachteln dieses Spiels'),
        h('option', { value: 'learned', selected: this.memoryFilter === 'learned' }, 'nur veränderte Schachteln'),
        h('option', { value: 'all', selected: this.memoryFilter === 'all' }, 'alle Schachteln'))),
      this.memoryStatsEl,
      this.memoryEl,
      h('div', { class: 'row wrap' },
        h('button', { type: 'button', class: 'btn', onclick: () => { this.resetKai(); this.kaiLog('Kais Gedächtnis wurde gelöscht. Er fängt wieder bei null an.'); this.newGame(); this.refreshKai(); } }, 'Gedächtnis löschen'),
        h('button', { type: 'button', class: 'btn', onclick: () => this.exportKai() }, 'Gedächtnis speichern'),
        h('button', { type: 'button', class: 'btn', onclick: () => fileInput.click() }, 'Gedächtnis laden'),
        fileInput),
    ].filter(Boolean));
    this.renderKaiLog();
    this.refreshKai();
  }

  kaiLog(...lines) {
    this.kaiLogLines = lines;
    this.renderKaiLog();
  }

  renderKaiLog() {
    if (!this.kaiLogEl) return;
    const lines = this.kaiLogLines?.length ? this.kaiLogLines : ['Spiel gegen Kai oder trainiere ihn. Hier erfährst du nach jedem Spiel, was Kai gelernt hat.'];
    this.kaiLogEl.replaceChildren(...lines.map((l) => h('p', {}, l)));
  }

  refreshKai() {
    if (this.opponent !== 'kai' || !this.chartEl) return;
    renderChart(this.chartEl, this.learner.outcomes);
    this.refreshMemory();
  }

  refreshMemory() {
    if (!this.memoryEl) return;
    const st = this.learner.stats();
    const removedText = this.learner.mode === 'streichen' ? `${formatNumber(st.removed)} Züge gestrichen` : `${formatNumber(st.removed)} Züge ohne Perlen`;
    this.memoryStatsEl.textContent = `${formatNumber(st.boxes)} Schachteln · ${removedText} · ${formatNumber(st.games)} Spiele gespielt`;
    renderMemory(this.memoryEl, {
      learner: this.learner,
      view: this.cfg.view,
      filter: this.memoryFilter,
      gameBoxes: this.gameBoxes,
      currentBoxId: this.currentBoxId,
      changedIds: this.changedIds,
      limit: this.memoryLimit,
      onMore: () => { this.memoryLimit += MEMORY_PAGE; this.refreshMemory(); },
    });
  }

  async kaiMove(gen) {
    const choice = this.learner.choose(this.state);
    this.currentBoxId = choice.box.id;
    if (!this.gameBoxes.includes(choice.box)) this.gameBoxes.push(choice.box);
    this.changedIds = new Set();
    this.refreshMemory();
    if (choice.resigned) {
      this.kaiLog(`Kai öffnet Schachtel #${choice.box.id} – sie ist leer! Jeder Zug hat hier irgendwann zur Niederlage geführt.`);
      await this.wait(gen);
      return { resigned: true, box: choice.box };
    }
    const perlen = this.learner.mode === 'perlen';
    const total = choice.options.reduce((a, e) => a + e.beads, 0);
    this.board.mark(choice.options.map((e) => ({
      move: choice.fromCanon(e.move),
      cls: 'mark-kai',
      label: perlen ? String(e.beads) : '?',
    })));
    const count = choice.options.length === 1 ? '1 möglicher Zug' : `${choice.options.length} mögliche Züge`;
    this.kaiLog(perlen
      ? `Kai öffnet Schachtel #${choice.box.id}: ${count} mit zusammen ${total} ${total === 1 ? 'Perle' : 'Perlen'}. Er zieht blind eine Perle.`
      : `Kai öffnet Schachtel #${choice.box.id}: ${count}. Er zieht zufällig ein Kärtchen.`);
    await this.wait(gen);
    if (gen !== this.gen) return {};
    this.board.mark(choice.options.map((e) => {
      const real = choice.fromCanon(e.move);
      return { move: real, cls: real === choice.move ? 'mark-kai mark-chosen' : 'mark-kai faded', label: perlen ? String(e.beads) : real === choice.move ? '✓' : '' };
    }));
    await this.wait(gen, this.speed / 2);
    return { move: choice.move };
  }

  explainLearning(outcome, changes, r) {
    const lines = [];
    if (r.resigned) lines.push(`Kai hat aufgegeben, weil Schachtel #${r.box.id} leer war.`);
    if (this.learner.mode === 'streichen') {
      if (outcome === 'loss') {
        if (!changes.length) {
          lines.push(r.resigned
            ? 'Kai weiß schon: Wer in dieser Stellung am Zug ist, verliert gegen einen guten Gegner. Es gibt nichts Neues zu lernen.'
            : 'Kai hat verloren, aber es gibt keinen eigenen Zug mehr, den er streichen könnte.');
        } else {
          changes.forEach((c, i) => {
            lines.push(i === 0
              ? `Kai hat verloren. Er streicht in Schachtel #${c.box.id} den Zug, der zur Niederlage geführt hat.`
              : `Damit ist Schachtel #${changes[i - 1].box.id} leer – also war schon der Zug davor schlecht: Kai streicht auch in Schachtel #${c.box.id} einen Zug.`);
          });
        }
      } else {
        lines.push(outcome === 'win'
          ? 'Kai hat gewonnen. Beim Streichen ändert sich dann nichts – er behält alle Kärtchen.'
          : 'Unentschieden. Beim Streichen ändert sich nichts.');
      }
    } else {
      const n = changes.length;
      if (outcome === 'win') lines.push(`Kai hat gewonnen! Jeder seiner Züge bekommt ${this.learner.rewards.win} Perlen dazu (${n} Schachteln).`);
      else if (outcome === 'draw') lines.push(`Unentschieden. Jeder seiner Züge bekommt ${this.learner.rewards.draw} Perle dazu (${n} Schachteln).`);
      else lines.push(n ? `Kai hat verloren. Er nimmt bei jedem seiner Züge eine Perle heraus (${n} Schachteln).` : 'Kai hat verloren – es gab keine Perle mehr, die er entfernen konnte.');
    }
    if (changes.length) lines.push('Geänderte Schachteln sind im Gedächtnis unten rot markiert.');
    this.kaiLog(...lines);
  }

  // Training ohne Animation, in Häppchen, damit die Seite bedienbar bleibt.
  async train(count, trainer) {
    this.gen++;
    this.busy = true;
    this.trainBtn.disabled = true;
    const gen = this.gen;
    const g = this.game;
    const stats = { win: 0, draw: 0, loss: 0 };
    const trainerMove = (st) => {
      const useAda = trainer === 'ada' || (trainer === 'mix' && Math.random() < 0.5);
      if (useAda) return randomChoice(this.trainSolver.bestMoves(st).best).move;
      return randomChoice(g.legalMoves(st));
    };
    for (let i = 0; i < count; i++) {
      this.learner.startGame();
      let st = g.initialState();
      let resigned = false;
      while (!g.result(st)) {
        if (g.toMove(st) === this.aiSide) {
          const c = this.learner.choose(st);
          if (c.resigned) { resigned = true; break; }
          st = g.play(st, c.move);
        } else {
          st = g.play(st, trainerMove(st));
        }
      }
      const r = g.result(st);
      const outcome = resigned || r.winner === this.humanSide ? 'loss' : r.winner === null ? 'draw' : 'win';
      this.learner.endGame(outcome);
      stats[outcome]++;
      if (i % 250 === 249) {
        this.progressEl.textContent = `Training läuft … ${formatNumber(i + 1)} von ${formatNumber(count)} Spielen`;
        await sleep(0);
        if (gen !== this.gen) break;
      }
    }
    this.trainBtn.disabled = false;
    this.progressEl.textContent = '';
    this.changedIds = new Set();
    const trainerName = { random: 'den Zufallsspieler', ada: 'Ada', mix: 'gemischte Gegner' }[trainer];
    this.kaiLog(`Training beendet: ${formatNumber(count)} Spiele gegen ${trainerName}. Kai hat ${stats.win}× gewonnen, ${stats.draw}× unentschieden gespielt und ${stats.loss}× verloren.`);
    this.newGame();
    this.refreshKai();
  }

  exportKai() {
    const blob = new Blob([JSON.stringify(this.learner.toJSON())], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `kai-${this.game.id}-${this.learner.mode}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async importKai(file) {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      this.learner = MatchboxLearner.fromJSON(this.game, data);
      this.kaiMode = this.learner.mode;
      this.symmetry = this.learner.symmetry;
      this.renderBrain();
      this.kaiLog(`Gedächtnis geladen: ${formatNumber(this.learner.boxes.size)} Schachteln, ${formatNumber(this.learner.outcomes.length)} Spiele Erfahrung.`);
      this.newGame();
    } catch (err) {
      this.kaiLog(`Laden fehlgeschlagen: ${err.message}`);
    }
  }
}
