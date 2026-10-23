//#region ../core/src/types.ts
var e = [
	"=",
	"!=",
	"<",
	"<=",
	">",
	">="
], t = 65535, n = 4e3, r = class {
	s;
	constructor(e) {
		this.s = e >>> 0;
	}
	get state() {
		return this.s >>> 0;
	}
	set state(e) {
		this.s = e >>> 0;
	}
	next() {
		this.s = this.s + 1831565813 | 0;
		let e = Math.imul(this.s ^ this.s >>> 15, 1 | this.s);
		return e = e + Math.imul(e ^ e >>> 7, 61 | e) ^ e, ((e ^ e >>> 14) >>> 0) / 4294967296;
	}
	int(e) {
		return Math.floor(this.next() * e);
	}
};
function i() {
	return Math.random() * 4294967296 >>> 0;
}
//#endregion
//#region ../core/src/neighborhood.ts
function a(e, t) {
	let n = [];
	for (let r = -e; r <= e; r++) for (let i = -e; i <= e; i++) (i !== 0 || r !== 0) && t(i, r) && n.push({
		dx: i,
		dy: r
	});
	return n;
}
function o(e) {
	switch (e) {
		case "moore": return a(1, () => !0);
		case "vonNeumann": return a(1, (e, t) => Math.abs(e) + Math.abs(t) <= 1);
		case "moore2": return a(2, () => !0);
		case "vonNeumann2": return a(2, (e, t) => Math.abs(e) + Math.abs(t) <= 2);
		case "lookahead": return [
			1,
			2,
			3,
			4,
			5
		].map((e) => ({
			dx: e,
			dy: 0
		}));
	}
}
function s(e, t = !1) {
	return {
		preset: e,
		offsets: o(e),
		includeSelf: t
	};
}
function c(e, t = !1) {
	let n = /* @__PURE__ */ new Set(), r = [];
	for (let t of e) {
		let e = `${t.dx},${t.dy}`;
		t.dx === 0 && t.dy === 0 || n.has(e) || (n.add(e), r.push({
			dx: t.dx,
			dy: t.dy
		}));
	}
	return {
		preset: l(r),
		offsets: r,
		includeSelf: t
	};
}
function l(e) {
	let t = (e) => e.map((e) => `${e.dx},${e.dy}`).sort().join(";"), n = t(e);
	for (let e of [
		"moore",
		"vonNeumann",
		"moore2",
		"vonNeumann2",
		"lookahead"
	]) if (t(o(e)) === n) return e;
	return "custom";
}
function u(e) {
	let t = 0;
	for (let n of e) t = Math.max(t, Math.abs(n.dx), Math.abs(n.dy));
	return t;
}
function d(e, t, n) {
	if (e >= 0 && e < t) return e;
	if (n === "torus") return (e % t + t) % t;
	if (n === "fixed") return -1;
	let r = 2 * t, i = (e % r + r) % r;
	return i >= t && (i = r - 1 - i), i;
}
//#endregion
//#region ../core/src/simulation.ts
var f = 4294967295, p = {
	"=": 0,
	"!=": 1,
	"<": 2,
	"<=": 3,
	">": 4,
	">=": 5
};
function m(e, t, n) {
	switch (t) {
		case 0: return e === n;
		case 1: return e !== n;
		case 2: return e < n;
		case 3: return e <= n;
		case 4: return e > n;
		default: return e >= n;
	}
}
function h(e, t) {
	return e <= 256 ? new Uint8Array(t) : new Uint16Array(t);
}
var g = class {
	width;
	height;
	generation;
	cells;
	ages;
	rng;
	counts;
	lastChanged = 0;
	_model;
	compiled;
	next;
	nextAges;
	hist = /* @__PURE__ */ new Int32Array(1);
	touched = /* @__PURE__ */ new Int32Array(1);
	constructor(e) {
		this.width = e.width, this.height = e.height;
		let t = this.width * this.height, n = e.model.states.length;
		if (this.cells = e.cells ? e.cells : h(n, t), this.cells.length !== t) throw Error(`Zellarray hat ${this.cells.length} statt ${t} Einträge.`);
		this.ages = e.ages && e.ages.length === t ? e.ages : new Uint32Array(t), this.next = h(n, t), this.nextAges = new Uint32Array(t), this.generation = e.generation ?? 0, this.rng = new r(e.seed ?? 1), e.rngState !== void 0 && (this.rng.state = e.rngState), this.counts = [], this.setModel(e.model);
	}
	get model() {
		return this._model;
	}
	get size() {
		return this.width * this.height;
	}
	setModel(e) {
		let t = e.states.length;
		if (t < 1) throw Error("Ein Modell braucht mindestens einen Zustand.");
		let n = t > 256;
		n && this.cells instanceof Uint8Array ? (this.cells = Uint16Array.from(this.cells), this.next = new Uint16Array(this.size)) : !n && this.cells instanceof Uint16Array && (this.cells = Uint8Array.from(this.cells, (e) => e < t ? e : 0), this.next = new Uint8Array(this.size));
		for (let e = 0; e < this.cells.length; e++) this.cells[e] >= t && (this.cells[e] = 0, this.ages[e] = 0);
		this._model = e, this.compiled = this.compile(e), this.hist = new Int32Array(t), this.touched = new Int32Array(e.neighborhood.offsets.length + 1), this.recount();
	}
	compile(e) {
		let t = e.states.length, n = (e) => Number.isInteger(e) && e >= 0 && e < t, r = e.states.map((e) => e.rules.filter((e) => e.enabled !== !1 && n(e.target)).map((e) => ({
			target: e.target,
			any: e.combine === "any",
			probability: Math.max(0, Math.min(1, e.probability)),
			conditions: e.conditions.map((e) => e.type === "neighborCount" ? {
				kind: 0,
				op: p[e.op],
				value: e.value,
				states: e.states.filter(n),
				dx: 0,
				dy: 0
			} : e.type === "neighborAt" ? {
				kind: 1,
				op: p[e.op],
				value: e.state,
				states: [],
				dx: e.dx,
				dy: e.dy
			} : {
				kind: 2,
				op: p[e.op],
				value: e.value,
				states: [],
				dx: 0,
				dy: 0
			})
		}))), i = r.map((e) => e.some((e) => e.conditions.some((e) => e.kind === 0))), a = e.neighborhood.offsets, o = new Int32Array(a.length);
		a.forEach((e, t) => o[t] = e.dy * this.width + e.dx);
		let s = e.boundary, c = s.type === "fixed" && n(s.state) ? s.state : 0;
		return {
			rules: r,
			needsCount: i,
			deltas: o,
			radius: u(a),
			fixedState: c
		};
	}
	resolve(e, t) {
		let n = this._model.boundary.type, r = d(e, this.width, n), i = d(t, this.height, n);
		return r < 0 || i < 0 ? -1 : i * this.width + r;
	}
	stateAt(e, t) {
		let n = this.resolve(e, t);
		return n < 0 ? this.compiled.fixedState : this.cells[n];
	}
	get(e, t) {
		return this.cells[t * this.width + e];
	}
	set(e, t, n) {
		return e < 0 || t < 0 || e >= this.width || t >= this.height ? !1 : this.setIndex(t * this.width + e, n);
	}
	setIndex(e, t) {
		if (t < 0 || t >= this._model.states.length) throw RangeError(`Unbekannter Zustand ${t}.`);
		let n = this.cells[e];
		return n !== t && (this.cells[e] = t, this.ages[e] = 0, this.counts[n]--, this.counts[t]++, !0);
	}
	step() {
		let e = this.width, t = this.height, n = this.cells, r = this.ages, i = this.next, a = this.nextAges, { rules: o, needsCount: s, deltas: c, radius: l, fixedState: u } = this.compiled, d = this._model.neighborhood.offsets, p = this._model.neighborhood.includeSelf, h = d.length, g = this.hist, _ = this.touched, v = this.rng, y = Array(this._model.states.length).fill(0), b = 0;
		for (let x = 0; x < t; x++) {
			let S = x >= l && x < t - l;
			for (let t = 0; t < e; t++) {
				let C = x * e + t, w = n[C], T = o[w], E = w;
				if (T.length > 0) {
					let i = S && t >= l && t < e - l, a = 0;
					if (s[w]) {
						for (let e = 0; e < h; e++) {
							let r = i ? C + c[e] : this.resolve(t + d[e].dx, x + d[e].dy), o = r < 0 ? u : n[r];
							g[o]++, _[a++] = o;
						}
						p && (g[w]++, _[a++] = w);
					}
					for (let e = 0; e < T.length; e++) {
						let n = T[e], i = n.conditions, a = i.length === 0 || !n.any;
						for (let e = 0; e < i.length; e++) {
							let o = i[e], s;
							if (o.kind === 0) {
								let e = 0;
								for (let t = 0; t < o.states.length; t++) e += g[o.states[t]];
								s = m(e, o.op, o.value);
							} else if (o.kind === 1) {
								let e = this.stateAt(t + o.dx, x + o.dy);
								s = o.op === 0 ? e === o.value : e !== o.value;
							} else s = m(r[C], o.op, o.value);
							if (n.any) {
								if (s) {
									a = !0;
									break;
								}
							} else if (!s) {
								a = !1;
								break;
							}
						}
						if (a && (n.probability >= 1 || v.next() < n.probability)) {
							E = n.target;
							break;
						}
					}
					for (let e = 0; e < a; e++) g[_[e]] = 0;
				}
				if (i[C] = E, E === w) {
					let e = r[C];
					a[C] = e < f ? e + 1 : e;
				} else a[C] = 0, b++;
				y[E]++;
			}
		}
		return this.next = n, this.cells = i, this.nextAges = r, this.ages = a, this.counts = y, this.generation++, this.lastChanged = b, b;
	}
	recount() {
		let e = Array(this._model.states.length).fill(0);
		for (let t = 0; t < this.cells.length; t++) e[this.cells[t]]++;
		return this.counts = e, e;
	}
	fill(e = 0) {
		this.cells.fill(e), this.ages.fill(0), this.recount();
	}
	randomize(e = this.rng) {
		let t = this._model.states.map((e) => Math.max(0, e.initialShare || 0)), n = t.reduce((e, t) => e + t, 0);
		if (n <= 0) {
			this.fill(0);
			return;
		}
		let r = [], i = 0;
		for (let e of t) r.push(i += e / n);
		for (let t = 0; t < this.cells.length; t++) {
			let n = e.next(), i = 0;
			for (; i < r.length - 1 && n >= r[i];) i++;
			this.cells[t] = i;
		}
		this.ages.fill(0), this.recount();
	}
	resize(e, t, n = 0) {
		let r = e * t, i = h(this._model.states.length, r), a = new Uint32Array(r);
		n && i.fill(n);
		for (let n = 0; n < Math.min(t, this.height); n++) for (let t = 0; t < Math.min(e, this.width); t++) i[n * e + t] = this.cells[n * this.width + t], a[n * e + t] = this.ages[n * this.width + t];
		this.width = e, this.height = t, this.cells = i, this.ages = a, this.next = h(this._model.states.length, r), this.nextAges = new Uint32Array(r), this.setModel(this._model);
	}
	snapshot() {
		return {
			cells: this.cells.slice(),
			ages: this.ages.slice(),
			generation: this.generation,
			rngState: this.rng.state
		};
	}
	restore(e) {
		if (e.cells.length !== this.size) throw Error("Schnappschuss passt nicht zur Rastergröße.");
		this.cells.set(e.cells), this.ages.set(e.ages), this.generation = e.generation, this.rng.state = e.rngState, this.recount();
	}
}, _ = class e {
	maxLength;
	generations = [];
	counts = [];
	constructor(e = 1e5) {
		this.maxLength = e;
	}
	record(e, t) {
		let n = this.generations.length - 1;
		if (n >= 0 && this.generations[n] === e) {
			this.counts[n] = t.slice();
			return;
		}
		if (n >= 0 && e < this.generations[n] && this.truncateAfter(e - 1), this.generations.push(e), this.counts.push(t.slice()), this.generations.length > this.maxLength) {
			let e = this.generations.length - this.maxLength;
			this.generations.splice(0, e), this.counts.splice(0, e);
		}
	}
	truncateAfter(e) {
		let t = this.generations.length;
		for (; t > 0 && this.generations[t - 1] > e;) t--;
		this.generations.length = t, this.counts.length = t;
	}
	clear() {
		this.generations = [], this.counts = [];
	}
	get length() {
		return this.generations.length;
	}
	series(e) {
		return this.counts.map((t) => t[e] ?? 0);
	}
	summary(e, t = this.length) {
		let n = Math.max(0, this.length - t), r = Infinity, i = -Infinity, a = 0, o = 0, s = 0;
		for (let t = n; t < this.length; t++) {
			let n = this.counts[t][e] ?? 0;
			n < r && (r = n, o = this.generations[t]), n > i && (i = n, a = this.generations[t]), s += n;
		}
		let c = this.length - n;
		return c === 0 ? {
			min: 0,
			max: 0,
			mean: 0,
			minGeneration: 0,
			maxGeneration: 0
		} : {
			min: r,
			max: i,
			mean: s / c,
			minGeneration: o,
			maxGeneration: a
		};
	}
	toCSV(e) {
		let t = (e) => /[";\n]/.test(e) ? `"${e.replace(/"/g, "\"\"")}"` : e, n = [["Generation", ...e].map(t).join(";")];
		for (let t = 0; t < this.length; t++) n.push([this.generations[t], ...e.map((e, n) => this.counts[t][n] ?? 0)].join(";"));
		return n.join("\n") + "\n";
	}
	toJSON() {
		return {
			generations: this.generations.slice(),
			counts: this.counts.map((e) => e.slice())
		};
	}
	static fromJSON(t, n) {
		let r = new e(n);
		return r.generations = t.generations.slice(), r.counts = t.counts.map((e) => e.slice()), r;
	}
};
function v(e) {
	let t = 2166136261, n = 16777619 ^ e.length;
	for (let r = 0; r < e.length; r++) {
		let i = e[r];
		t = Math.imul(t ^ i, 16777619), n = Math.imul(n ^ i + r * 31, 1540483477), n ^= n >>> 13;
	}
	return (t >>> 0).toString(16).padStart(8, "0") + (n >>> 0).toString(16).padStart(8, "0");
}
var y = class {
	window;
	seen = /* @__PURE__ */ new Map();
	order = [];
	info = { kind: "none" };
	constructor(e = 1e3) {
		this.window = e;
	}
	reset() {
		this.seen.clear(), this.order = [], this.info = { kind: "none" };
	}
	get current() {
		return this.info;
	}
	observe(e, t) {
		let n = v(t), r = this.seen.get(n);
		if (r !== void 0 && r < e) {
			let t = e - r, n = this.info;
			n.kind === "stable" && t === 1 || n.kind === "periodic" && n.period === t || (this.info = t === 1 ? {
				kind: "stable",
				since: r
			} : {
				kind: "periodic",
				period: t,
				since: r
			});
		} else r === void 0 && (this.info = { kind: "none" });
		if (this.seen.set(n, e), this.order.push(n), this.order.length > this.window) {
			let e = this.order.shift();
			this.seen.get(e) !== void 0 && !this.order.includes(e) && this.seen.delete(e);
		}
		return this.info;
	}
};
//#endregion
//#region ../core/src/project.ts
function b(e = i()) {
	return {
		seed: e,
		speed: 8,
		speedUnit: "gps",
		stopAtGeneration: null,
		stopWhenStable: !1
	};
}
function x(e, t) {
	let n = Math.max(2, Math.min(20, Math.floor(720 / Math.max(e, t))));
	return {
		cellSize: n,
		showGridLines: n >= 6
	};
}
function S(e) {
	let t = (e.now ?? /* @__PURE__ */ new Date()).toISOString(), n = b(e.seed), i = new g({
		model: e.model,
		width: e.width,
		height: e.height,
		seed: n.seed
	});
	e.fill !== "first" && i.randomize(new r(n.seed));
	let a = {
		meta: {
			name: e.name,
			description: e.description ?? "",
			author: e.author ?? "",
			createdAt: t,
			modifiedAt: t,
			template: e.template
		},
		model: e.model,
		width: e.width,
		height: e.height,
		settings: n,
		view: x(e.width, e.height),
		current: {
			cells: i.cells,
			ages: i.ages,
			generation: 0,
			rngState: i.rng.state
		},
		initial: i.cells.slice(),
		history: new _()
	};
	return a.history.record(0, i.counts), a;
}
function C(e) {
	return new g({
		model: e.model,
		width: e.width,
		height: e.height,
		cells: e.current.cells.slice(),
		ages: e.current.ages.slice(),
		generation: e.current.generation,
		seed: e.settings.seed,
		rngState: e.current.rngState
	});
}
//#endregion
//#region ../core/src/templates.ts
var w = (e, t, n = 1, r = "all") => ({
	target: e,
	combine: r,
	probability: n,
	conditions: t
}), T = [
	{
		id: "empty",
		name: "Leeres Projekt",
		category: "Eigenes",
		description: "Zwei Zustände ohne Regeln – Zustände, Regeln und Nachbarschaft legst du selbst fest.",
		defaultSize: {
			width: 60,
			height: 40
		},
		model: () => ({
			states: [{
				name: "Leer",
				color: "#0f1a13",
				initialShare: 100,
				rules: []
			}, {
				name: "Zustand 1",
				color: "#7cf283",
				initialShare: 0,
				rules: []
			}],
			neighborhood: s("moore"),
			boundary: { type: "torus" }
		})
	},
	{
		id: "gol",
		name: "Game of Life",
		category: "Klassiker",
		description: "Conways Klassiker: Geburt bei genau 3, Überleben bei 2 oder 3 lebenden Nachbarn.",
		defaultSize: {
			width: 80,
			height: 56
		},
		model: () => ({
			states: [{
				name: "Tot",
				color: "#0f1a13",
				initialShare: 70,
				rules: [w(1, [{
					type: "neighborCount",
					states: [1],
					op: "=",
					value: 3
				}])]
			}, {
				name: "Lebendig",
				color: "#7cf283",
				initialShare: 30,
				rules: [w(0, [{
					type: "neighborCount",
					states: [1],
					op: "<",
					value: 2
				}, {
					type: "neighborCount",
					states: [1],
					op: ">",
					value: 3
				}], 1, "any")]
			}],
			neighborhood: s("moore"),
			boundary: { type: "torus" }
		})
	},
	{
		id: "sir",
		name: "Epidemie (SIR)",
		category: "Biologie & Medizin",
		description: "Ansteckung mit 30 % Wahrscheinlichkeit pro Generation, Genesung nach 8 Generationen, nachlassende Immunität.",
		defaultSize: {
			width: 80,
			height: 56
		},
		model: () => ({
			states: [
				{
					name: "Gesund",
					color: "#3f7553",
					initialShare: 99.6,
					rules: [w(1, [{
						type: "neighborCount",
						states: [1],
						op: ">=",
						value: 1
					}], .3)]
				},
				{
					name: "Infiziert",
					color: "#ff9a3c",
					initialShare: .4,
					rules: [w(2, [{
						type: "age",
						op: ">=",
						value: 8
					}])]
				},
				{
					name: "Genesen",
					color: "#4ea3ff",
					initialShare: 0,
					rules: [w(0, [{
						type: "age",
						op: ">=",
						value: 40
					}], .1)]
				}
			],
			neighborhood: s("moore"),
			boundary: { type: "torus" }
		})
	},
	{
		id: "traffic",
		name: "Verkehrsfluss (Regel 184)",
		category: "Verkehr",
		description: "Jede Zeile ist eine Fahrspur nach rechts. Ein Fahrzeug fährt, wenn die Zelle vor ihm frei ist – ab etwa 50 % Dichte entstehen Staus, die rückwärts wandern.",
		defaultSize: {
			width: 120,
			height: 40
		},
		model: () => ({
			states: [
				{
					name: "Straße",
					color: "#24302a",
					initialShare: 45,
					rules: [w(1, [{
						type: "neighborAt",
						dx: -1,
						dy: 0,
						op: "!=",
						state: 0
					}])]
				},
				{
					name: "Fährt",
					color: "#4ea3ff",
					initialShare: 55,
					rules: [w(0, [{
						type: "neighborAt",
						dx: 1,
						dy: 0,
						op: "=",
						state: 0
					}]), w(2, [])]
				},
				{
					name: "Steht",
					color: "#ff9a3c",
					initialShare: 0,
					rules: [w(0, [{
						type: "neighborAt",
						dx: 1,
						dy: 0,
						op: "=",
						state: 0
					}])]
				}
			],
			neighborhood: c([{
				dx: -1,
				dy: 0
			}, {
				dx: 1,
				dy: 0
			}]),
			boundary: { type: "torus" }
		})
	},
	{
		id: "fire",
		name: "Waldbrand",
		category: "Physik & Umwelt",
		description: "Bäume wachsen nach, Feuer springt auf benachbarte Bäume über, selten schlägt ein Blitz ein.",
		defaultSize: {
			width: 100,
			height: 70
		},
		model: () => ({
			states: [
				{
					name: "Leer",
					color: "#1c1f1a",
					initialShare: 40,
					rules: [w(1, [], .02)]
				},
				{
					name: "Baum",
					color: "#2f6b3a",
					initialShare: 60,
					rules: [w(2, [{
						type: "neighborCount",
						states: [2],
						op: ">=",
						value: 1
					}]), w(2, [], 2e-4)]
				},
				{
					name: "Brennt",
					color: "#ff9a3c",
					initialShare: 0,
					rules: [w(0, [])]
				}
			],
			neighborhood: s("vonNeumann"),
			boundary: {
				type: "fixed",
				state: 0
			}
		})
	},
	{
		id: "brain",
		name: "Brian’s Brain",
		category: "Klassiker",
		description: "Feuern, erholen, ruhen: Aus drei Zuständen entstehen wandernde Muster.",
		defaultSize: {
			width: 80,
			height: 56
		},
		model: () => ({
			states: [
				{
					name: "Ruhe",
					color: "#0f1a13",
					initialShare: 80,
					rules: [w(1, [{
						type: "neighborCount",
						states: [1],
						op: "=",
						value: 2
					}])]
				},
				{
					name: "Feuert",
					color: "#e3ece5",
					initialShare: 10,
					rules: [w(2, [])]
				},
				{
					name: "Erholt",
					color: "#4ea3ff",
					initialShare: 10,
					rules: [w(0, [])]
				}
			],
			neighborhood: s("moore"),
			boundary: { type: "torus" }
		})
	}
], E = Uint8Array, D = Uint16Array, O = Int32Array, ee = new E([
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	4,
	4,
	4,
	4,
	5,
	5,
	5,
	5,
	0,
	0,
	0,
	0
]), te = new E([
	0,
	0,
	0,
	0,
	1,
	1,
	2,
	2,
	3,
	3,
	4,
	4,
	5,
	5,
	6,
	6,
	7,
	7,
	8,
	8,
	9,
	9,
	10,
	10,
	11,
	11,
	12,
	12,
	13,
	13,
	0,
	0
]), ne = new E([
	16,
	17,
	18,
	0,
	8,
	7,
	9,
	6,
	10,
	5,
	11,
	4,
	12,
	3,
	13,
	2,
	14,
	1,
	15
]), re = function(e, t) {
	for (var n = new D(31), r = 0; r < 31; ++r) n[r] = t += 1 << e[r - 1];
	for (var i = new O(n[30]), r = 1; r < 30; ++r) for (var a = n[r]; a < n[r + 1]; ++a) i[a] = a - n[r] << 5 | r;
	return {
		b: n,
		r: i
	};
}, ie = re(ee, 2), ae = ie.b, oe = ie.r;
ae[28] = 258, oe[258] = 28;
var k = re(te, 0), se = k.b;
k.r;
for (var A = new D(32768), j = 0; j < 32768; ++j) {
	var M = (j & 43690) >> 1 | (j & 21845) << 1;
	M = (M & 52428) >> 2 | (M & 13107) << 2, M = (M & 61680) >> 4 | (M & 3855) << 4, A[j] = ((M & 65280) >> 8 | (M & 255) << 8) >> 1;
}
for (var N = (function(e, t, n) {
	for (var r = e.length, i = 0, a = new D(t); i < r; ++i) e[i] && ++a[e[i] - 1];
	var o = new D(t);
	for (i = 1; i < t; ++i) o[i] = o[i - 1] + a[i - 1] << 1;
	var s;
	if (n) {
		s = new D(1 << t);
		var c = 15 - t;
		for (i = 0; i < r; ++i) if (e[i]) for (var l = i << 4 | e[i], u = t - e[i], d = o[e[i] - 1]++ << u, f = d | (1 << u) - 1; d <= f; ++d) s[A[d] >> c] = l;
	} else for (s = new D(r), i = 0; i < r; ++i) e[i] && (s[i] = A[o[e[i] - 1]++] >> 15 - e[i]);
	return s;
}), P = new E(288), j = 0; j < 144; ++j) P[j] = 8;
for (var j = 144; j < 256; ++j) P[j] = 9;
for (var j = 256; j < 280; ++j) P[j] = 7;
for (var j = 280; j < 288; ++j) P[j] = 8;
for (var ce = new E(32), j = 0; j < 32; ++j) ce[j] = 5;
var le = /*#__PURE__*/ N(P, 9, 1), ue = /*#__PURE__*/ N(ce, 5, 1), de = function(e) {
	for (var t = e[0], n = 1; n < e.length; ++n) e[n] > t && (t = e[n]);
	return t;
}, F = function(e, t, n) {
	var r = t / 8 | 0;
	return (e[r] | e[r + 1] << 8) >> (t & 7) & n;
}, fe = function(e, t) {
	var n = t / 8 | 0;
	return (e[n] | e[n + 1] << 8 | e[n + 2] << 16) >> (t & 7);
}, pe = function(e) {
	return (e + 7) / 8 | 0;
}, me = function(e, t, n) {
	return (t == null || t < 0) && (t = 0), (n == null || n > e.length) && (n = e.length), new E(e.subarray(t, n));
}, he = [
	"unexpected EOF",
	"invalid block type",
	"invalid length/literal",
	"invalid distance",
	"stream finished",
	"no stream handler",
	,
	"no callback",
	"invalid UTF-8 data",
	"extra field too long",
	"date not in range 1980-2099",
	"filename too long",
	"stream finishing",
	"invalid zip data"
], I = function(e, t, n) {
	var r = Error(t || he[e]);
	if (r.code = e, Error.captureStackTrace && Error.captureStackTrace(r, I), !n) throw r;
	return r;
}, L = function(e, t, n, r) {
	var i = e.length, a = r ? r.length : 0;
	if (!i || t.f && !t.l) return n || new E(0);
	var o = !n, s = o || t.i != 2, c = t.i;
	o && (n = new E(i * 3));
	var l = function(e) {
		var t = n.length;
		if (e > t) {
			var r = new E(Math.max(t * 2, e));
			r.set(n), n = r;
		}
	}, u = t.f || 0, d = t.p || 0, f = t.b || 0, p = t.l, m = t.d, h = t.m, g = t.n, _ = i * 8;
	do {
		if (!p) {
			u = F(e, d, 1);
			var v = F(e, d + 1, 3);
			if (d += 3, !v) {
				var y = pe(d) + 4, b = e[y - 4] | e[y - 3] << 8, x = y + b;
				if (x > i) {
					c && I(0);
					break;
				}
				s && l(f + b), n.set(e.subarray(y, x), f), t.b = f += b, t.p = d = x * 8, t.f = u;
				continue;
			}
			if (v == 1) p = le, m = ue, h = 9, g = 5;
			else if (v == 2) {
				var S = F(e, d, 31) + 257, C = F(e, d + 10, 15) + 4, w = S + F(e, d + 5, 31) + 1;
				d += 14;
				for (var T = new E(w), D = new E(19), O = 0; O < C; ++O) D[ne[O]] = F(e, d + O * 3, 7);
				d += C * 3;
				for (var re = de(D), ie = (1 << re) - 1, oe = N(D, re, 1), O = 0; O < w;) {
					var k = oe[F(e, d, ie)];
					d += k & 15;
					var y = k >> 4;
					if (y < 16) T[O++] = y;
					else {
						var A = 0, j = 0;
						for (y == 16 ? (j = 3 + F(e, d, 3), d += 2, A = T[O - 1]) : y == 17 ? (j = 3 + F(e, d, 7), d += 3) : y == 18 && (j = 11 + F(e, d, 127), d += 7); j--;) T[O++] = A;
					}
				}
				var M = T.subarray(0, S), P = T.subarray(S);
				h = de(M), g = de(P), p = N(M, h, 1), m = N(P, g, 1);
			} else I(1);
			if (d > _) {
				c && I(0);
				break;
			}
		}
		s && l(f + 131072);
		for (var ce = (1 << h) - 1, he = (1 << g) - 1, L = d;; L = d) {
			var A = p[fe(e, d) & ce], R = A >> 4;
			if (d += A & 15, d > _) {
				c && I(0);
				break;
			}
			if (A || I(2), R < 256) n[f++] = R;
			else if (R == 256) {
				L = d, p = null;
				break;
			} else {
				var z = R - 254;
				if (R > 264) {
					var O = R - 257, B = ee[O];
					z = F(e, d, (1 << B) - 1) + ae[O], d += B;
				}
				var V = m[fe(e, d) & he], H = V >> 4;
				V || I(3), d += V & 15;
				var P = se[H];
				if (H > 3) {
					var B = te[H];
					P += fe(e, d) & (1 << B) - 1, d += B;
				}
				if (d > _) {
					c && I(0);
					break;
				}
				s && l(f + 131072);
				var U = f + z;
				if (f < P) {
					var ge = a - P, W = Math.min(P, U);
					for (ge + f < 0 && I(3); f < W; ++f) n[f] = r[ge + f];
				}
				for (; f < U; ++f) n[f] = n[f - P];
			}
		}
		t.l = p, t.p = L, t.b = f, t.f = u, p && (u = 1, t.m = h, t.d = m, t.n = g);
	} while (!u);
	return f != n.length && o ? me(n, 0, f) : n.subarray(0, f);
}, R = /*#__PURE__*/ new E(0), z = function(e, t) {
	return e[t] | e[t + 1] << 8;
}, B = function(e, t) {
	return (e[t] | e[t + 1] << 8 | e[t + 2] << 16 | e[t + 3] << 24) >>> 0;
}, V = function(e, t) {
	return B(e, t) + B(e, t + 4) * 4294967296;
};
function H(e, t) {
	return L(e, { i: 2 }, t && t.out, t && t.dictionary);
}
var U = typeof TextDecoder < "u" && /*#__PURE__*/ new TextDecoder();
try {
	U.decode(R, { stream: !0 });
} catch {}
var ge = function(e) {
	for (var t = "", n = 0;;) {
		var r = e[n++], i = (r > 127) + (r > 223) + (r > 239);
		if (n + i > e.length) return {
			s: t,
			r: me(e, n - 1)
		};
		i ? i == 3 ? (r = ((r & 15) << 18 | (e[n++] & 63) << 12 | (e[n++] & 63) << 6 | e[n++] & 63) - 65536, t += String.fromCharCode(55296 | r >> 10, 56320 | r & 1023)) : i & 1 ? t += String.fromCharCode((r & 31) << 6 | e[n++] & 63) : t += String.fromCharCode((r & 15) << 12 | (e[n++] & 63) << 6 | e[n++] & 63) : t += String.fromCharCode(r);
	}
};
function W(e, t) {
	if (t) {
		for (var n = "", r = 0; r < e.length; r += 16384) n += String.fromCharCode.apply(null, e.subarray(r, r + 16384));
		return n;
	}
	if (U) return U.decode(e);
	var i = ge(e), a = i.s, n = i.r;
	return n.length && I(8), a;
}
var _e = function(e, t) {
	return t + 30 + z(e, t + 26) + z(e, t + 28);
}, ve = function(e, t, n) {
	var r = z(e, t + 28), i = z(e, t + 30), a = W(e.subarray(t + 46, t + 46 + r), !(z(e, t + 8) & 2048)), o = t + 46 + r, s = ye(e, o, i, n, B(e, t + 20), B(e, t + 24), B(e, t + 42)), c = s[0], l = s[1], u = s[2];
	return [
		z(e, t + 10),
		c,
		l,
		a,
		o + i + z(e, t + 32),
		u
	];
}, ye = function(e, t, n, r, i, a, o) {
	var s = i == 4294967295, c = a == 4294967295, l = o == 4294967295, u = t + n, d = s + c + l;
	if (r && d) {
		for (; t + 4 < u; t += 4 + z(e, t + 2)) if (z(e, t) == 1) return [
			s ? V(e, t + 4 + 8 * c) : i,
			c ? V(e, t + 4) : a,
			l ? V(e, t + 4 + 8 * (c + s)) : o,
			1
		];
		r < 2 && I(13);
	}
	return [
		i,
		a,
		o,
		0
	];
};
function be(e, t) {
	for (var n = {}, r = e.length - 22; B(e, r) != 101010256; --r) (!r || e.length - r > 65558) && I(13);
	var i = z(e, r + 8);
	if (!i) return {};
	var a = B(e, r + 16), o = B(e, r - 20) == 117853008;
	if (o) {
		var s = B(e, r - 12);
		o = B(e, s) == 101075792, o && (i = B(e, s + 32), a = B(e, s + 48));
	}
	for (var c = t && t.filter, l = 0; l < i; ++l) {
		var u = ve(e, a, o), d = u[0], f = u[1], p = u[2], m = u[3], h = u[4], g = u[5], _ = _e(e, g);
		a = h, (!c || c({
			name: m,
			size: f,
			originalSize: p,
			compression: d
		})) && (d ? d == 8 ? n[m] = H(e.subarray(_, _ + f), { out: new E(p) }) : I(14, "unknown compression type " + d) : n[m] = me(e, _, _ + f));
	}
	return n;
}
var xe = class e {
	maxLength;
	generations = [];
	series = [];
	constructor(e = 1e5) {
		this.maxLength = e;
	}
	get length() {
		return this.generations.length;
	}
	record(e, t) {
		for (; this.series.length < t.length;) this.addSeries();
		let n = this.generations.length - 1;
		if (n >= 0 && this.generations[n] === e) {
			t.forEach((e, t) => this.series[t][n] = e);
			return;
		}
		if (n >= 0 && e < this.generations[n] && this.truncateAfter(e - 1), this.generations.push(e), this.series.forEach((e, n) => e.push(n < t.length ? t[n] : -1)), this.generations.length > this.maxLength) {
			let e = this.generations.length - this.maxLength;
			this.generations.splice(0, e);
			for (let t of this.series) t.splice(0, e);
		}
	}
	addSeries() {
		this.series.push(Array(this.generations.length).fill(-1));
	}
	removeSeries(e) {
		this.series.splice(e, 1);
	}
	truncateAfter(e) {
		let t = this.generations.length;
		for (; t > 0 && this.generations[t - 1] > e;) t--;
		this.generations.length = t;
		for (let e of this.series) e.length = t;
	}
	clear() {
		this.generations = [], this.series = this.series.map(() => []);
	}
	summary(e, t, n = this.length) {
		let r = this.series[e] ?? [], i = Math.max(0, this.length - n), a = Array(t).fill(0), o = Array(t).fill(0), s = 0, c = 0, l = -1, u = 0;
		for (let e = i; e < this.length; e++) {
			let n = r[e];
			if (n === -1 || n === void 0 || n >= t) {
				l = -1, u = 0;
				continue;
			}
			s++, a[n]++, n === l ? u++ : (l !== -1 && c++, u = 1, l = n), u > o[n] && (o[n] = u);
		}
		return {
			observed: s,
			time: a,
			changes: c,
			longestRun: o,
			currentState: l,
			currentRun: l === -1 ? 0 : u
		};
	}
	toCSV(e, t) {
		let n = (e) => /[";\n]/.test(e) ? `"${e.replace(/"/g, "\"\"")}"` : e, r = [["Generation", ...e.map((e) => `${e.name} (${e.x + 1}|${e.y + 1})`)].map(n).join(";")];
		for (let i = 0; i < this.length; i++) {
			let a = e.map((e, r) => {
				let a = this.series[r]?.[i] ?? -1;
				return a === -1 ? "" : n(t[a] ?? String(a));
			});
			r.push([String(this.generations[i]), ...a].join(";"));
		}
		return r.join("\n") + "\n";
	}
	toJSON() {
		return {
			generations: this.generations.slice(),
			series: this.series.map((e) => e.slice())
		};
	}
	static fromJSON(t, n) {
		let r = new e(n);
		return r.generations = t.generations.slice(), r.series = t.series.map((e) => {
			let t = e.slice(0, r.generations.length);
			for (; t.length < r.generations.length;) t.push(-1);
			return t;
		}), r;
	}
}, Se = "autocell-project", G = class extends Error {
	path;
	constructor(e, t) {
		super(t ? `${t}: ${e}` : e), this.path = t, this.name = "AcpError";
	}
};
function Ce(e, t, n, r = "rle") {
	let i = [];
	for (let a of e.trim().split(/[\s,]+/)) {
		if (!a) continue;
		let e = /^(?:(\d+)\*)?(\d+)$/.exec(a);
		if (!e) throw new G(`Ungültiger Eintrag „${a}“`, r);
		let o = e[1] ? parseInt(e[1], 10) : 1, s = parseInt(e[2], 10);
		if (s >= n) throw new G(`Zustand ${s} existiert nicht`, r);
		if (i.length + o > t) throw new G(`Mehr Zellen als das Raster hat (${t})`, r);
		for (let e = 0; e < o; e++) i.push(s);
	}
	if (i.length !== t) throw new G(`${i.length} statt ${t} Zellen`, r);
	return i;
}
function we(e) {
	if (e.length === 0) return "empty";
	if (e[0] === 80 && e[1] === 75 && e[2] === 3 && e[3] === 4) return "zip";
	let t = 0;
	e[0] === 239 && e[1] === 187 && e[2] === 191 && (t = 3);
	let n = t;
	for (; n < e.length && (e[n] === 32 || e[n] === 10 || e[n] === 13 || e[n] === 9);) n++;
	if (e[n] === 123) return "json";
	let r = e.subarray(0, Math.min(e.length, 4096));
	for (let e of r) if (e === 0 || e < 9) return "binary";
	return "text";
}
function K(e) {
	let t = W(e);
	return t.charCodeAt(0) === 65279 ? t.slice(1) : t;
}
function Te(e) {
	let t = we(e);
	if (t === "zip") {
		let t;
		try {
			t = be(e);
		} catch {
			throw new G("Die Datei ist beschädigt (ZIP-Container nicht lesbar).");
		}
		let n = t.mimetype ? W(t.mimetype).trim() : null;
		if (n !== null && n !== "application/vnd.autocell.project+zip") throw new G(`Unerwarteter Dateityp „${n}“.`);
		let r = t["project.json"];
		if (!r) throw new G("project.json fehlt – keine AutoCell-Projektdatei.");
		return Me(q(K(r)), (e) => t[e]);
	}
	if (t === "json") return Me(q(K(e)), () => void 0);
	throw new G("Keine AutoCell-Projektdatei.");
}
function q(e) {
	try {
		return JSON.parse(e);
	} catch (e) {
		throw new G(`project.json ist kein gültiges JSON (${e.message}).`);
	}
}
var J = (e) => typeof e == "object" && !!e && !Array.isArray(e);
function Y(e, t, n) {
	if (!e) throw new G(t, n);
}
function X(e, t, n, r) {
	return Y(typeof e == "number" && Number.isInteger(e), "ganze Zahl erwartet", t), Y(e >= n && e <= r, `Wert muss zwischen ${n} und ${r} liegen`, t), e;
}
function Ee(e, t, n, r) {
	return Y(typeof e == "number" && Number.isFinite(e), "Zahl erwartet", t), Y(e >= n && e <= r, `Wert muss zwischen ${n} und ${r} liegen`, t), e;
}
function Z(e, t, n) {
	return e === void 0 && n !== void 0 ? n : (Y(typeof e == "string", "Text erwartet", t), e);
}
var De = /^#[0-9a-fA-F]{6}$/;
function Oe(t, n) {
	return Y(typeof t == "string" && e.includes(t), `Vergleich muss einer von ${e.join(" ")} sein`, n), t;
}
function ke(e, t, r) {
	Y(J(e), "Objekt erwartet", t);
	let i = e;
	switch (i.type) {
		case "neighborCount": return Y(Array.isArray(i.states), "Liste von Zuständen erwartet", `${t}.states`), {
			type: "neighborCount",
			states: i.states.map((e, n) => X(e, `${t}.states[${n}]`, 0, r - 1)),
			op: Oe(i.op, `${t}.op`),
			value: X(i.value, `${t}.value`, 0, 1e6)
		};
		case "neighborAt": {
			let e = i.op;
			return Y(e === "=" || e === "!=", "Vergleich muss = oder != sein", `${t}.op`), {
				type: "neighborAt",
				dx: X(i.dx, `${t}.dx`, -n, n),
				dy: X(i.dy, `${t}.dy`, -n, n),
				op: e,
				state: X(i.state, `${t}.state`, 0, r - 1)
			};
		}
		case "age": return {
			type: "age",
			op: Oe(i.op, `${t}.op`),
			value: X(i.value, `${t}.value`, 0, 4294967295)
		};
		default: throw new G(`Unbekannte Bedingungsart „${String(i.type)}“`, `${t}.type`);
	}
}
function Ae(e) {
	Y(J(e), "Objekt erwartet", "model");
	let n = e;
	Y(Array.isArray(n.states) && n.states.length >= 1, "mindestens ein Zustand erforderlich", "model.states");
	let r = n.states;
	Y(r.length <= t, `höchstens ${t} Zustände`, "model.states");
	let i = r.length, a = r.map((e, t) => {
		let n = `model.states[${t}]`;
		Y(J(e), "Objekt erwartet", n);
		let r = e, a = Z(r.color, `${n}.color`);
		Y(De.test(a), "Farbe im Format #rrggbb erwartet", `${n}.color`);
		let o = r.rules === void 0 ? [] : r.rules;
		Y(Array.isArray(o), "Liste erwartet", `${n}.rules`);
		let s = o.map((e, t) => {
			let r = `${n}.rules[${t}]`;
			Y(J(e), "Objekt erwartet", r);
			let a = e, o = a.combine === void 0 ? "all" : a.combine;
			Y(o === "all" || o === "any", "„all“ oder „any“ erwartet", `${r}.combine`);
			let s = a.conditions === void 0 ? [] : a.conditions;
			Y(Array.isArray(s), "Liste erwartet", `${r}.conditions`);
			let c = {
				target: X(a.target, `${r}.target`, 0, i - 1),
				combine: o,
				probability: a.probability === void 0 ? 1 : Ee(a.probability, `${r}.probability`, 0, 1),
				conditions: s.map((e, t) => ke(e, `${r}.conditions[${t}]`, i))
			};
			return a.enabled === !1 && (c.enabled = !1), typeof a.note == "string" && a.note && (c.note = a.note), c;
		}), c = {
			name: Z(r.name, `${n}.name`),
			color: a.toLowerCase(),
			initialShare: r.initialShare === void 0 ? 0 : Ee(r.initialShare, `${n}.initialShare`, 0, 1e9),
			rules: s
		};
		return typeof r.description == "string" && r.description && (c.description = r.description), c;
	}), o = n.neighborhood;
	Y(J(o), "Objekt erwartet", "model.neighborhood");
	let s = o;
	Y(Array.isArray(s.offsets), "Liste von [dx, dy] erwartet", "model.neighborhood.offsets");
	let c = /* @__PURE__ */ new Set(), u = s.offsets.map((e, t) => {
		let n = `model.neighborhood.offsets[${t}]`;
		Y(Array.isArray(e) && e.length === 2, "[dx, dy] erwartet", n);
		let r = X(e[0], `${n}[0]`, -64, 64), i = X(e[1], `${n}[1]`, -64, 64);
		return Y(r !== 0 || i !== 0, "(0, 0) ist die Zelle selbst – dafür „includeSelf“ verwenden", n), Y(!c.has(`${r},${i}`), "doppelter Eintrag", n), c.add(`${r},${i}`), {
			dx: r,
			dy: i
		};
	}), d = n.boundary;
	Y(J(d), "Objekt erwartet", "model.boundary");
	let f = d, p;
	if (f.type === "torus" || f.type === "mirror") p = { type: f.type };
	else if (f.type === "fixed") p = {
		type: "fixed",
		state: X(f.state, "model.boundary.state", 0, i - 1)
	};
	else throw new G("„torus“, „fixed“ oder „mirror“ erwartet", "model.boundary.type");
	return {
		states: a,
		neighborhood: {
			preset: l(u),
			offsets: u,
			includeSelf: s.includeSelf === !0
		},
		boundary: p
	};
}
function je(e, t, n, r, i, a) {
	let o = r <= 256 ? new Uint8Array(n) : new Uint16Array(n);
	Y(J(e), "Objekt mit „file“, „rle“ oder „fill“ erwartet", t);
	let s = e;
	if (typeof s.file == "string") {
		let e = a(s.file);
		Y(e !== void 0, `Datei „${s.file}“ fehlt im Archiv`, t);
		let c = i === "u16" ? 2 : 1;
		Y(e.length === n * c, `„${s.file}“ hat ${e.length} Byte, erwartet ${n * c}`, t);
		let l = new DataView(e.buffer, e.byteOffset, e.byteLength);
		for (let i = 0; i < n; i++) {
			let n = c === 2 ? l.getUint16(i * 2, !0) : e[i];
			Y(n < r, `Zelle ${i} hat unbekannten Zustand ${n}`, t), o[i] = n;
		}
		return o;
	}
	if (typeof s.rle == "string") return o.set(Ce(s.rle, n, r, `${t}.rle`)), o;
	if (s.fill !== void 0) return o.fill(X(s.fill, `${t}.fill`, 0, r - 1)), o;
	throw new G("„file“, „rle“ oder „fill“ erwartet", t);
}
function Me(e, t = () => void 0) {
	Y(J(e), "Objekt erwartet", "(Wurzel)");
	let r = e;
	Y(r.format === Se, "keine AutoCell-Projektdatei", "format");
	let i = X(r.formatVersion, "formatVersion", 1, 2 ** 53 - 1);
	if (i > 1) throw new G(`Die Datei verwendet Format ${i}${J(r.createdWith) ? ` (${String(r.createdWith.app)} ${String(r.createdWith.version)})` : ""} – bitte AutoCell aktualisieren.`);
	Y(J(r.meta), "Objekt erwartet", "meta");
	let a = r.meta;
	Y(J(r.grid), "Objekt erwartet", "grid");
	let o = r.grid, s = X(o.width, "grid.width", 1, n), c = X(o.height, "grid.height", 1, n), l = s * c, u = Ae(r.model), d = u.states.length, f = J(r.simulation) ? r.simulation : {}, p = J(r.view) ? r.view : {}, m = J(r.data) ? r.data : {}, h = m.cellEncoding === void 0 ? d > 256 ? "u16" : "u8" : m.cellEncoding;
	Y(h === "u8" || h === "u16", "„u8“ oder „u16“ erwartet", "data.cellEncoding"), Y(!(h === "u8" && d > 256), "mehr als 256 Zustände benötigen „u16“", "data.cellEncoding");
	let g = m.cells === void 0 ? je({ fill: 0 }, "data.cells", l, d, h, t) : je(m.cells, "data.cells", l, d, h, t), v = new Uint32Array(l);
	if (J(m.ages) && typeof m.ages.file == "string") {
		let e = t(m.ages.file);
		Y(e !== void 0, `Datei „${m.ages.file}“ fehlt im Archiv`, "data.ages"), Y(e.length === l * 4, `„${m.ages.file}“ hat die falsche Größe`, "data.ages");
		let n = new DataView(e.buffer, e.byteOffset, e.byteLength);
		v = new Uint32Array(l);
		for (let e = 0; e < l; e++) v[e] = n.getUint32(e * 4, !0);
	}
	let y = m.initial === void 0 || m.initial === null ? null : je(m.initial, "data.initial", l, d, h, t), b = new _(), x = m.history;
	if (J(x)) {
		let e = x;
		if (typeof x.file == "string") {
			let n = t(x.file);
			Y(n !== void 0, `Datei „${x.file}“ fehlt im Archiv`, "data.history"), e = q(K(n));
		}
		Y(J(e) && Array.isArray(e.generations) && Array.isArray(e.counts), "{ generations, counts } erwartet", "data.history");
		let n = e;
		Y(n.generations.length === n.counts.length, "generations und counts sind unterschiedlich lang", "data.history"), b = _.fromJSON({
			generations: n.generations.map((e, t) => X(e, `data.history.generations[${t}]`, 0, 2 ** 53 - 1)),
			counts: n.counts.map((e, t) => (Y(Array.isArray(e), "Liste erwartet", `data.history.counts[${t}]`), e.map((e) => typeof e == "number" ? e : 0)))
		});
	}
	let S = [];
	r.probes !== void 0 && (Y(Array.isArray(r.probes), "Liste erwartet", "probes"), S = r.probes.map((e, t) => {
		let n = `probes[${t}]`;
		Y(J(e), "Objekt erwartet", n);
		let r = e;
		return {
			name: Z(r.name, `${n}.name`),
			x: X(r.x, `${n}.x`, 0, s - 1),
			y: X(r.y, `${n}.y`, 0, c - 1)
		};
	}));
	let C = new xe(), w = m.probeHistory;
	if (J(w) && S.length > 0) {
		let e = w;
		if (typeof w.file == "string") {
			let n = t(w.file);
			Y(n !== void 0, `Datei „${w.file}“ fehlt im Archiv`, "data.probeHistory"), e = q(K(n));
		}
		Y(J(e) && Array.isArray(e.generations) && Array.isArray(e.series), "{ generations, series } erwartet", "data.probeHistory");
		let n = e;
		Y(n.series.length === S.length, "series passt nicht zur Zahl der Messpunkte", "data.probeHistory"), C = xe.fromJSON({
			generations: n.generations.map((e, t) => X(e, `data.probeHistory.generations[${t}]`, 0, 2 ** 53 - 1)),
			series: n.series.map((e, t) => (Y(Array.isArray(e), "Liste erwartet", `data.probeHistory.series[${t}]`), e.map((e) => Number.isInteger(e) && e >= 0 && e < d ? e : -1)))
		});
	}
	for (; C.series.length < S.length;) C.addSeries();
	let T = (/* @__PURE__ */ new Date()).toISOString(), E = f.speedUnit === "spg" ? "spg" : "gps";
	return {
		meta: {
			name: Z(a.name, "meta.name"),
			description: Z(a.description, "meta.description", ""),
			author: Z(a.author, "meta.author", ""),
			createdAt: Z(a.createdAt, "meta.createdAt", T),
			modifiedAt: Z(a.modifiedAt, "meta.modifiedAt", T),
			...typeof a.template == "string" ? { template: a.template } : {}
		},
		model: u,
		width: s,
		height: c,
		settings: {
			seed: f.seed === void 0 ? 1 : X(f.seed, "simulation.seed", 0, 4294967295),
			speed: f.speed === void 0 ? 8 : Ee(f.speed, "simulation.speed", .01, 1e3),
			speedUnit: E,
			stopAtGeneration: f.stopAtGeneration === void 0 || f.stopAtGeneration === null ? null : X(f.stopAtGeneration, "simulation.stopAtGeneration", 1, 2 ** 53 - 1),
			stopWhenStable: f.stopWhenStable === !0
		},
		view: {
			cellSize: p.cellSize === void 0 ? 10 : Ee(p.cellSize, "view.cellSize", 1, 100),
			showGridLines: p.showGridLines !== !1
		},
		current: {
			cells: g,
			ages: v,
			generation: m.generation === void 0 ? 0 : X(m.generation, "data.generation", 0, 2 ** 53 - 1),
			rngState: m.rngState === void 0 ? 1 : X(m.rngState, "data.rngState", 0, 4294967295)
		},
		initial: y,
		history: b,
		probes: S,
		probeLog: C
	};
}
//#endregion
//#region src/source.ts
var Ne = T.filter((e) => e.id !== "empty").map((e) => e.id), Q = class extends Error {
	constructor(e) {
		super(e), this.name = "PlayerError";
	}
};
function Pe(e) {
	let t = we(e);
	if (t !== "zip" && t !== "json") throw new Q("Keine AutoCell-Projektdatei (.acp oder .json erwartet).");
	try {
		return Te(e);
	} catch (e) {
		throw e instanceof G ? new Q(e.message) : e;
	}
}
function Fe(e) {
	return Pe(new TextEncoder().encode(e));
}
function Ie(e, t) {
	let n = e === null ? NaN : parseInt(e, 10);
	return Number.isFinite(n) ? Math.max(3, Math.min(1e3, n)) : t;
}
function Le(e, t, n, r) {
	let i = T.find((t) => t.id === e && t.id !== "empty");
	if (!i) throw new Q(`Unbekannte Vorlage „${e}“. Möglich sind: ${Ne.join(", ")}.`);
	let a = r === null ? NaN : parseInt(r, 10);
	return S({
		name: i.name,
		model: i.model(),
		width: Ie(t, i.defaultSize.width),
		height: Ie(n, i.defaultSize.height),
		template: i.id,
		...Number.isFinite(a) ? { seed: a >>> 0 } : {}
	});
}
function Re(e, t) {
	let n = e === null ? NaN : parseFloat(e);
	return Number.isFinite(n) && n > 0 ? Math.min(1e3, Math.max(.1, n)) : t;
}
var ze = class {
	speed;
	acc = 0;
	constructor(e) {
		this.speed = e;
	}
	reset() {
		this.acc = 0;
	}
	due(e, t = 1e3) {
		this.acc += Math.max(0, Math.min(e, 250));
		let n = 1e3 / this.speed, r = Math.floor(this.acc / n);
		return this.acc -= r * n, r > t ? (this.acc = 0, t) : r;
	}
	drop() {
		this.acc = 0;
	}
}, Be = "\n:host {\n  --autocell-bar-bg: #eef1ef;\n  --autocell-bar-fg: #1d2420;\n  --autocell-bar-muted: #5f6b64;\n  --autocell-bar-hover: rgba(0, 0, 0, 0.08);\n  --autocell-max-height: none;\n  display: block;\n  font: 13px/1.3 system-ui, -apple-system, \"Segoe UI\", sans-serif;\n  color: var(--autocell-bar-fg);\n}\n@media (prefers-color-scheme: dark) {\n  :host {\n    --autocell-bar-bg: #1d2420;\n    --autocell-bar-fg: #e3ece5;\n    --autocell-bar-muted: #9aa8a0;\n    --autocell-bar-hover: rgba(255, 255, 255, 0.1);\n  }\n}\n:host([hidden]) { display: none; }\n[hidden] { display: none !important; }\n.stage {\n  position: relative;\n  width: 100%;\n  max-height: var(--autocell-max-height);\n  display: grid;\n  place-items: center;\n  overflow: hidden;\n}\ncanvas { display: block; touch-action: none; }\ncanvas.interactive { cursor: crosshair; }\n.msg {\n  position: absolute;\n  inset: 0;\n  display: grid;\n  place-items: center;\n  padding: 16px;\n  text-align: center;\n  background: var(--autocell-bar-bg);\n  color: var(--autocell-bar-muted);\n}\n.bar {\n  display: flex;\n  align-items: center;\n  gap: 2px;\n  padding: 4px 6px;\n  background: var(--autocell-bar-bg);\n}\nbutton {\n  display: grid;\n  place-items: center;\n  width: 32px;\n  height: 32px;\n  padding: 0;\n  border: 0;\n  border-radius: 6px;\n  background: none;\n  color: inherit;\n  cursor: pointer;\n}\nbutton:hover { background: var(--autocell-bar-hover); }\nbutton:focus-visible, a:focus-visible { outline: 2px solid currentColor; outline-offset: 1px; }\n.gen { margin-left: 8px; font-variant-numeric: tabular-nums; color: var(--autocell-bar-muted); }\n.spacer { flex: 1; }\n.brand { color: var(--autocell-bar-muted); font-size: 12px; text-decoration: none; padding: 0 4px; }\n.brand:hover { text-decoration: underline; }\n.legend {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 4px 14px;\n  padding: 6px 10px;\n  background: var(--autocell-bar-bg);\n  color: var(--autocell-bar-muted);\n}\n.bar + .legend { padding-top: 0; }\n.item { display: inline-flex; align-items: center; gap: 6px; }\n.item i { width: 11px; height: 11px; border-radius: 2px; box-shadow: inset 0 0 0 1px rgba(128, 128, 128, 0.4); }\n.item b { font-weight: 600; color: var(--autocell-bar-fg); font-variant-numeric: tabular-nums; }\n", Ve = "https://delbonum.github.io/autocell/", He = 1500, Ue = 14, $ = {
	play: "<path d=\"M7 4.5v15l12.5-7.5z\" fill=\"currentColor\"/>",
	pause: "<path d=\"M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z\" fill=\"currentColor\"/>",
	step: "<path d=\"M5 4.5v15l10-7.5zM16.5 4.5h3v15h-3z\" fill=\"currentColor\"/>",
	reset: "<path d=\"M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4v4h4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>"
}, We = (e) => `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">${e}</svg>`;
function Ge(e) {
	return Uint32Array.from(e.model.states, (e) => {
		let t = parseInt(e.color.slice(1), 16) || 0;
		return (255 << 24 | (t & 255) << 16 | t & 65280 | t >> 16 & 255) >>> 0;
	});
}
function Ke() {
	return typeof matchMedia == "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
var qe = class extends HTMLElement {
	static observedAttributes = [
		"src",
		"template",
		"cols",
		"rows",
		"seed",
		"speed",
		"controls",
		"legend",
		"interactive"
	];
	root;
	stage;
	canvas;
	buffer = document.createElement("canvas");
	msg;
	bar;
	playBtn;
	stepBtn;
	genLabel;
	legendBox;
	project = null;
	sim = null;
	start = null;
	detector = new y(200);
	lut = /* @__PURE__ */ new Uint32Array();
	clock = new ze(8);
	cellPx = 1;
	_playing = !1;
	visible = !0;
	raf = 0;
	lastTime = 0;
	loopTimer = 0;
	loadToken = 0;
	reloadQueued = !1;
	manual = !1;
	painting = null;
	resizeObs = new ResizeObserver(() => this.layout());
	visObs = new IntersectionObserver((e) => {
		this.visible = e.some((e) => e.isIntersecting), this.visible && this._playing && this.schedule();
	});
	constructor() {
		super(), this.root = this.attachShadow({ mode: "open" }), this.root.innerHTML = `
      <style>${Be}</style>
      <div class="stage" part="stage"><canvas part="canvas" role="img"></canvas><div class="msg" hidden></div></div>
      <div class="bar" part="controls">
        <button class="play" type="button" aria-label="Start">${We($.play)}</button>
        <button class="step" type="button" aria-label="Einzelschritt">${We($.step)}</button>
        <button class="reset" type="button" aria-label="Zurücksetzen">${We($.reset)}</button>
        <span class="gen" aria-live="off">Gen. 0</span>
        <span class="spacer"></span>
        <a class="brand" href="${Ve}" target="_blank" rel="noopener">AutoCell</a>
      </div>
      <div class="legend" part="legend"></div>`;
		let e = (e) => this.root.querySelector(e);
		this.stage = e(".stage"), this.canvas = e("canvas"), this.msg = e(".msg"), this.bar = e(".bar"), this.playBtn = e(".play"), this.stepBtn = e(".step"), this.genLabel = e(".gen"), this.legendBox = e(".legend"), this.playBtn.addEventListener("click", () => this.toggle()), this.stepBtn.addEventListener("click", () => this.step()), e(".reset").addEventListener("click", () => this.reset()), this.canvas.addEventListener("pointerdown", (e) => this.onPointerDown(e)), this.canvas.addEventListener("pointermove", (e) => this.onPointerMove(e));
		let t = () => this.painting = null;
		this.canvas.addEventListener("pointerup", t), this.canvas.addEventListener("pointercancel", t);
	}
	connectedCallback() {
		this.resizeObs.observe(this.stage), this.visObs.observe(this), this.syncChrome(), !this.project && !this.manual && this.queueReload();
	}
	disconnectedCallback() {
		this.resizeObs.disconnect(), this.visObs.disconnect(), cancelAnimationFrame(this.raf), clearTimeout(this.loopTimer), this.raf = 0;
	}
	attributeChangedCallback(e, t, n) {
		t !== n && this.isConnected && (e === "speed" ? this.clock.speed = Re(n, this.project?.settings.speed ?? 8) : e === "controls" || e === "legend" || e === "interactive" ? this.syncChrome() : (this.manual = !1, this.queueReload()));
	}
	get playing() {
		return this._playing;
	}
	get generation() {
		return this.sim?.generation ?? 0;
	}
	get projectName() {
		return this.project?.meta.name ?? "";
	}
	load(e) {
		this.manual = !0, this.loadToken++;
		try {
			let t = e instanceof Uint8Array ? Pe(e) : e instanceof ArrayBuffer ? Pe(new Uint8Array(e)) : e;
			this.setProject(t);
		} catch (e) {
			this.fail(e);
		}
	}
	play() {
		this.sim && !this._playing && (this._playing = !0, this.clock.reset(), this.syncPlayButton(), this.schedule(), this.dispatchEvent(new Event("play")));
	}
	pause() {
		clearTimeout(this.loopTimer), this._playing && (this._playing = !1, cancelAnimationFrame(this.raf), this.raf = 0, this.syncPlayButton(), this.dispatchEvent(new Event("pause")));
	}
	toggle() {
		this._playing ? this.pause() : this.play();
	}
	step() {
		this.sim && (this.pause(), this.advance(1), this.draw());
	}
	reset() {
		this.sim && this.start && (clearTimeout(this.loopTimer), this.sim.restore(this.start), this.detector.reset(), this.clock.reset(), this.draw());
	}
	queueReload() {
		this.reloadQueued || (this.reloadQueued = !0, queueMicrotask(() => {
			this.reloadQueued = !1, this.manual || this.reload();
		}));
	}
	async reload() {
		let e = ++this.loadToken;
		try {
			let t = await this.resolveSource();
			e === this.loadToken && this.setProject(t);
		} catch (t) {
			e === this.loadToken && this.fail(t);
		}
	}
	async resolveSource() {
		let e = this.getAttribute("src");
		if (e) {
			this.showMessage("Lade Projekt …");
			let t;
			try {
				t = await fetch(new URL(e, document.baseURI));
			} catch {
				throw new Q(`„${e}“ konnte nicht abgerufen werden.`);
			}
			if (!t.ok) throw new Q(`„${e}“ konnte nicht geladen werden (HTTP ${t.status}).`);
			if (t.headers.get("content-type")?.includes("text/html")) throw new Q(`Unter „${e}“ liegt eine Webseite statt einer Projektdatei – stimmt die Adresse?`);
			return Pe(new Uint8Array(await t.arrayBuffer()));
		}
		let t = this.querySelector("script[type=\"application/json\"], script[type=\"application/vnd.autocell+json\"]");
		return t?.textContent?.trim() ? Fe(t.textContent) : Le(this.getAttribute("template") ?? "gol", this.getAttribute("cols"), this.getAttribute("rows"), this.getAttribute("seed"));
	}
	setProject(e) {
		let t = this._playing;
		this.pause(), this.project = e, this.sim = C(e), this.start = this.sim.snapshot(), this.detector.reset(), this.lut = Ge(e), this.clock.speed = Re(this.getAttribute("speed"), e.settings.speed), this.canvas.setAttribute("aria-label", `${e.meta.name}: zellulärer Automat, ${e.width} × ${e.height} Zellen`), this.stage.style.aspectRatio = `${e.width} / ${e.height}`, this.buildLegend(), this.showMessage(null), this.layout(), this.dispatchEvent(new CustomEvent("load", { detail: {
			name: e.meta.name,
			width: e.width,
			height: e.height
		} })), (t || this.hasAttribute("autoplay") && !Ke()) && this.play();
	}
	fail(e) {
		this.pause();
		let t = e instanceof Error ? e.message : String(e);
		this.showMessage(`Projekt konnte nicht geladen werden: ${t}`), this.dispatchEvent(new CustomEvent("error", { detail: { message: t } })), e instanceof Q || console.error("[autocell-player]", e);
	}
	showMessage(e) {
		this.msg.hidden = e === null, this.msg.textContent = e ?? "";
	}
	schedule() {
		!this.raf && this._playing && this.visible && (this.lastTime = performance.now(), this.raf = requestAnimationFrame(this.tick));
	}
	tick = (e) => {
		if (this.raf = 0, !this._playing || !this.visible) return;
		let t = this.clock.due(e - this.lastTime);
		this.lastTime = e, t > 0 && (this.advance(t, e) < t && this.clock.drop(), this.draw()), this.schedule();
	};
	advance(e, t = performance.now()) {
		let n = this.sim, r = this.project.settings, i = 0;
		for (; i < e;) {
			n.step(), i++;
			let e = r.stopWhenStable ? this.detector.observe(n.generation, n.cells) : null;
			if (r.stopAtGeneration !== null && n.generation >= r.stopAtGeneration || e && e.kind !== "none") {
				this.finish();
				break;
			}
			if (performance.now() - t > Ue) break;
		}
		return i;
	}
	finish() {
		let e = this._playing;
		this.pause(), this.dispatchEvent(new Event("end")), e && this.hasAttribute("loop") && (this.loopTimer = window.setTimeout(() => {
			this.reset(), this.play();
		}, He));
	}
	syncChrome() {
		this.bar.hidden = !this.hasAttribute("controls"), this.legendBox.hidden = !this.hasAttribute("legend"), this.canvas.classList.toggle("interactive", this.hasAttribute("interactive"));
	}
	syncPlayButton() {
		this.playBtn.innerHTML = We(this._playing ? $.pause : $.play), this.playBtn.setAttribute("aria-label", this._playing ? "Pause" : "Start");
	}
	buildLegend() {
		this.legendBox.replaceChildren(...this.project.model.states.map((e) => {
			let t = document.createElement("span");
			t.className = "item";
			let n = document.createElement("i");
			n.style.background = e.color;
			let r = document.createElement("span");
			r.textContent = e.name;
			let i = document.createElement("b");
			return t.append(n, r, i), t;
		}));
	}
	layout() {
		let e = this.project;
		if (!e) return;
		let t = this.stage.getBoundingClientRect();
		if (t.width === 0 || t.height === 0) return;
		let n = Math.min(t.width / e.width, t.height / e.height);
		this.cellPx = n >= 2 ? Math.floor(n) : n;
		let r = e.width * this.cellPx, i = e.height * this.cellPx, a = Math.min(window.devicePixelRatio || 1, 4);
		this.canvas.style.width = `${r}px`, this.canvas.style.height = `${i}px`, this.canvas.width = Math.max(1, Math.round(r * a)), this.canvas.height = Math.max(1, Math.round(i * a)), this.draw();
	}
	draw() {
		let e = this.sim, t = this.project;
		if (!e || !t) return;
		let n = e.width, r = e.height, i = this.buffer;
		(i.width !== n || i.height !== r) && (i.width = n, i.height = r);
		let a = i.getContext("2d"), o = a.createImageData(n, r), s = new Uint32Array(o.data.buffer), c = e.cells, l = this.lut;
		for (let e = 0; e < c.length; e++) s[e] = l[c[e]];
		a.putImageData(o, 0, 0);
		let u = this.canvas.width, d = this.canvas.height, f = this.canvas.getContext("2d");
		f.imageSmoothingEnabled = !1, f.drawImage(i, 0, 0, u, d);
		let p = u / n;
		if (t.view.showGridLines && this.cellPx >= 6) {
			f.fillStyle = "rgba(128, 128, 128, 0.22)";
			let e = Math.max(1, Math.round(u / (n * this.cellPx)));
			for (let t = 0; t <= n; t++) f.fillRect(Math.min(Math.round(t * p), u - e), 0, e, d);
			for (let t = 0; t <= r; t++) f.fillRect(0, Math.min(Math.round(t * p), d - e), u, e);
		}
		if (this.genLabel.textContent = `Gen. ${e.generation.toLocaleString("de-DE")}`, !this.legendBox.hidden) {
			let t = e.counts;
			this.legendBox.querySelectorAll("b").forEach((e, n) => {
				let r = (t[n] ?? 0).toLocaleString("de-DE");
				e.textContent !== r && (e.textContent = r);
			});
		}
	}
	cellIndex(e) {
		let t = this.sim, n = this.canvas.getBoundingClientRect(), r = Math.floor((e.clientX - n.left) / n.width * t.width), i = Math.floor((e.clientY - n.top) / n.height * t.height);
		return r < 0 || i < 0 || r >= t.width || i >= t.height ? -1 : i * t.width + r;
	}
	onPointerDown(e) {
		if (!this.sim || !this.hasAttribute("interactive") || e.button !== 0) return;
		let t = this.cellIndex(e);
		t < 0 || (e.preventDefault(), this.canvas.setPointerCapture(e.pointerId), this.painting = (this.sim.cells[t] + 1) % this.sim.model.states.length, this.paint(t));
	}
	onPointerMove(e) {
		if (this.painting === null || !(e.buttons & 1)) return;
		let t = this.cellIndex(e);
		t >= 0 && this.paint(t);
	}
	paint(e) {
		this.sim.setIndex(e, this.painting) && (this.detector.reset(), this.draw());
	}
};
//#endregion
//#region src/index.ts
typeof customElements < "u" && !customElements.get("autocell-player") && customElements.define("autocell-player", qe);
//#endregion
export { qe as AutoCellPlayer, Ne as PLAYER_TEMPLATES };
