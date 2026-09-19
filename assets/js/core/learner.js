// Kais Gehirn: ein "Streichholzschachtel-Lerner".
//
// Für jede Spielstellung, in der Kai am Zug ist, gibt es eine Schachtel.
// In der Schachtel liegt für jeden möglichen Zug eine Karte bzw. Perlen.
//
// Modus "streichen" (wie Hexapawn / "Schlag das Krokodil"):
//   Kai zieht zufällig eine der noch vorhandenen Karten. Verliert Kai, wird
//   die Karte seines letzten Zuges gestrichen. Ist eine Schachtel danach leer,
//   war schon der Zug davor schlecht und wird ebenfalls gestrichen.
//
// Modus "perlen" (wie MENACE von Donald Michie, 1961):
//   Jeder Zug hat Perlen. Kai zieht zufällig eine Perle – Züge mit vielen
//   Perlen sind wahrscheinlicher. Nach dem Spiel bekommen alle gespielten
//   Züge Perlen dazu (Sieg, Unentschieden) oder verlieren welche (Niederlage).
//
// Das Spiel muss liefern: legalMoves(state), key(state) und optional
// canonical(state) für Symmetrien.

import { randomChoice, weightedChoice } from './util.js';

export const DEFAULT_REWARDS = { win: 3, draw: 1, loss: -1 };

export class MatchboxLearner {
  constructor(game, { mode = 'streichen', symmetry = true, initialBeads = 3, rewards = DEFAULT_REWARDS } = {}) {
    this.game = game;
    this.mode = mode;
    this.symmetry = symmetry && typeof game.canonical === 'function';
    this.initialBeads = initialBeads;
    this.rewards = rewards;
    this.boxes = new Map();
    this.nextId = 1;
    this.history = [];
    this.outcomes = [];
    this.lastChanges = [];
  }

  canon(state) {
    if (this.symmetry) return this.game.canonical(state);
    return {
      key: this.game.key(state),
      state,
      moves: this.game.legalMoves(state),
      fromCanon: (m) => m,
    };
  }

  getBox(state) {
    const c = this.canon(state);
    let box = this.boxes.get(c.key);
    if (!box) {
      box = {
        id: this.nextId++,
        key: c.key,
        state: c.state,
        moves: c.moves.map((move) => ({ move, beads: this.initialBeads, struck: false })),
        uses: 0,
      };
      this.boxes.set(c.key, box);
    }
    return { box, c };
  }

  // Legt Schachteln für alle angegebenen Stellungen im Voraus an.
  prefill(states) {
    for (const s of states) this.getBox(s);
  }

  isAvailable(entry) {
    return this.mode === 'streichen' ? !entry.struck : entry.beads > 0;
  }

  available(box) {
    return box.moves.filter((e) => this.isAvailable(e));
  }

  startGame() {
    this.history = [];
  }

  // Wählt einen Zug. Ist die Schachtel leer, gibt Kai auf.
  choose(state, rng = Math.random) {
    const { box, c } = this.getBox(state);
    box.uses++;
    const avail = this.available(box);
    if (avail.length === 0) return { resigned: true, box };
    const entry = this.mode === 'streichen'
      ? randomChoice(avail, rng)
      : weightedChoice(avail, avail.map((e) => e.beads), rng);
    this.history.push({ box, entry });
    return { resigned: false, move: c.fromCanon(entry.move), box, entry, options: avail, fromCanon: c.fromCanon };
  }

  // outcome aus Kais Sicht: 'win' | 'draw' | 'loss'. Liefert die Änderungen.
  endGame(outcome) {
    const changes = [];
    if (this.mode === 'streichen') {
      if (outcome === 'loss') {
        for (let i = this.history.length - 1; i >= 0; i--) {
          const { box, entry } = this.history[i];
          entry.struck = true;
          changes.push({ box, move: entry.move, type: 'struck', chained: i < this.history.length - 1 });
          if (box.moves.some((e) => !e.struck)) break;
        }
      }
    } else {
      const delta = this.rewards[outcome] ?? 0;
      for (const { box, entry } of this.history) {
        const before = entry.beads;
        entry.beads = Math.max(0, entry.beads + delta);
        if (entry.beads !== before) changes.push({ box, move: entry.move, type: 'beads', delta: entry.beads - before });
      }
    }
    this.outcomes.push(outcome);
    this.lastBoxes = this.history.map((h) => h.box);
    this.history = [];
    this.lastChanges = changes;
    return changes;
  }

  stats() {
    let struck = 0;
    let emptyBoxes = 0;
    for (const box of this.boxes.values()) {
      struck += box.moves.filter((e) => !this.isAvailable(e)).length;
      if (this.available(box).length === 0) emptyBoxes++;
    }
    return { boxes: this.boxes.size, removed: struck, emptyBoxes, games: this.outcomes.length };
  }

  toJSON() {
    return {
      format: 'ki-lernspiele/kai-v1',
      game: this.game.id,
      settingsKey: this.game.settingsKey ?? '',
      mode: this.mode,
      symmetry: this.symmetry,
      initialBeads: this.initialBeads,
      outcomes: this.outcomes,
      boxes: [...this.boxes.values()].map((b) => ({ id: b.id, key: b.key, state: b.state, uses: b.uses, moves: b.moves })),
    };
  }

  static fromJSON(game, data) {
    if (data?.format !== 'ki-lernspiele/kai-v1' || data.game !== game.id) {
      throw new Error('Diese Datei passt nicht zu diesem Spiel.');
    }
    if ((data.settingsKey ?? '') !== (game.settingsKey ?? '')) {
      throw new Error('Diese Datei wurde mit anderen Spiel-Einstellungen erstellt.');
    }
    const l = new MatchboxLearner(game, { mode: data.mode, symmetry: data.symmetry, initialBeads: data.initialBeads });
    l.outcomes = data.outcomes ?? [];
    for (const b of data.boxes) {
      l.boxes.set(b.key, { ...b, moves: b.moves.map((e) => ({ ...e })) });
      l.nextId = Math.max(l.nextId, b.id + 1);
    }
    return l;
  }
}
