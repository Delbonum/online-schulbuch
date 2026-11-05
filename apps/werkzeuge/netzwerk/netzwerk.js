// Netzwerk-Simulation (Oberfläche): Netze im Entwurfsmodus zusammenstecken und einstellen, im Simulationsmodus
// Software installieren und ausprobieren (Befehlszeile, Webbrowser, Webserver, DNS-Server) und den Datenaustausch
// Schicht für Schicht verfolgen. Die Simulation selbst steckt in netz.js, die Befehlszeile in befehle.js.
//
// Das Modem verbindet zwei Simulationen in verschiedenen Browsern; die Rahmen reicht die Schulbuch-API weiter
// (/api/modem, ohne Konto, Verbindung über einen sechsstelligen Code).
//
// Bilder der Geräte: bilder/<typ>.svg – Platzhalter, die sich durch eigene Bilder gleichen Namens ersetzen lassen
// (andere Endung: BILDER unten anpassen).

import {
  Netz, SOFTWARE, STANDARD_SEITE, gueltigeIp, gueltigeMaske, imSelbenNetz, adressbereich, ECHO_PORT,
  dateisystem, ordnerInhalt, alleDateien, existiert, leseDatei, schreibeDatei, neuerOrdner, loesche, benenneUm, normalerPfad, MAX_DATEI,
} from './netz.js';
import { fuehreAus } from './befehle.js';

const wurzel = document.getElementById('netzwerk');
const BASIS_BILDER = new URL('./bilder/', import.meta.url).href.replace(/\?.*$/, '');
const BILDER = { rechner: 'rechner.svg', notebook: 'notebook.svg', switch: 'switch.svg', router: 'router.svg', modem: 'modem.svg' };
const bild = (typ) => `${BASIS_BILDER}${BILDER[typ]}`;
const NAMEN = { rechner: 'Rechner', notebook: 'Notebook', switch: 'Switch', router: 'Router', modem: 'Modem' };
const API = '/api';
const SPEICHER = 'netzwerk-simulation:entwurf';
const TEMPO = [800, 400, 200, 100, 40];
const BREITE = 2000;
const HOEHE = 1200;

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const html = (t) => { const e = document.createElement('template'); e.innerHTML = t.trim(); return e.content.firstElementChild; };
const istHost = (g) => g.typ === 'rechner' || g.typ === 'notebook';

const zustand = {
  netz: new Netz(),
  modus: 'entwurf',
  werkzeug: 'auswahl', // oder 'kabel'
  auswahl: null, // {art: 'geraet'|'kabel', id}
  kabelStart: null,
  tempo: 2,
  timer: null,
  aktivBis: new Map(), // Kabel-ID → Zeitpunkt, bis zu dem es grün leuchtet
};

// ------------------------------------------------------------------ Grundgerüst

wurzel.innerHTML = `<div class="nw" tabindex="-1">
<div class="nw-leiste">
<div class="nw-modi" role="group" aria-label="Modus">
<button type="button" class="nw-modus" data-modus="entwurf">✎ Entwurf</button>
<button type="button" class="nw-modus" data-modus="simulation">▶ Simulation</button>
</div>
<span class="nw-trenner"></span>
<button type="button" class="knopf nw-neu">Neu</button>
<label class="knopf">Öffnen … <input type="file" accept=".json,application/json" class="sr nw-oeffnen"></label>
<button type="button" class="knopf nw-speichern">Speichern</button>
<select class="nw-beispiel" aria-label="Beispiel laden"><option value="">Beispiel laden …</option></select>
<label class="nw-tempo">Tempo <input type="range" min="0" max="4" step="1" value="2"></label>
<span class="nw-zeit" aria-live="off"></span>
<span class="nw-platz"></span>
<button type="button" class="knopf nw-hilfe-knopf">Hilfe</button>
<button type="button" class="knopf nw-vollbild">Vollbild</button>
</div>
<div class="nw-haupt">
<aside class="nw-palette" aria-label="Bauteile"></aside>
<div class="nw-flaeche-rahmen"><svg class="nw-flaeche" viewBox="0 0 ${BREITE} ${HOEHE}" width="${BREITE}" height="${HOEHE}" role="application" aria-label="Netzwerk"><g class="nw-kabel"></g><line class="nw-kabel-vorschau" hidden/><g class="nw-geraete"></g></svg></div>
</div>
<div class="nw-panel"></div>
<div class="nw-meldung" role="status" aria-live="polite"></div>
<div class="nw-fenster-ebene"></div>
</div>`;

const app = wurzel.querySelector('.nw');
const svg = app.querySelector('.nw-flaeche');
const gKabel = svg.querySelector('.nw-kabel');
const gGeraete = svg.querySelector('.nw-geraete');
const vorschau = svg.querySelector('.nw-kabel-vorschau');
const panel = app.querySelector('.nw-panel');
const ebene = app.querySelector('.nw-fenster-ebene');

function melde(text, art = 'info', rueckgaengig = null) {
  const el = app.querySelector('.nw-meldung');
  el.textContent = text;
  el.className = `nw-meldung sichtbar ${art}`;
  melde.rueckgaengig = rueckgaengig;
  if (rueckgaengig) {
    el.classList.add('mit-knopf');
    el.append(' ', html('<button type="button" class="nw-rueckgaengig">Rückgängig</button>'));
    el.lastChild.addEventListener('click', () => { melde.rueckgaengig = null; el.classList.remove('sichtbar'); rueckgaengig(); });
  }
  clearTimeout(melde.timer);
  melde.timer = setTimeout(() => { el.classList.remove('sichtbar'); melde.rueckgaengig = null; }, rueckgaengig ? 8000 : 4000);
}

function speichere() {
  try { localStorage.setItem(SPEICHER, JSON.stringify(zustand.netz)); } catch { /* ohne Speicher */ }
}

// ------------------------------------------------------------------ Palette (Entwurf)

const palette = app.querySelector('.nw-palette');
palette.innerHTML = `${Object.keys(BILDER).map((typ) => `<button type="button" class="nw-bauteil" data-typ="${typ}" draggable="true" title="${NAMEN[typ]} hinzufügen (klicken oder auf die Fläche ziehen)"><img src="${bild(typ)}" alt=""><span>${NAMEN[typ]}</span></button>`).join('')}
<button type="button" class="nw-bauteil nw-kabel-werkzeug" title="Kabel: erst ein Gerät, dann das andere anklicken"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 40C18 40 14 8 30 8h12" fill="none" stroke="#3d4a5c" stroke-width="4" stroke-linecap="round"/><circle cx="6" cy="40" r="4" fill="#0b6b72"/><circle cx="42" cy="8" r="4" fill="#0b6b72"/></svg><span>Kabel</span></button>
<button type="button" class="nw-bauteil nw-papierkorb" title="Papierkorb: Gerät hierher ziehen – oder Gerät bzw. Kabel anklicken und dann hier klicken"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 13h28M19 13V8h10v5M13 13l2 28h18l2-28" fill="none" stroke="#3d4a5c" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 19v16M28 19v16" stroke="#3d4a5c" stroke-width="3" stroke-linecap="round"/></svg><span>Papierkorb</span></button>`;
const papierkorb = palette.querySelector('.nw-papierkorb');

function neuesGeraet(typ, x, y) {
  const g = zustand.netz.neuesGeraet(typ, { x: Math.round(x), y: Math.round(y) });
  zustand.auswahl = { art: 'geraet', id: g.id };
  speichere();
  zeichne();
}

palette.addEventListener('click', (e) => {
  const knopf = e.target.closest('.nw-bauteil');
  if (!knopf || zustand.modus !== 'entwurf') return;
  if (knopf === papierkorb) {
    if (zustand.auswahl) loescheAuswahl();
    else melde('Ziehe ein Gerät in den Papierkorb – oder klicke erst ein Gerät oder Kabel an und dann den Papierkorb.');
    return;
  }
  if (knopf.classList.contains('nw-kabel-werkzeug')) { setzeWerkzeug(zustand.werkzeug === 'kabel' ? 'auswahl' : 'kabel'); return; }
  // in die Mitte des sichtbaren Bereichs, leicht versetzt
  const rahmen = app.querySelector('.nw-flaeche-rahmen');
  const n = zustand.netz.geraete.size % 6;
  neuesGeraet(knopf.dataset.typ, rahmen.scrollLeft + rahmen.clientWidth / 2 - 60 + n * 30, rahmen.scrollTop + rahmen.clientHeight / 2 - 60 + n * 30);
});
palette.addEventListener('dragstart', (e) => {
  const knopf = e.target.closest('.nw-bauteil[data-typ]');
  if (knopf) e.dataTransfer.setData('text/x-geraet', knopf.dataset.typ);
});
svg.addEventListener('dragover', (e) => { if (zustand.modus === 'entwurf') e.preventDefault(); });
svg.addEventListener('drop', (e) => {
  const typ = e.dataTransfer.getData('text/x-geraet');
  if (!typ || zustand.modus !== 'entwurf') return;
  e.preventDefault();
  const p = svgPunkt(e);
  neuesGeraet(typ, p.x, p.y);
});

function setzeWerkzeug(w) {
  zustand.werkzeug = w;
  zustand.kabelStart = null;
  vorschau.hidden = true;
  palette.querySelector('.nw-kabel-werkzeug').classList.toggle('aktiv', w === 'kabel');
  svg.classList.toggle('kabel-modus', w === 'kabel');
  if (w === 'kabel') melde('Kabel verlegen: Klicke nacheinander auf die beiden Geräte. Esc beendet.');
}

function svgPunkt(e) {
  const p = svg.createSVGPoint();
  p.x = e.clientX;
  p.y = e.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}

// ------------------------------------------------------------------ Zeichnen

const mitte = (g) => ({ x: g.x + 36, y: g.y + 32 });

function zeichne() {
  const n = zustand.netz;
  gKabel.innerHTML = n.kabel.map((k) => {
    const a = n.geraete.get(k.a.g);
    const b = n.geraete.get(k.b.g);
    const [pa, pb] = [mitte(a), mitte(b)];
    const gewaehlt = zustand.auswahl?.art === 'kabel' && zustand.auswahl.id === k.id;
    return `<g class="nw-kabel-linie${gewaehlt ? ' gewaehlt' : ''}" data-kabel="${k.id}"><line x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}" class="nw-kabel-treffer"/><line x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}" class="nw-kabel-strich"/></g>`;
  }).join('');
  gGeraete.innerHTML = [...n.geraete.values()].map((g) => {
    const gewaehlt = zustand.auswahl?.art === 'geraet' && zustand.auswahl.id === g.id;
    const ips = g.typ === 'switch' ? '' : g.typ === 'modem' ? modemText(g) : g.nics.map((x) => x.ip).filter(Boolean).join(', ');
    return `<g class="nw-geraet${gewaehlt ? ' gewaehlt' : ''}${zustand.kabelStart === g.id ? ' kabel-start' : ''}" data-geraet="${g.id}" transform="translate(${g.x} ${g.y})" tabindex="0" role="button" aria-label="${esc(NAMEN[g.typ])} ${esc(g.name)}">
<rect class="nw-geraet-rand" x="-6" y="-6" width="84" height="76" rx="8"/>
<image href="${bild(g.typ)}" x="4" y="0" width="64" height="64"/>
<text x="36" y="80" text-anchor="middle" class="nw-name">${esc(g.name)}</text>
${ips ? `<text x="36" y="96" text-anchor="middle" class="nw-ip">${esc(ips.length > 34 ? `${ips.slice(0, 32)} …` : ips)}</text>` : ''}
</g>`;
  }).join('');
  markiereKabel();
  zeichnePanel();
}

function markiereKabel() {
  const jetzt = performance.now();
  gKabel.querySelectorAll('[data-kabel]').forEach((el) => el.classList.toggle('aktiv', (zustand.aktivBis.get(el.dataset.kabel) ?? 0) > jetzt));
}

// ------------------------------------------------------------------ Maus: auswählen, verschieben, Kabel

let ziehen = null;

svg.addEventListener('pointerdown', (e) => {
  const geraetEl = e.target.closest('[data-geraet]');
  const kabelEl = e.target.closest('[data-kabel]');
  if (zustand.werkzeug === 'kabel' && zustand.modus === 'entwurf') {
    if (!geraetEl) { setzeWerkzeug('auswahl'); return; }
    const id = geraetEl.dataset.geraet;
    if (!zustand.kabelStart) {
      zustand.kabelStart = id;
      const g = zustand.netz.geraete.get(id);
      const m = mitte(g);
      Object.entries({ x1: m.x, y1: m.y, x2: m.x, y2: m.y }).forEach(([k, v]) => vorschau.setAttribute(k, v));
      vorschau.hidden = false;
      zeichne();
      return;
    }
    try {
      const k = zustand.netz.verbinde(zustand.kabelStart, id);
      zustand.auswahl = { art: 'kabel', id: k.id };
      speichere();
    } catch (err) {
      melde(err.message, 'fehler');
    }
    // Nach dem Verlegen zurück zur Auswahl (für das nächste Kabel das Werkzeug erneut wählen)
    setzeWerkzeug('auswahl');
    zeichne();
    return;
  }
  if (geraetEl) {
    zustand.auswahl = { art: 'geraet', id: geraetEl.dataset.geraet };
    if (zustand.modus === 'entwurf') {
      const g = zustand.netz.geraete.get(geraetEl.dataset.geraet);
      const p = svgPunkt(e);
      ziehen = { g, dx: p.x - g.x, dy: p.y - g.y, el: geraetEl, bewegt: false };
      try { svg.setPointerCapture(e.pointerId); } catch { /* z. B. ohne echten Zeiger */ }
    }
    zeichneAuswahl();
    return;
  }
  if (kabelEl && zustand.modus === 'entwurf') {
    zustand.auswahl = { art: 'kabel', id: kabelEl.dataset.kabel };
    zeichne();
    return;
  }
  zustand.auswahl = null;
  zeichneAuswahl();
});

const ueberPapierkorb = (e) => {
  const r = papierkorb.getBoundingClientRect();
  return r.width > 0 && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
};

svg.addEventListener('pointermove', (e) => {
  if (zustand.kabelStart && !vorschau.hidden) {
    const p = svgPunkt(e);
    vorschau.setAttribute('x2', p.x);
    vorschau.setAttribute('y2', p.y);
  }
  if (!ziehen) return;
  const p = svgPunkt(e);
  ziehen.g.x = Math.max(0, Math.min(BREITE - 80, Math.round(p.x - ziehen.dx)));
  ziehen.g.y = Math.max(0, Math.min(HOEHE - 100, Math.round(p.y - ziehen.dy)));
  ziehen.bewegt = true;
  papierkorb.classList.toggle('bereit', ueberPapierkorb(e));
  ziehen.el.setAttribute('transform', `translate(${ziehen.g.x} ${ziehen.g.y})`);
  // Kabel mitziehen
  for (const k of zustand.netz.kabel) {
    if (k.a.g !== ziehen.g.id && k.b.g !== ziehen.g.id) continue;
    const ende = k.a.g === ziehen.g.id ? 1 : 2;
    const m = mitte(ziehen.g);
    gKabel.querySelectorAll(`[data-kabel="${k.id}"] line`).forEach((l) => { l.setAttribute(`x${ende}`, m.x); l.setAttribute(`y${ende}`, m.y); });
  }
});

svg.addEventListener('pointerup', (e) => {
  papierkorb.classList.remove('bereit');
  if (ziehen?.bewegt && ueberPapierkorb(e)) {
    zustand.auswahl = { art: 'geraet', id: ziehen.g.id };
    ziehen = null;
    loescheAuswahl();
    return;
  }
  if (ziehen?.bewegt) speichere();
  ziehen = null;
});

svg.addEventListener('dblclick', (e) => {
  const el = e.target.closest('[data-geraet]');
  if (!el) return;
  const g = zustand.netz.geraete.get(el.dataset.geraet);
  if (zustand.modus === 'simulation') {
    if (istHost(g)) desktop(g);
    else if (g.typ === 'switch') satFenster(g);
    else if (g.typ === 'modem') modemFenster(g);
    else datenaustausch(g);
  } else {
    panel.querySelector('input')?.focus();
  }
});

/** Auswahl hervorheben, ohne das Panel zu verlieren, wenn es dasselbe Gerät bleibt */
function zeichneAuswahl() {
  gGeraete.querySelectorAll('[data-geraet]').forEach((el) => el.classList.toggle('gewaehlt', zustand.auswahl?.art === 'geraet' && el.dataset.geraet === zustand.auswahl.id));
  gKabel.querySelectorAll('[data-kabel]').forEach((el) => el.classList.toggle('gewaehlt', zustand.auswahl?.art === 'kabel' && el.dataset.kabel === zustand.auswahl.id));
  zeichnePanel();
}

app.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (zustand.werkzeug !== 'auswahl') setzeWerkzeug('auswahl'); return; }
  if (e.key === 'z' && (e.ctrlKey || e.metaKey) && melde.rueckgaengig && !e.target.closest('input, textarea, select')) {
    e.preventDefault();
    const r = melde.rueckgaengig;
    melde.rueckgaengig = null;
    app.querySelector('.nw-meldung').classList.remove('sichtbar');
    r();
    return;
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && zustand.modus === 'entwurf' && zustand.auswahl && !e.target.closest('input, textarea, select')) {
    e.preventDefault();
    loescheAuswahl();
  }
});

/** Löscht das gewählte Gerät oder Kabel; die Meldung bietet „Rückgängig“ an (statt einer Sicherheitsfrage). */
function loescheAuswahl() {
  const a = zustand.auswahl;
  if (!a || zustand.modus !== 'entwurf') return;
  const vorher = JSON.parse(JSON.stringify(zustand.netz));
  const name = a.art === 'geraet' ? zustand.netz.geraete.get(a.id)?.name : 'Kabel';
  if (a.art === 'geraet') zustand.netz.entferneGeraet(a.id); else zustand.netz.entferneKabel(a.id);
  zustand.auswahl = null;
  speichere();
  zeichne();
  melde(`„${name}“ gelöscht.`, 'info', () => {
    if (zustand.modus !== 'entwurf') return;
    zustand.netz = Netz.ausJSON(vorher);
    zustand.auswahl = a;
    speichere();
    zeichne();
  });
}

// ------------------------------------------------------------------ Panel unten

let panelFuer = null;

function zeichnePanel() {
  const a = zustand.auswahl;
  const schluessel = `${zustand.modus}:${a?.art}:${a?.id}`;
  if (schluessel === panelFuer && panel.contains(document.activeElement)) return; // Eingabe nicht stören
  panelFuer = schluessel;
  const n = zustand.netz;
  if (!a) {
    panel.innerHTML = zustand.modus === 'entwurf'
      ? '<p class="nw-tipp">Füge links Geräte hinzu (anklicken oder auf die Fläche ziehen) und verbinde sie mit dem Kabel. Ein angeklicktes Gerät stellst du hier unten ein. Dann oben auf <strong>▶ Simulation</strong>.</p>'
      : '<p class="nw-tipp">Simulation läuft. Doppelklick auf einen Rechner öffnet seinen Desktop (Software installieren, Befehlszeile, Browser …); Doppelklick auf Switch oder Router zeigt, was dort passiert. Grün leuchtende Kabel übertragen gerade Daten.</p>';
    return;
  }
  if (a.art === 'kabel') {
    const k = n.kabel.find((x) => x.id === a.id);
    if (!k) { zustand.auswahl = null; zeichnePanel(); return; }
    panel.innerHTML = `<div class="nw-panel-kopf"><strong>Kabel</strong> zwischen ${esc(n.geraete.get(k.a.g).name)} und ${esc(n.geraete.get(k.b.g).name)}
<button type="button" class="knopf nw-loeschen">Kabel entfernen</button></div>`;
    panel.querySelector('.nw-loeschen').addEventListener('click', loescheAuswahl);
    return;
  }
  const g = n.geraete.get(a.id);
  if (!g) { zustand.auswahl = null; zeichnePanel(); return; }
  if (zustand.modus === 'simulation') { panelSimulation(g); return; }
  if (istHost(g)) panelHost(g);
  else if (g.typ === 'switch') panelSwitch(g);
  else if (g.typ === 'modem') panelModem(g);
  else panelRouter(g);
}

function feld(label, wert, attrs = '') {
  return `<label class="nw-feld"><span>${label}</span><input value="${esc(wert)}" ${attrs}></label>`;
}

function aenderung() { speichere(); zeichneGeraetText(); }

function zeichneGeraetText() {
  // Namen und IP-Adressen auf der Fläche nachziehen, ohne das Panel neu aufzubauen
  const merk = panelFuer;
  const aktiv = document.activeElement;
  zeichne();
  panelFuer = merk;
  if (aktiv && panel.contains(aktiv)) aktiv.focus();
}

/** Prüft Eingabefelder (data-pruef="ip|maske|ip-leer") und markiert Fehler */
function pruefe(input) {
  const art = input.dataset.pruef;
  const w = input.value.trim();
  let ok = true;
  if (art === 'ip') ok = gueltigeIp(w);
  if (art === 'ip-leer') ok = w === '' || gueltigeIp(w);
  if (art === 'maske') ok = gueltigeMaske(w);
  input.classList.toggle('falsch', !ok);
  return ok;
}

function panelHost(g) {
  const nic = g.nics[0];
  const s = g.dhcpServer;
  panel.innerHTML = `<div class="nw-panel-kopf"><img src="${bild(g.typ)}" alt="" width="32" height="32"><strong>${NAMEN[g.typ]}</strong>
<button type="button" class="knopf nw-loeschen">Gerät löschen</button></div>
<div class="nw-felder">
${feld('Name', g.name, 'data-f="name" maxlength="30"')}
${feld('IP-Adresse', nic.ip, `data-f="ip" data-pruef="ip" ${g.dhcp ? 'disabled' : ''}`)}
${feld('Netzmaske', nic.maske, `data-f="maske" data-pruef="maske" ${g.dhcp ? 'disabled' : ''}`)}
${feld('Gateway', g.gateway, `data-f="gateway" data-pruef="ip-leer" ${g.dhcp ? 'disabled' : ''}`)}
${feld('DNS-Server', g.dns, `data-f="dns" data-pruef="ip-leer" ${g.dhcp ? 'disabled' : ''}`)}
<label class="nw-feld"><span>MAC-Adresse</span><input value="${nic.mac}" readonly></label>
</div>
<p class="nw-hinweis"></p>
<label class="nw-check"><input type="checkbox" data-f="dhcp"${g.dhcp ? ' checked' : ''}> IP-Adresse, Gateway und DNS-Server per DHCP beziehen</label>
<details class="nw-dhcp"${s.aktiv ? ' open' : ''}><summary>DHCP-Server auf diesem Rechner</summary>
<label class="nw-check"><input type="checkbox" data-d="aktiv"${s.aktiv ? ' checked' : ''}> DHCP-Server aktiv (vergibt Adressen an Rechner mit „per DHCP beziehen“)</label>
<div class="nw-felder">
${feld('Adressen von', s.von, 'data-d="von" data-pruef="ip-leer"')}
${feld('bis', s.bis, 'data-d="bis" data-pruef="ip-leer"')}
${feld('Gateway (vergeben)', s.gateway, 'data-d="gateway" data-pruef="ip-leer"')}
${feld('DNS-Server (vergeben)', s.dns, 'data-d="dns" data-pruef="ip-leer"')}
</div></details>`;
  const hinweis = panel.querySelector('.nw-hinweis');
  const zeigeHinweis = () => {
    const t = [];
    if (!g.dhcp && gueltigeIp(nic.ip) && gueltigeMaske(nic.maske) && gueltigeIp(g.gateway) && !imSelbenNetz(nic.ip, g.gateway, nic.maske)) t.push('Das Gateway liegt nicht im eigenen Netz – so wird es nie erreicht.');
    const doppelt = [...zustand.netz.geraete.values()].find((x) => x !== g && x.nics.some((y) => y.ip && y.ip === nic.ip));
    if (!g.dhcp && doppelt) t.push(`Die IP-Adresse ${nic.ip} hat auch ${doppelt.name}.`);
    if (!zustand.netz.kabelAn(g.id, 0)) t.push('Noch nicht verkabelt.');
    hinweis.textContent = t.join(' ');
  };
  zeigeHinweis();
  panel.querySelectorAll('[data-f]').forEach((el) => el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => {
    const f = el.dataset.f;
    if (el.dataset.pruef) pruefe(el);
    if (f === 'name') g.name = el.value;
    if (f === 'ip') nic.ip = el.value.trim();
    if (f === 'maske') nic.maske = el.value.trim();
    if (f === 'gateway') g.gateway = el.value.trim();
    if (f === 'dns') g.dns = el.value.trim();
    if (f === 'dhcp') { g.dhcp = el.checked; panelFuer = null; aenderung(); return; }
    zeigeHinweis();
    aenderung();
  }));
  panel.querySelectorAll('[data-d]').forEach((el) => el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => {
    if (el.dataset.pruef) pruefe(el);
    g.dhcpServer[el.dataset.d] = el.type === 'checkbox' ? el.checked : el.value.trim();
    speichere();
  }));
  panel.querySelectorAll('[data-pruef]').forEach(pruefe);
  panel.querySelector('.nw-loeschen').addEventListener('click', loescheAuswahl);
}

function panelSwitch(g) {
  const belegt = g.nics.map((_, i) => zustand.netz.gegenueber(g.id, i)).filter(Boolean);
  panel.innerHTML = `<div class="nw-panel-kopf"><img src="${bild('switch')}" alt="" width="32" height="32"><strong>Switch</strong>
<button type="button" class="knopf nw-loeschen">Gerät löschen</button></div>
<div class="nw-felder">${feld('Name', g.name, 'data-f="name" maxlength="30"')}</div>
<p class="nw-hinweis">Ein Switch braucht keine IP-Adresse. Er lernt, an welchem Anschluss welche MAC-Adresse hängt, und leitet Rahmen gezielt weiter.
${belegt.length ? `Verbunden mit: ${belegt.map((x) => esc(x.name)).join(', ')}.` : ''}</p>`;
  panel.querySelector('[data-f]').addEventListener('input', (e) => { g.name = e.target.value; aenderung(); });
  panel.querySelector('.nw-loeschen').addEventListener('click', loescheAuswahl);
}

function panelModem(g) {
  const gegenueber = zustand.netz.gegenueber(g.id, 0);
  panel.innerHTML = `<div class="nw-panel-kopf"><img src="${bild('modem')}" alt="" width="32" height="32"><strong>Modem</strong>
<button type="button" class="knopf nw-loeschen">Gerät löschen</button></div>
<div class="nw-felder">${feld('Name', g.name, 'data-f="name" maxlength="30"')}</div>
<p class="nw-hinweis">Ein Modem verbindet dieses Netz mit dem Netz einer anderen Gruppe (anderer Rechner, anderer Browser) – wie ein langes Kabel.
Es braucht keine IP-Adresse und hat einen Anschluss, meist für einen Router oder Switch. In der Simulation: Doppelklick auf das Modem,
dann bietet eine Seite die Verbindung an und die andere wählt sich mit dem angezeigten Code ein.
${gegenueber ? `Verbunden mit: ${esc(gegenueber.name)}.` : ''}</p>`;
  panel.querySelector('[data-f]').addEventListener('input', (e) => { g.name = e.target.value; aenderung(); });
  panel.querySelector('.nw-loeschen').addEventListener('click', loescheAuswahl);
}

function panelRouter(g) {
  const n = zustand.netz;
  panel.innerHTML = `<div class="nw-panel-kopf"><img src="${bild('router')}" alt="" width="32" height="32"><strong>Router (Vermittlungsrechner)</strong>
<button type="button" class="knopf nw-firewall">Firewall …</button>
<button type="button" class="knopf nw-loeschen">Gerät löschen</button></div>
<div class="nw-felder">${feld('Name', g.name, 'data-f="name" maxlength="30"')}</div>
<div class="nw-spalten">
<div><h4>Anschlüsse</h4>
<table class="nw-tabelle"><thead><tr><th>#</th><th>verbunden mit</th><th>IP-Adresse</th><th>Netzmaske</th><th>MAC</th></tr></thead><tbody>
${g.nics.map((nic, i) => `<tr><td>${i + 1}</td><td>${esc(n.gegenueber(g.id, i)?.name ?? '–')}</td>
<td><input data-nic="${i}" data-feld="ip" value="${esc(nic.ip)}" data-pruef="ip-leer" aria-label="IP-Adresse Anschluss ${i + 1}"></td>
<td><input data-nic="${i}" data-feld="maske" value="${esc(nic.maske)}" data-pruef="maske" aria-label="Netzmaske Anschluss ${i + 1}"></td><td class="klein">${nic.mac}</td></tr>`).join('')}
</tbody></table>
<div class="nw-zeile"><button type="button" class="knopf nw-nic-plus"${g.nics.length >= 8 ? ' disabled' : ''}>+ Anschluss</button>
<button type="button" class="knopf nw-nic-minus"${g.nics.length <= 1 || n.kabelAn(g.id, g.nics.length - 1) ? ' disabled' : ''}>− letzten Anschluss</button></div></div>
<div><h4>Weiterleitungstabelle</h4>
<label class="nw-check"><input type="checkbox" class="nw-auto"${g.routenAuto !== false ? ' checked' : ''}> Einträge für die direkt angeschlossenen Netze automatisch</label>
<table class="nw-tabelle"><thead><tr><th>Zielnetz</th><th>Netzmaske</th><th>nächster Router (Gateway)</th><th></th></tr></thead><tbody class="nw-routen">
${g.routen.map((r, i) => `<tr><td><input data-route="${i}" data-feld="ziel" value="${esc(r.ziel)}" data-pruef="ip" aria-label="Zielnetz"></td>
<td><input data-route="${i}" data-feld="maske" value="${esc(r.maske)}" data-pruef="maske" aria-label="Netzmaske"></td>
<td><input data-route="${i}" data-feld="gateway" value="${esc(r.gateway)}" data-pruef="ip" aria-label="Gateway"></td>
<td><button type="button" class="uf-link nw-route-weg" data-route="${i}" aria-label="Eintrag löschen">✕</button></td></tr>`).join('')}
</tbody></table>
<button type="button" class="knopf nw-route-plus">+ Eintrag</button>
<p class="nw-hinweis klein">Ein Eintrag „0.0.0.0 / 0.0.0.0“ ist die Standardroute (alles, was sonst nirgends passt).</p></div>
</div>`;
  panel.querySelector('[data-f]').addEventListener('input', (e) => { g.name = e.target.value; aenderung(); });
  panel.querySelectorAll('[data-nic]').forEach((el) => el.addEventListener('input', () => { pruefe(el); g.nics[el.dataset.nic][el.dataset.feld] = el.value.trim(); aenderung(); }));
  panel.querySelectorAll('input[data-route]').forEach((el) => el.addEventListener('input', () => { pruefe(el); g.routen[el.dataset.route][el.dataset.feld] = el.value.trim(); speichere(); }));
  panel.querySelectorAll('.nw-route-weg').forEach((el) => el.addEventListener('click', () => { g.routen.splice(Number(el.dataset.route), 1); speichere(); panelFuer = null; zeichnePanel(); }));
  panel.querySelector('.nw-route-plus').addEventListener('click', () => { g.routen.push({ ziel: '', maske: '255.255.255.0', gateway: '' }); speichere(); panelFuer = null; zeichnePanel(); });
  panel.querySelector('.nw-auto').addEventListener('change', (e) => { g.routenAuto = e.target.checked; speichere(); });
  panel.querySelector('.nw-firewall').addEventListener('click', () => firewall(g));
  panel.querySelector('.nw-nic-plus').addEventListener('click', () => { g.nics.push(n.neueNic()); speichere(); panelFuer = null; zeichnePanel(); });
  panel.querySelector('.nw-nic-minus').addEventListener('click', () => { g.nics.pop(); speichere(); panelFuer = null; zeichnePanel(); });
  panel.querySelectorAll('[data-pruef]').forEach(pruefe);
  panel.querySelector('.nw-loeschen').addEventListener('click', loescheAuswahl);
}

function panelSimulation(g) {
  if (g.typ === 'modem') {
    panel.innerHTML = `<div class="nw-panel-kopf"><img src="${bild('modem')}" alt="" width="32" height="32"><strong>${esc(g.name)}</strong> <span class="klein">${esc(modemText(g))}</span>
<span class="nw-knoepfe"><button type="button" class="knopf primaer" data-tat="modem">Modem-Verbindung …</button></span></div>`;
    panel.querySelector('[data-tat="modem"]').addEventListener('click', () => modemFenster(g));
    return;
  }
  const ips = g.nics.map((x) => x.ip).filter(Boolean).join(', ');
  panel.innerHTML = `<div class="nw-panel-kopf"><img src="${bild(g.typ)}" alt="" width="32" height="32"><strong>${esc(g.name)}</strong> <span class="klein">${esc(ips)}</span>
<span class="nw-knoepfe">
${istHost(g) ? '<button type="button" class="knopf primaer" data-tat="desktop">Desktop öffnen</button>' : ''}
${g.typ !== 'switch' ? '<button type="button" class="knopf" data-tat="log">Datenaustausch anzeigen</button>' : ''}
${g.typ === 'switch' ? '<button type="button" class="knopf" data-tat="sat">Lerntabelle (SAT) anzeigen</button>' : ''}
${g.typ !== 'switch' ? '<button type="button" class="knopf" data-tat="route">Weiterleitungstabelle</button>' : ''}
${g.typ === 'router' ? '<button type="button" class="knopf" data-tat="firewall">Firewall</button>' : ''}
</span></div>`;
  panel.querySelector('[data-tat="desktop"]')?.addEventListener('click', () => desktop(g));
  panel.querySelector('[data-tat="log"]')?.addEventListener('click', () => datenaustausch(g));
  panel.querySelector('[data-tat="sat"]')?.addEventListener('click', () => satFenster(g));
  panel.querySelector('[data-tat="route"]')?.addEventListener('click', () => routenFenster(g));
  panel.querySelector('[data-tat="firewall"]')?.addEventListener('click', () => firewall(g));
}

// ------------------------------------------------------------------ Fenster

const fensterListe = new Map();
let fensterZ = 10;

/** Öffnet ein verschiebbares Fenster (oder holt ein schon offenes nach vorn). */
function fenster(id, titel, { breite = 520, hoehe = 380, aufbauen, aktualisieren = null, vorSchliessen = null }) {
  const offen = fensterListe.get(id);
  if (offen) { offen.el.style.zIndex = ++fensterZ; return offen; }
  const anzahl = fensterListe.size;
  const el = html(`<section class="nw-fenster" role="dialog" aria-label="${esc(titel)}" style="width:${breite}px;height:${hoehe}px;left:${40 + anzahl * 28}px;top:${app.querySelector('.nw-leiste').offsetHeight + 10 + anzahl * 24}px;z-index:${++fensterZ}">
<header class="nw-fenster-kopf"><span>${esc(titel)}</span><button type="button" class="nw-fenster-zu" aria-label="Schließen">✕</button></header>
<div class="nw-fenster-inhalt"></div></section>`);
  ebene.append(el);
  const f = { el, inhalt: el.querySelector('.nw-fenster-inhalt'), aktualisieren, aufbauen, vorSchliessen };
  fensterListe.set(id, f);
  el.querySelector('.nw-fenster-zu').addEventListener('click', () => schliesse(id));
  el.addEventListener('pointerdown', () => { el.style.zIndex = ++fensterZ; });
  const kopf = el.querySelector('.nw-fenster-kopf');
  kopf.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    const start = { x: e.clientX, y: e.clientY, l: el.offsetLeft, t: el.offsetTop };
    kopf.setPointerCapture(e.pointerId);
    const bewege = (ev) => {
      el.style.left = `${Math.max(0, Math.min(app.clientWidth - 80, start.l + ev.clientX - start.x))}px`;
      el.style.top = `${Math.max(0, Math.min(app.clientHeight - 40, start.t + ev.clientY - start.y))}px`;
    };
    kopf.addEventListener('pointermove', bewege);
    kopf.addEventListener('pointerup', () => kopf.removeEventListener('pointermove', bewege), { once: true });
  });
  aufbauen(f);
  return f;
}

/** Schließt ein Fenster; vorSchliessen() kann das verhindern (außer beim Moduswechsel: erzwingen) */
function schliesse(id, erzwingen = false) {
  const f = fensterListe.get(id);
  if (f?.vorSchliessen && !erzwingen && f.vorSchliessen(f) === false) return;
  f?.el.remove();
  fensterListe.delete(id);
}

function schliesseAlle() { for (const id of [...fensterListe.keys()]) schliesse(id, true); }

// ------------------------------------------------------------------ Desktop und Software

const SYMBOLE = { befehlszeile: '⌨', webbrowser: '🌐', webserver: '🗄', dnsserver: '📖', emailprogramm: '✉', emailserver: '📮', firewall: '🧱', echoserver: '🔁', client: '💬', texteditor: '📝', dateiexplorer: '🗂', installation: '🧩' };

function desktop(g) {
  const id = `desktop:${g.id}`;
  schliesse(id);
  fenster(id, `Desktop von ${g.name}`, {
    breite: 460, hoehe: 300,
    aufbauen(f) {
      f.inhalt.classList.add('nw-desktop');
      const apps = [...g.software.filter((s) => SOFTWARE[s]), 'installation'];
      f.inhalt.innerHTML = `<div class="nw-symbole">${apps.map((s) => `<button type="button" class="nw-symbol" data-app="${s}"><span class="nw-symbol-bild" aria-hidden="true">${SYMBOLE[s]}</span><span>${s === 'installation' ? 'Software-Installation' : SOFTWARE[s]}</span></button>`).join('')}</div>
<p class="nw-desktop-fuss klein">${esc(g.nics.map((x) => x.ip || 'keine IP-Adresse').join(', '))}${g.dhcp ? ' (per DHCP)' : ''}</p>`;
      f.inhalt.querySelectorAll('[data-app]').forEach((b) => b.addEventListener('click', () => oeffneApp(g, b.dataset.app)));
    },
  });
}

function oeffneApp(g, app_) {
  ({ installation, befehlszeile, webbrowser, webserver, dnsserver, emailprogramm, emailserver, firewall, echoserver, client, texteditor, dateiexplorer })[app_]?.(g);
}

function installation(g) {
  fenster(`installation:${g.id}`, `Software-Installation – ${g.name}`, {
    breite: 400, hoehe: 540,
    aufbauen(f) {
      f.inhalt.innerHTML = `<p class="klein">Wähle aus, welche Programme auf ${esc(g.name)} installiert sein sollen.</p>
${Object.entries(SOFTWARE).map(([k, name]) => `<label class="nw-check"><input type="checkbox" value="${k}"${g.software.includes(k) ? ' checked' : ''}> ${SYMBOLE[k]} ${name}</label>`).join('')}
<div class="nw-zeile"><button type="button" class="knopf primaer">Übernehmen</button></div>`;
      f.inhalt.querySelector('button').addEventListener('click', () => {
        g.software = [...f.inhalt.querySelectorAll('input:checked')].map((c) => c.value);
        g.daten.webserver ??= { laeuft: false };
        if (g.software.includes('webserver')) webseitenAnlegen(g);
        g.daten.dnsserver ??= { laeuft: false, eintraege: [] };
        // Eine frisch installierte Firewall ist eingeschaltet und lässt nur Antworten herein
        if (g.software.includes('firewall')) g.firewall ??= { aktiv: true, standard: 'verwerfen', antworten: true, regeln: [] };
        if (zustand.netz.laeuft) zustand.netz.dienste(g);
        speichere();
        schliesse(`installation:${g.id}`);
        desktop(g);
      });
    },
  });
}

function befehlszeile(g) {
  fenster(`befehlszeile:${g.id}`, `Befehlszeile – ${g.name}`, {
    breite: 600, hoehe: 360,
    aufbauen(f) {
      f.inhalt.classList.add('nw-konsole');
      f.inhalt.innerHTML = `<pre class="nw-ausgabe">Befehlszeile von ${esc(g.name)}. „help“ zeigt alle Befehle.\n</pre>
<form class="nw-eingabe"><span>&gt;</span><input autocomplete="off" spellcheck="false" aria-label="Befehl"></form>`;
      const aus = f.inhalt.querySelector('.nw-ausgabe');
      const input = f.inhalt.querySelector('input');
      const verlauf = [];
      let pos = 0;
      const schreib = (t) => { aus.textContent += `${t}\n`; aus.scrollTop = aus.scrollHeight; };
      f.inhalt.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const zeile = input.value;
        if (input.disabled) return;
        input.value = '';
        if (zeile.trim()) { verlauf.push(zeile); pos = verlauf.length; }
        schreib(`> ${zeile}`);
        if (!zustand.netz.laeuft) { schreib('Die Simulation läuft nicht.'); return; }
        input.disabled = true;
        const fertig = () => { input.disabled = false; input.focus(); };
        if (fuehreAus(zustand.netz, g, zeile, schreib, fertig) === 'leeren') aus.textContent = '';
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp' && pos > 0) { pos--; input.value = verlauf[pos]; e.preventDefault(); }
        if (e.key === 'ArrowDown') { pos = Math.min(verlauf.length, pos + 1); input.value = verlauf[pos] ?? ''; e.preventDefault(); }
      });
      f.inhalt.addEventListener('click', () => input.focus());
      input.focus();
    },
  });
}

function webbrowser(g) {
  fenster(`webbrowser:${g.id}`, `Webbrowser – ${g.name}`, {
    breite: 640, hoehe: 440,
    aufbauen(f) {
      f.inhalt.classList.add('nw-browser');
      f.inhalt.innerHTML = `<form class="nw-adresse"><input value="http://" aria-label="Adresse" spellcheck="false"><button type="submit" class="knopf">Laden</button></form>
<p class="nw-browser-status klein"></p>
<iframe class="nw-seite" sandbox="allow-same-origin" title="Webseite"></iframe>`;
      const adresse = f.inhalt.querySelector('.nw-adresse input');
      const status = f.inhalt.querySelector('.nw-browser-status');
      const rahmen = f.inhalt.querySelector('iframe');
      let aktuellerHost = '';
      const lade = (url) => {
        if (!zustand.netz.laeuft) { status.textContent = 'Die Simulation läuft nicht.'; return; }
        adresse.value = url;
        status.textContent = 'Lade …';
        zustand.netz.ladeSeite(g, url, (e) => {
          if (e.fehler) { status.textContent = `Fehler: ${e.fehler}`; rahmen.srcdoc = ''; return; }
          aktuellerHost = e.host;
          status.textContent = `${e.status} – von ${e.ip}`;
          rahmen.srcdoc = e.html;
          rahmen.onload = () => {
            // Links auf derselben Seite im simulierten Netz weiterverfolgen
            rahmen.contentDocument?.addEventListener('click', (ev) => {
              const a = ev.target.closest('a[href]');
              if (!a) return;
              ev.preventDefault();
              const href = a.getAttribute('href');
              lade(/^https?:\/\//.test(href) ? href : `http://${aktuellerHost}/${href.replace(/^\//, '')}`);
            });
          };
        });
      };
      f.inhalt.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); lade(adresse.value.trim()); });
      adresse.focus();
    },
  });
}

function serverKopf(g, art, name, erklaerung) {
  const d = g.daten[art];
  return `<div class="nw-zeile"><button type="button" class="knopf ${d.laeuft ? '' : 'primaer'} nw-start">${d.laeuft ? 'Stoppen' : 'Starten'}</button>
<span class="nw-server-status ${d.laeuft ? 'an' : ''}">${name} ${d.laeuft ? 'läuft' : 'ist aus'}</span></div><p class="klein">${erklaerung}</p>`;
}

function startKnopf(g, art, f, neu) {
  f.inhalt.querySelector('.nw-start').addEventListener('click', () => {
    g.daten[art].laeuft = !g.daten[art].laeuft;
    if (zustand.netz.laeuft) zustand.netz.dienste(g);
    speichere();
    neu(f);
  });
}

/** Ordner /webserver mit Startseite anlegen, falls er fehlt oder leer ist */
function webseitenAnlegen(g) {
  const fs = dateisystem(g);
  if (!fs.ordner.includes('/webserver')) fs.ordner.push('/webserver');
  if (!webDateien(g).length) fs.dateien['/webserver/index.html'] = STANDARD_SEITE;
}
const webDateien = (g) => alleDateien(g).filter((p) => p.startsWith('/webserver/')).map((p) => p.slice('/webserver/'.length));

function webserver(g) {
  g.daten.webserver ??= { laeuft: false };
  webseitenAnlegen(g);
  const aufbauen = (f) => {
    const d = { dateien: Object.fromEntries(webDateien(g).map((x) => [x, leseDatei(g, `/webserver/${x}`)])) };
    const namen = Object.keys(d.dateien);
    const gewaehlt = f.datei && d.dateien[f.datei] !== undefined ? f.datei : namen[0];
    f.datei = gewaehlt;
    f.inhalt.innerHTML = `${serverKopf(g, 'webserver', 'Webserver', `Liefert Webseiten über HTTP (TCP-Port 80) aus. Aufruf im Browser: http://${esc(g.nics[0].ip || 'IP-Adresse')}/dateiname. Die Dateien liegen im Ordner /webserver (auch im Datei-Explorer und Text-Editor).`)}
<div class="nw-zeile"><select class="nw-datei" aria-label="Datei">${namen.map((x) => `<option${x === gewaehlt ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select>
<button type="button" class="knopf nw-datei-neu">Neue Datei</button><button type="button" class="knopf nw-datei-weg"${namen.length <= 1 ? ' disabled' : ''}>Datei löschen</button></div>
<textarea class="nw-quelltext" spellcheck="false" aria-label="Inhalt der Datei">${esc(gewaehlt ? d.dateien[gewaehlt] : '')}</textarea>`;
    startKnopf(g, 'webserver', f, aufbauen);
    if (!gewaehlt) f.inhalt.querySelector('.nw-quelltext').disabled = true;
    f.inhalt.querySelector('.nw-datei').addEventListener('change', (e) => { f.datei = e.target.value; aufbauen(f); });
    f.inhalt.querySelector('.nw-quelltext').addEventListener('input', (e) => {
      try { schreibeDatei(g, `/webserver/${f.datei}`, e.target.value); speichere(); } catch (err) { melde(err.message, 'fehler'); }
    });
    f.inhalt.querySelector('.nw-datei-neu').addEventListener('click', () => {
      let i = 2;
      while (d.dateien[`seite${i}.html`] !== undefined) i++;
      f.datei = `seite${i}.html`;
      schreibeDatei(g, `/webserver/${f.datei}`, '<html><body>\n<h1>Neue Seite</h1>\n<p><a href="index.html">Zur Startseite</a></p>\n</body></html>\n');
      speichere();
      aufbauen(f);
    });
    f.inhalt.querySelector('.nw-datei-weg').addEventListener('click', () => { loesche(g, `/webserver/${f.datei}`); f.datei = null; speichere(); aufbauen(f); });
  };
  fenster(`webserver:${g.id}`, `Webserver – ${g.name}`, { breite: 560, hoehe: 420, aufbauen });
}

function dnsserver(g) {
  g.daten.dnsserver ??= { laeuft: false, eintraege: [] };
  const aufbauen = (f) => {
    const d = g.daten.dnsserver;
    f.inhalt.innerHTML = `${serverKopf(g, 'dnsserver', 'DNS-Server', 'Beantwortet Anfragen „Welche IP-Adresse hat dieser Name?“ (Typ A) und „Welcher Rechner nimmt E-Mails für diese Domain an?“ (Typ MX), über UDP-Port 53. Die Rechner tragen diese IP-Adresse als DNS-Server ein.')}
<table class="nw-tabelle"><thead><tr><th>Name</th><th>Typ</th><th>Wert (IP-Adresse bzw. Mailserver)</th><th></th></tr></thead><tbody>
${d.eintraege.map((e, i) => `<tr><td><input data-i="${i}" data-feld="name" value="${esc(e.name)}" placeholder="${(e.typ ?? 'A') === 'MX' ? 'schule.test' : 'www.schule.test'}" aria-label="Name"></td>
<td><select data-i="${i}" data-feld="typ" aria-label="Typ"><option${(e.typ ?? 'A') === 'A' ? ' selected' : ''}>A</option><option${e.typ === 'MX' ? ' selected' : ''}>MX</option></select></td>
<td><input data-i="${i}" data-feld="ip" value="${esc(e.ip)}" ${(e.typ ?? 'A') === 'A' ? 'data-pruef="ip"' : 'placeholder="mail.schule.test"'} aria-label="Wert"></td><td><button type="button" class="uf-link" data-weg="${i}" aria-label="Eintrag löschen">✕</button></td></tr>`).join('')}
</tbody></table><button type="button" class="knopf nw-dns-plus">+ Eintrag</button>`;
    startKnopf(g, 'dnsserver', f, aufbauen);
    f.inhalt.querySelectorAll('[data-i]').forEach((el) => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
      if (el.dataset.pruef) pruefe(el);
      d.eintraege[el.dataset.i][el.dataset.feld] = el.value.trim();
      speichere();
      if (el.tagName === 'SELECT') aufbauen(f);
    }));
    f.inhalt.querySelectorAll('[data-pruef]').forEach(pruefe);
    f.inhalt.querySelectorAll('[data-weg]').forEach((b) => b.addEventListener('click', () => { d.eintraege.splice(Number(b.dataset.weg), 1); speichere(); aufbauen(f); }));
    f.inhalt.querySelector('.nw-dns-plus').addEventListener('click', () => { d.eintraege.push({ name: '', typ: 'A', ip: '' }); speichere(); aufbauen(f); f.inhalt.querySelector('tbody tr:last-child input')?.focus(); });
  };
  fenster(`dnsserver:${g.id}`, `DNS-Server – ${g.name}`, { breite: 520, hoehe: 380, aufbauen });
}

function emailserver(g) {
  g.daten.emailserver ??= { laeuft: false, domain: '', konten: [], postfaecher: {} };
  const aufbauen = (f) => {
    const d = g.daten.emailserver;
    d.konten ??= [];
    d.postfaecher ??= {};
    f.inhalt.innerHTML = `${serverKopf(g, 'emailserver', 'E-Mail-Server', 'Nimmt Nachrichten über SMTP an (TCP-Port 25) und liefert sie über POP3 aus (TCP-Port 110). Nachrichten an andere Domains leitet er weiter – dazu fragt er den DNS-Server nach deren Mailserver (MX-Eintrag). Trage deshalb auch hier einen DNS-Server ein.')}
<label class="nw-feld nw-domain"><span>Domain dieses Servers</span><input data-domain value="${esc(d.domain)}" placeholder="schule.test"></label>
<h4>Konten</h4>
<table class="nw-tabelle"><thead><tr><th>Benutzername</th><th>Passwort</th><th>E-Mail-Adresse</th><th>im Postfach</th><th></th></tr></thead><tbody>
${d.konten.map((k, i) => `<tr><td><input data-k="${i}" data-feld="name" value="${esc(k.name)}" placeholder="anna" aria-label="Benutzername"></td>
<td><input data-k="${i}" data-feld="passwort" value="${esc(k.passwort)}" aria-label="Passwort"></td>
<td class="klein">${esc(k.name || '…')}@${esc(d.domain || '…')}</td><td>${(d.postfaecher[k.name.toLowerCase()] ?? []).length}</td>
<td><button type="button" class="uf-link" data-weg="${i}" aria-label="Konto löschen">✕</button></td></tr>`).join('')}
</tbody></table>
<button type="button" class="knopf nw-konto-plus">+ Konto</button>
<h4>Ereignisse</h4><ul class="nw-ereignisse klein"></ul>`;
    startKnopf(g, 'emailserver', f, aufbauen);
    f.inhalt.querySelector('[data-domain]').addEventListener('input', (e) => { d.domain = e.target.value.trim().toLowerCase(); speichere(); });
    f.inhalt.querySelectorAll('[data-k]').forEach((el) => el.addEventListener('input', () => {
      d.konten[el.dataset.k][el.dataset.feld] = el.dataset.feld === 'name' ? el.value.trim().toLowerCase() : el.value;
      speichere();
    }));
    f.inhalt.querySelectorAll('[data-weg]').forEach((b) => b.addEventListener('click', () => { d.konten.splice(Number(b.dataset.weg), 1); speichere(); aufbauen(f); }));
    f.inhalt.querySelector('.nw-konto-plus').addEventListener('click', () => { d.konten.push({ name: '', passwort: '' }); speichere(); aufbauen(f); f.inhalt.querySelector('tbody tr:last-child input')?.focus(); });
    f.letzte = null;
    f.aktualisieren(f);
  };
  fenster(`emailserver:${g.id}`, `E-Mail-Server – ${g.name}`, {
    breite: 600, hoehe: 460,
    aufbauen,
    aktualisieren(f) {
      const liste = zustand.netz.zustand?.get(g.id)?.mailEreignisse ?? [];
      const ul = f.inhalt.querySelector('.nw-ereignisse');
      if (!ul || f.letzte === liste.length) return;
      f.letzte = liste.length;
      ul.innerHTML = liste.length ? liste.slice(-30).reverse().map((e) => `<li>Takt ${e.zeit}: ${esc(e.text)}</li>`).join('') : '<li>Noch nichts passiert.</li>';
      // Zahl der Nachrichten in den Postfächern nachziehen
      f.inhalt.querySelectorAll('tbody tr').forEach((tr, i) => {
        const k = g.daten.emailserver.konten[i];
        if (k) tr.children[3].textContent = (g.daten.emailserver.postfaecher[k.name.toLowerCase()] ?? []).length;
      });
    },
  });
}

function emailprogramm(g) {
  g.daten.emailprogramm ??= { adresse: '', smtp: '', pop3: '', benutzer: '', passwort: '', eingang: [], gesendet: [] };
  const p = g.daten.emailprogramm;
  p.eingang ??= [];
  p.gesendet ??= [];
  const aufbauen = (f) => {
    f.reiter ??= p.adresse ? 'eingang' : 'konto';
    const reiter = [['eingang', `Posteingang${p.eingang.some((m) => !m.gelesen) ? ` (${p.eingang.filter((m) => !m.gelesen).length})` : ''}`], ['verfassen', 'Verfassen'], ['gesendet', 'Gesendet'], ['konto', 'Konto']];
    f.inhalt.innerHTML = `<div class="nw-reiter" role="tablist">${reiter.map(([k, t]) => `<button type="button" role="tab" aria-selected="${f.reiter === k}" data-reiter="${k}">${t}</button>`).join('')}</div>
<div class="nw-reiter-inhalt"></div><p class="nw-mail-status klein" aria-live="polite">${esc(f.status ?? '')}</p>`;
    f.inhalt.querySelectorAll('[data-reiter]').forEach((b) => b.addEventListener('click', () => { f.reiter = b.dataset.reiter; f.offen = null; aufbauen(f); }));
    const ziel = f.inhalt.querySelector('.nw-reiter-inhalt');
    const status = (t) => { f.status = t; f.inhalt.querySelector('.nw-mail-status').textContent = t; };
    if (f.reiter === 'konto') {
      ziel.innerHTML = `<div class="nw-felder nw-mail-konto">
${feld('E-Mail-Adresse', p.adresse, 'data-p="adresse" placeholder="anna@schule.test"')}
${feld('Postausgangsserver (SMTP)', p.smtp, 'data-p="smtp" placeholder="mail.schule.test"')}
${feld('Posteingangsserver (POP3)', p.pop3, 'data-p="pop3" placeholder="mail.schule.test"')}
${feld('Benutzername', p.benutzer, 'data-p="benutzer" placeholder="anna"')}
${feld('Passwort', p.passwort, 'data-p="passwort" type="password"')}
</div><p class="klein">Server lassen sich mit Namen (dann braucht der Rechner einen DNS-Server) oder mit IP-Adresse eintragen.</p>`;
      ziel.querySelectorAll('[data-p]').forEach((el) => el.addEventListener('input', () => { p[el.dataset.p] = el.value.trim(); speichere(); }));
      return;
    }
    if (f.reiter === 'verfassen') {
      ziel.innerHTML = `<form class="nw-mail-form">
<label class="nw-feld"><span>An (mehrere mit Komma trennen)</span><input name="an" value="${esc(f.entwurf?.an ?? '')}" placeholder="ben@verein.test"></label>
<label class="nw-feld"><span>Betreff</span><input name="betreff" value="${esc(f.entwurf?.betreff ?? '')}"></label>
<label class="nw-feld"><span>Nachricht</span><textarea name="text" rows="6">${esc(f.entwurf?.text ?? '')}</textarea></label>
<div class="nw-zeile"><button type="submit" class="knopf primaer">Senden</button><span class="klein">Absender: ${esc(p.adresse || '(im Konto eintragen)')}</span></div></form>`;
      const form = ziel.querySelector('form');
      form.addEventListener('input', () => { f.entwurf = { an: form.an.value, betreff: form.betreff.value, text: form.text.value }; });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!zustand.netz.laeuft) { status('Die Simulation läuft nicht.'); return; }
        const an = form.an.value.split(/[,;\s]+/).map((x) => x.trim().toLowerCase()).filter(Boolean);
        if (!p.adresse || !/@/.test(p.adresse)) { status('Bitte zuerst im Reiter „Konto“ die eigene E-Mail-Adresse eintragen.'); return; }
        if (!an.length || an.some((x) => !/^[^@\s]+@[^@\s]+$/.test(x))) { status('Bitte gültige Empfängeradressen angeben (name@domain).'); return; }
        const mail = { an, betreff: form.betreff.value, text: form.text.value };
        status('Sende …');
        form.querySelector('button').disabled = true;
        zustand.netz.mailSenden(g, mail, (fehler) => {
          if (fehler) { status(`Nicht gesendet: ${fehler}`); form.querySelector('button').disabled = false; return; }
          p.gesendet.unshift({ ...mail, von: p.adresse, takt: zustand.netz.zeit });
          f.entwurf = null;
          speichere();
          f.reiter = 'gesendet';
          f.status = `Gesendet an ${an.join(', ')}.`;
          aufbauen(f);
        });
      });
      return;
    }
    const liste = f.reiter === 'gesendet' ? p.gesendet : p.eingang;
    const offen = f.offen != null ? liste[f.offen] : null;
    ziel.innerHTML = `${f.reiter === 'eingang' ? '<div class="nw-zeile"><button type="button" class="knopf primaer nw-abholen">Abholen</button><span class="klein">holt neue Nachrichten über POP3 vom Server</span></div>' : ''}
<div class="nw-mail-liste">${liste.length ? liste.map((m, i) => `<button type="button" class="nw-mail${m.gelesen === false ? ' neu' : ''}${f.offen === i ? ' offen' : ''}" data-i="${i}"><span>${esc(f.reiter === 'gesendet' ? `An: ${(m.an ?? []).join(', ')}` : m.von)}</span><strong>${esc(m.betreff || '(ohne Betreff)')}</strong></button>`).join('') : `<p class="klein">${f.reiter === 'gesendet' ? 'Noch nichts gesendet.' : 'Keine Nachrichten. Mit „Abholen“ fragst du den Server.'}</p>`}</div>
${offen ? `<article class="nw-mail-lesen"><p class="klein">Von: ${esc(offen.von)}<br>An: ${esc((offen.an ?? []).join(', '))}</p><h4>${esc(offen.betreff || '(ohne Betreff)')}</h4><pre>${esc(offen.text)}</pre>
${f.reiter === 'eingang' ? '<div class="nw-zeile"><button type="button" class="knopf nw-antworten">Antworten</button><button type="button" class="knopf nw-mail-weg">Löschen</button></div>' : ''}</article>` : ''}`;
    ziel.querySelectorAll('.nw-mail').forEach((b) => b.addEventListener('click', () => {
      f.offen = Number(b.dataset.i);
      if (liste[f.offen].gelesen === false) { liste[f.offen].gelesen = true; speichere(); }
      aufbauen(f);
    }));
    ziel.querySelector('.nw-antworten')?.addEventListener('click', () => {
      f.entwurf = { an: offen.von, betreff: /^re:/i.test(offen.betreff) ? offen.betreff : `Re: ${offen.betreff}`, text: `\n\n> ${offen.text.split('\n').join('\n> ')}` };
      f.reiter = 'verfassen';
      aufbauen(f);
    });
    ziel.querySelector('.nw-mail-weg')?.addEventListener('click', () => { p.eingang.splice(f.offen, 1); f.offen = null; speichere(); aufbauen(f); });
    ziel.querySelector('.nw-abholen')?.addEventListener('click', (e) => {
      if (!zustand.netz.laeuft) { status('Die Simulation läuft nicht.'); return; }
      e.target.disabled = true;
      status('Verbinde mit dem Posteingangsserver …');
      zustand.netz.mailAbholen(g, (r) => {
        f.status = r.fehler ? `Abholen fehlgeschlagen: ${r.fehler}` : r.neu ? `${r.neu} neue Nachricht(en).` : 'Keine neuen Nachrichten.';
        f.offen = null;
        speichere();
        aufbauen(f);
      });
    });
  };
  fenster(`emailprogramm:${g.id}`, `E-Mail-Programm – ${g.name}`, { breite: 620, hoehe: 460, aufbauen });
}

function firewall(g) {
  g.firewall ??= { aktiv: false, standard: 'verwerfen', antworten: true, regeln: [] };
  const fw = g.firewall;
  fw.regeln ??= [];
  const aufbauen = (f) => {
    f.inhalt.innerHTML = `<p class="klein">${g.typ === 'router'
      ? 'Die Firewall des Routers prüft jedes Paket, das er weiterleitet oder selbst empfängt.'
      : 'Die Firewall prüft jedes Paket, das bei diesem Rechner ankommt. Was er selbst verschickt, lässt sie durch.'}
Die Regeln gelten von oben nach unten – die erste passende entscheidet, sonst die Standardregel.</p>
<label class="nw-check"><input type="checkbox" data-fw="aktiv"${fw.aktiv ? ' checked' : ''}> <strong>Firewall eingeschaltet</strong></label>
<div class="nw-zeile"><label>Wenn keine Regel passt: <select data-fw="standard"><option value="verwerfen"${fw.standard !== 'zulassen' ? ' selected' : ''}>verwerfen</option><option value="zulassen"${fw.standard === 'zulassen' ? ' selected' : ''}>zulassen</option></select></label></div>
<label class="nw-check"><input type="checkbox" data-fw="antworten"${fw.antworten !== false ? ' checked' : ''}> Antworten immer zulassen – also Pakete, die zu einer schon begonnenen Verbindung gehören (z. B. die Webseite, die ein Browser angefordert hat). Neue Anfragen von außen prüfen die Regeln.</label>
<table class="nw-tabelle nw-regeln"><thead><tr><th>#</th><th>Aktion</th><th>Protokoll</th><th>Absender</th><th>Empfänger</th><th>Ziel-Port</th><th></th></tr></thead><tbody>
${fw.regeln.map((r, i) => `<tr><td>${i + 1}</td>
<td><select data-r="${i}" data-feld="aktion" aria-label="Aktion"><option value="zulassen"${r.aktion === 'zulassen' ? ' selected' : ''}>zulassen</option><option value="verwerfen"${r.aktion !== 'zulassen' ? ' selected' : ''}>verwerfen</option></select></td>
<td><select data-r="${i}" data-feld="protokoll" aria-label="Protokoll">${['alle', 'TCP', 'UDP', 'ICMP'].map((x) => `<option${(r.protokoll ?? 'alle') === x ? ' selected' : ''}>${x}</option>`).join('')}</select></td>
<td><input data-r="${i}" data-feld="quelle" value="${esc(r.quelle)}" placeholder="beliebig" data-bereich aria-label="Absender"></td>
<td><input data-r="${i}" data-feld="ziel" value="${esc(r.ziel)}" placeholder="beliebig" data-bereich aria-label="Empfänger"></td>
<td><input data-r="${i}" data-feld="port" value="${esc(r.port)}" placeholder="alle" inputmode="numeric" aria-label="Ziel-Port" class="nw-port"${r.protokoll === 'ICMP' ? ' disabled' : ''}></td>
<td class="nw-regel-knoepfe"><button type="button" class="uf-link" data-hoch="${i}"${i === 0 ? ' disabled' : ''} aria-label="nach oben">↑</button><button type="button" class="uf-link" data-weg="${i}" aria-label="Regel löschen">✕</button></td></tr>`).join('')}
</tbody></table>
<div class="nw-zeile"><button type="button" class="knopf nw-regel-plus">+ Regel</button>
<span class="klein">Adressen: einzelne IP-Adresse, Netz wie 192.168.1.0/24 oder 192.168.1.0/255.255.255.0, leer = beliebig. Ports: 80 HTTP, 25 SMTP, 110 POP3, 53 DNS.</span></div>
${g.typ !== 'router' && !g.software.includes('firewall') ? '<p class="nw-hinweis">Die Firewall wirkt erst, wenn sie über die Software-Installation installiert ist.</p>' : ''}
<h4>Verworfene Pakete <span class="nw-fw-zahl"></span></h4><ul class="nw-ereignisse klein nw-fw-liste"></ul>`;
    f.inhalt.querySelectorAll('[data-fw]').forEach((el) => el.addEventListener('change', () => {
      fw[el.dataset.fw] = el.type === 'checkbox' ? el.checked : el.value;
      speichere();
    }));
    const pruefeBereich = (el) => el.classList.toggle('falsch', adressbereich(el.value) === null);
    f.inhalt.querySelectorAll('[data-r]').forEach((el) => {
      if (el.hasAttribute('data-bereich')) pruefeBereich(el);
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
        if (el.hasAttribute('data-bereich')) pruefeBereich(el);
        if (el.dataset.feld === 'port') el.classList.toggle('falsch', el.value.trim() !== '' && !/^\d{1,5}$/.test(el.value.trim()));
        fw.regeln[el.dataset.r][el.dataset.feld] = el.value.trim();
        speichere();
        if (el.dataset.feld === 'protokoll') aufbauen(f);
      });
    });
    f.inhalt.querySelectorAll('[data-weg]').forEach((b) => b.addEventListener('click', () => { fw.regeln.splice(Number(b.dataset.weg), 1); speichere(); aufbauen(f); }));
    f.inhalt.querySelectorAll('[data-hoch]').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.hoch);
      [fw.regeln[i - 1], fw.regeln[i]] = [fw.regeln[i], fw.regeln[i - 1]];
      speichere();
      aufbauen(f);
    }));
    f.inhalt.querySelector('.nw-regel-plus').addEventListener('click', () => {
      fw.regeln.push({ aktion: 'zulassen', protokoll: 'TCP', quelle: '', ziel: '', port: '' });
      speichere();
      aufbauen(f);
    });
    f.letzte = null;
    f.aktualisieren(f);
  };
  fenster(`firewall:${g.id}`, `Firewall – ${g.name}`, {
    breite: 760, hoehe: 480,
    aufbauen,
    aktualisieren(f) {
      const z = zustand.netz.zustand?.get(g.id);
      const liste = z?.fwEreignisse ?? [];
      if (f.letzte === liste.length) return;
      f.letzte = liste.length;
      f.inhalt.querySelector('.nw-fw-zahl').textContent = zustand.netz.laeuft ? `(${z?.fwVerworfen ?? 0})` : '';
      f.inhalt.querySelector('.nw-fw-liste').innerHTML = !zustand.netz.laeuft
        ? '<li>Wird während der Simulation angezeigt.</li>'
        : liste.length ? liste.slice(-30).reverse().map((e) => `<li>Takt ${e.zeit}: ${esc(e.text)}</li>`).join('') : '<li>Noch nichts verworfen.</li>';
    },
  });
}

function echoserver(g) {
  g.daten.echoserver ??= { laeuft: false, port: ECHO_PORT };
  const aufbauen = (f) => {
    const d = g.daten.echoserver;
    f.inhalt.innerHTML = `${serverKopf(g, 'echoserver', 'Echo-Server', 'Wartet auf TCP-Verbindungen und schickt jede Nachricht unverändert zurück – so lässt sich das Client-Server-Prinzip beobachten.')}
<label class="nw-feld nw-domain"><span>Port</span><input data-port value="${esc(d.port)}" inputmode="numeric"${d.laeuft ? ' disabled' : ''}></label>
<p class="klein">${d.laeuft ? 'Zum Ändern des Ports den Server erst stoppen.' : `Üblich ist ${ECHO_PORT}. Der Client muss denselben Port verwenden.`}</p>
<h4>Ereignisse</h4><ul class="nw-ereignisse klein"></ul>`;
    startKnopf(g, 'echoserver', f, aufbauen);
    const feldPort = f.inhalt.querySelector('[data-port]');
    feldPort.addEventListener('input', () => {
      const p = Number(feldPort.value.trim());
      const ok = Number.isInteger(p) && p >= 1 && p <= 65535;
      feldPort.classList.toggle('falsch', !ok);
      if (ok) { d.port = p; speichere(); }
    });
    f.letzte = null;
    f.aktualisieren(f);
  };
  fenster(`echoserver:${g.id}`, `Echo-Server – ${g.name}`, {
    breite: 520, hoehe: 400,
    aufbauen,
    aktualisieren(f) {
      const liste = zustand.netz.zustand?.get(g.id)?.echoEreignisse ?? [];
      const ul = f.inhalt.querySelector('.nw-ereignisse');
      if (!ul || f.letzte === liste.length) return;
      f.letzte = liste.length;
      ul.innerHTML = liste.length ? liste.slice(-40).reverse().map((e) => `<li>Takt ${e.zeit}: ${esc(e.text)}</li>`).join('') : '<li>Noch keine Verbindung.</li>';
    },
  });
}

function client(g) {
  g.daten.client ??= { adresse: '', port: ECHO_PORT };
  const d = g.daten.client;
  fenster(`client:${g.id}`, `Einfacher Client – ${g.name}`, {
    breite: 560, hoehe: 440,
    aufbauen(f) {
      f.inhalt.classList.add('nw-client');
      f.inhalt.innerHTML = `<div class="nw-zeile">
<label class="nw-feld"><span>Server (IP-Adresse oder Name)</span><input data-c="adresse" value="${esc(d.adresse)}" placeholder="192.168.0.2"></label>
<label class="nw-feld nw-feld-port"><span>Port</span><input data-c="port" value="${esc(d.port)}" inputmode="numeric"></label>
<button type="button" class="knopf primaer nw-verbinden">Verbinden</button></div>
<div class="nw-verlauf" aria-live="polite"></div>
<form class="nw-zeile nw-nachricht"><input aria-label="Nachricht" placeholder="Nachricht" disabled><button type="submit" class="knopf" disabled>Senden</button></form>`;
      const verlauf = f.inhalt.querySelector('.nw-verlauf');
      const knopf = f.inhalt.querySelector('.nw-verbinden');
      const eingabe = f.inhalt.querySelector('.nw-nachricht input');
      const senden = f.inhalt.querySelector('.nw-nachricht button');
      const zeile = (text, art) => { verlauf.insertAdjacentHTML('beforeend', `<p class="nw-${art}">${esc(text)}</p>`); verlauf.scrollTop = verlauf.scrollHeight; };
      const verbunden = (an) => {
        eingabe.disabled = !an;
        senden.disabled = !an;
        knopf.textContent = an ? 'Trennen' : 'Verbinden';
        f.inhalt.querySelectorAll('[data-c]').forEach((el) => { el.disabled = an; });
        if (an) eingabe.focus();
      };
      f.inhalt.querySelectorAll('[data-c]').forEach((el) => el.addEventListener('input', () => { d[el.dataset.c] = el.value.trim(); speichere(); }));
      knopf.addEventListener('click', () => {
        if (f.verbindung) { f.verbindung.trennen(); knopf.disabled = true; return; }
        if (!zustand.netz.laeuft) { zeile('Die Simulation läuft nicht.', 'status'); return; }
        const port = Number(d.port);
        if (!Number.isInteger(port) || port < 1 || port > 65535) { zeile('Bitte einen gültigen Port angeben (1 bis 65535).', 'status'); return; }
        knopf.disabled = true;
        zeile(`Verbinde mit ${d.adresse}, Port ${port} …`, 'status');
        zustand.netz.namensaufloesung(g, d.adresse, (ip, fehler) => {
          if (!ip) { zeile(fehler, 'status'); knopf.disabled = false; return; }
          f.verbindung = zustand.netz.tcpVerbindung(g, ip, port, {
            verbunden: () => { knopf.disabled = false; zeile(`Verbunden mit ${ip}:${port}.`, 'status'); verbunden(true); },
            daten: (text) => zeile(text, 'server'),
            ende: (e) => {
              f.verbindung = null;
              knopf.disabled = false;
              zeile(e?.fehler ? `Keine Verbindung: ${e.fehler}` : 'Verbindung getrennt.', 'status');
              verbunden(false);
            },
          });
        });
      });
      f.inhalt.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const text = eingabe.value;
        if (!text || !f.verbindung) return;
        eingabe.value = '';
        zeile(text, 'ich');
        f.verbindung.senden(text);
      });
    },
  });
}

// ------------------------------------------------------------------ Einblicke: Datenaustausch, SAT, Routen

function datenaustausch(g) {
  fenster(`log:${g.id}`, `Datenaustausch – ${g.name}`, {
    breite: 820, hoehe: 360,
    aufbauen(f) {
      f.inhalt.innerHTML = `<div class="nw-zeile"><button type="button" class="knopf nw-leeren">Leeren</button>
<label class="nw-check"><input type="checkbox" class="nw-ohne-arp"> ARP ausblenden</label>
<span class="klein">Jede Nachricht erscheint mit einer Zeile je Schicht; ↑ gesendet, ↓ empfangen.</span></div>
<div class="nw-log-rahmen"><table class="nw-tabelle nw-log"><thead><tr><th>Nr.</th><th>Takt</th><th></th><th>Quelle</th><th>Ziel</th><th>Protokoll</th><th>Schicht</th><th>Bemerkungen</th></tr></thead><tbody></tbody></table></div>`;
      f.gezeigt = 0;
      f.inhalt.querySelector('.nw-leeren').addEventListener('click', () => { const z = zustand.netz.zustand?.get(g.id); if (z) z.log.length = 0; f.gezeigt = 0; f.inhalt.querySelector('tbody').innerHTML = ''; });
      f.inhalt.querySelector('.nw-ohne-arp').addEventListener('change', () => { f.gezeigt = 0; f.inhalt.querySelector('tbody').innerHTML = ''; f.aktualisieren(f); });
      f.aktualisieren(f);
    },
    aktualisieren(f) {
      const log = zustand.netz.zustand?.get(g.id)?.log ?? [];
      if (log.length === f.gezeigt) return;
      if (log.length < f.gezeigt) { f.gezeigt = 0; f.inhalt.querySelector('tbody').innerHTML = ''; }
      const ohneArp = f.inhalt.querySelector('.nw-ohne-arp').checked;
      const rahmen = f.inhalt.querySelector('.nw-log-rahmen');
      const unten = rahmen.scrollTop + rahmen.clientHeight >= rahmen.scrollHeight - 30;
      const zeilen = log.slice(f.gezeigt).filter((z) => !(ohneArp && z.protokoll === 'ARP'));
      f.inhalt.querySelector('tbody').insertAdjacentHTML('beforeend', zeilen.map((z) => `<tr class="nw-schicht-${z.schicht.toLowerCase()}${z.nr % 2 ? ' ungerade' : ''}${z.protokoll === 'Firewall' ? ' nw-fw' : ''}"><td>${z.nr}</td><td>${z.zeit}</td><td>${z.richtung === 'aus' ? '↑' : '↓'}</td><td>${esc(z.quelle)}</td><td>${esc(z.ziel)}</td><td>${esc(z.protokoll)}</td><td>${z.schicht}</td><td>${esc(z.bemerkung)}</td></tr>`).join(''));
      f.gezeigt = log.length;
      if (unten) rahmen.scrollTop = rahmen.scrollHeight;
    },
  });
}

function satFenster(g) {
  fenster(`sat:${g.id}`, `Lerntabelle (SAT) – ${g.name}`, {
    breite: 420, hoehe: 300,
    aufbauen(f) { f.aktualisieren(f); },
    aktualisieren(f) {
      const sat = [...(zustand.netz.zustand?.get(g.id)?.sat ?? new Map())];
      const neu = JSON.stringify(sat);
      if (neu === f.letzte) return;
      f.letzte = neu;
      const anschluss = (port) => `${port + 1} (${esc(zustand.netz.gegenueber(g.id, port)?.name ?? '–')})`;
      f.inhalt.innerHTML = `<p class="klein">Der Switch merkt sich, an welchem Anschluss eine MAC-Adresse zuletzt als Absender auftauchte.</p>
${sat.length ? `<table class="nw-tabelle"><thead><tr><th>MAC-Adresse</th><th>Anschluss</th></tr></thead><tbody>${sat.map(([mac, port]) => `<tr><td>${mac}</td><td>${anschluss(port)}</td></tr>`).join('')}</tbody></table>` : '<p>Noch leer – es ist noch nichts durch den Switch gelaufen.</p>'}`;
    },
  });
}

function routenFenster(g) {
  fenster(`routen:${g.id}`, `Weiterleitungstabelle – ${g.name}`, {
    breite: 560, hoehe: 280,
    aufbauen(f) {
      const t = zustand.netz.routingTabelle(g);
      f.inhalt.innerHTML = `<table class="nw-tabelle"><thead><tr><th>Ziel</th><th>Netzmaske</th><th>Gateway</th><th>Schnittstelle</th><th></th></tr></thead><tbody>
${t.map((r) => `<tr><td>${r.ziel}</td><td>${r.maske}</td><td>${r.gateway || '–'}</td><td>${esc(g.nics[r.nic]?.ip || '–')}</td><td class="klein">${r.auto ? 'automatisch' : 'eigener Eintrag'}</td></tr>`).join('')}
</tbody></table>${t.length ? '' : '<p>Leer – ohne IP-Adressen gibt es keine Routen.</p>'}`;
    },
  });
}

// ------------------------------------------------------------------ Text-Editor und Datei-Explorer

function herunterladen(name, text, typ = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type: `${typ};charset=utf-8` }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const ordnerVon = (pfad) => pfad.slice(0, pfad.lastIndexOf('/')) || '/';
const dateiname = (pfad) => pfad.slice(pfad.lastIndexOf('/') + 1);

/** Text-Editor: eine Datei öffnen, bearbeiten und speichern (pfad: gleich diese Datei öffnen) */
function texteditor(g, pfad = null) {
  const id = `texteditor:${g.id}`;
  const offen = fensterListe.get(id);
  if (offen && pfad && pfad !== offen.pfad) {
    if (offen.geaendert) { offen.el.style.zIndex = ++fensterZ; melde('Im Text-Editor gibt es ungespeicherte Änderungen. Speichere sie zuerst.', 'fehler'); return; }
    offen.oeffne(pfad);
  }
  fenster(id, `Text-Editor – ${g.name}`, {
    breite: 580, hoehe: 420,
    vorSchliessen(f) {
      if (!f.geaendert || f.warnung) return true;
      f.warnung = true;
      f.zeigeStatus('Ungespeicherte Änderungen! Speichern – oder noch einmal ✕ klicken, um sie zu verwerfen.', true);
      return false;
    },
    aufbauen(f) {
      f.inhalt.classList.add('nw-editor');
      f.inhalt.innerHTML = `<div class="nw-zeile nw-werkzeugleiste">
<button type="button" class="knopf" data-t="neu">Neu</button>
<select class="nw-oeffnen-liste" aria-label="Datei öffnen"></select>
<button type="button" class="knopf" data-t="speichern">Speichern</button>
<button type="button" class="knopf" data-t="unter">Speichern unter …</button></div>
<form class="nw-zeile nw-unter" hidden><label class="klein" for="nw-unter-${g.id}">Speichern als</label>
<input id="nw-unter-${g.id}" class="nw-pfad" spellcheck="false" autocomplete="off"><button class="knopf primaer">OK</button><button type="button" class="knopf" data-t="abbrechen">Abbrechen</button></form>
<p class="nw-editor-status klein" aria-live="polite"></p>
<textarea class="nw-quelltext nw-editor-text" spellcheck="false" aria-label="Text"></textarea>`;
      const text = f.inhalt.querySelector('textarea');
      const liste = f.inhalt.querySelector('.nw-oeffnen-liste');
      const unter = f.inhalt.querySelector('.nw-unter');
      const status = f.inhalt.querySelector('.nw-editor-status');
      f.zeigeStatus = (t = '', warnung = false) => {
        status.textContent = t || (f.pfad ? `${f.pfad}${f.geaendert ? ' – geändert, noch nicht gespeichert' : ''}` : `Neue Datei${f.geaendert ? ' (noch nicht gespeichert)' : ''}`);
        status.classList.toggle('nw-hinweis', warnung || f.geaendert);
      };
      const fuelleListe = () => {
        liste.innerHTML = `<option value="">Öffnen …</option>${alleDateien(g).map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join('')}`;
      };
      f.oeffne = (p) => {
        try { text.value = p ? leseDatei(g, p) : ''; } catch (err) { melde(err.message, 'fehler'); return; }
        f.pfad = p;
        f.geaendert = false;
        f.warnung = false;
        unter.hidden = true;
        fuelleListe();
        f.zeigeStatus();
        text.focus();
      };
      const speichernAls = (p) => {
        try {
          const ziel = schreibeDatei(g, p, text.value);
          f.pfad = ziel;
          f.geaendert = false;
          f.warnung = false;
          speichere();
          unter.hidden = true;
          fuelleListe();
          f.zeigeStatus(`Gespeichert: ${ziel}`);
          setTimeout(() => { if (!f.geaendert) f.zeigeStatus(); }, 2500);
          aktualisiereExplorer(g);
        } catch (err) { f.zeigeStatus(err.message, true); }
      };
      const fragePfad = () => {
        unter.hidden = false;
        const eingabe = unter.querySelector('input');
        eingabe.value = f.pfad ?? '/dokumente/neu.txt';
        eingabe.focus();
        eingabe.setSelectionRange(eingabe.value.lastIndexOf('/') + 1, eingabe.value.length);
      };
      text.addEventListener('input', () => { if (!f.geaendert) { f.geaendert = true; f.zeigeStatus(); } f.warnung = false; });
      text.addEventListener('keydown', (e) => {
        if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (f.pfad) speichernAls(f.pfad); else fragePfad(); }
      });
      liste.addEventListener('change', () => {
        const p = liste.value;
        liste.value = '';
        if (!p) return;
        if (f.geaendert) { f.zeigeStatus('Erst speichern – sonst gehen die Änderungen verloren. (Oder „Neu“ und dann öffnen.)', true); return; }
        f.oeffne(p);
      });
      f.inhalt.querySelector('[data-t="neu"]').addEventListener('click', () => {
        if (f.geaendert && !f.warnung) { f.warnung = true; f.zeigeStatus('Ungespeicherte Änderungen! Noch einmal „Neu“ klicken, um sie zu verwerfen.', true); return; }
        f.oeffne(null);
      });
      f.inhalt.querySelector('[data-t="speichern"]').addEventListener('click', () => { if (f.pfad) speichernAls(f.pfad); else fragePfad(); });
      f.inhalt.querySelector('[data-t="unter"]').addEventListener('click', fragePfad);
      f.inhalt.querySelector('[data-t="abbrechen"]').addEventListener('click', () => { unter.hidden = true; f.zeigeStatus(); });
      unter.addEventListener('submit', (e) => {
        e.preventDefault();
        const p = normalerPfad(unter.querySelector('input').value);
        if (!p || p === '/') { f.zeigeStatus('Ungültiger Dateiname.', true); return; }
        if (existiert(g, p) === 'datei' && p !== f.pfad && unter.dataset.ueberschreiben !== p) {
          unter.dataset.ueberschreiben = p;
          f.zeigeStatus(`${p} gibt es schon. Noch einmal OK klicken, um sie zu überschreiben.`, true);
          return;
        }
        delete unter.dataset.ueberschreiben;
        speichernAls(p);
      });
      f.oeffne(pfad);
    },
  });
}

function aktualisiereExplorer(g) {
  const f = fensterListe.get(`dateiexplorer:${g.id}`);
  if (f) f.aufbauen(f);
}

function dateiexplorer(g) {
  dateisystem(g);
  fenster(`dateiexplorer:${g.id}`, `Datei-Explorer – ${g.name}`, {
    breite: 560, hoehe: 400,
    aufbauen(f) {
      f.ordner = existiert(g, f.ordner ?? '/') === 'ordner' ? f.ordner ?? '/' : '/';
      const inhalt = ordnerInhalt(g, f.ordner);
      const teile = f.ordner.split('/').filter(Boolean);
      f.inhalt.classList.add('nw-explorer');
      f.inhalt.innerHTML = `<nav class="nw-pfadleiste" aria-label="Ordner"><button type="button" class="uf-link" data-ordner="/">${esc(g.name)}</button>${teile.map((t, i) => ` / <button type="button" class="uf-link" data-ordner="/${esc(teile.slice(0, i + 1).join('/'))}">${esc(t)}</button>`).join('')}</nav>
<div class="nw-zeile">
<button type="button" class="knopf" data-t="hoch"${f.ordner === '/' ? ' disabled' : ''}>⬆ Ordner hoch</button>
<button type="button" class="knopf" data-t="ordner">+ Ordner</button>
<button type="button" class="knopf" data-t="datei">+ Textdatei</button>
<label class="knopf">Importieren … <input type="file" multiple class="sr nw-import"></label></div>
<form class="nw-zeile nw-name-form" hidden><label class="klein"></label><input spellcheck="false" autocomplete="off" maxlength="60"><button class="knopf primaer">OK</button><button type="button" class="knopf" data-t="abbrechen">Abbrechen</button></form>
<table class="nw-tabelle nw-dateiliste"><thead><tr><th>Name</th><th>Größe</th><th><span class="sr">Aktionen</span></th></tr></thead><tbody>
${inhalt.map((e) => `<tr data-pfad="${esc(e.pfad)}"><td><button type="button" class="uf-link nw-eintrag" data-art="${e.ordner ? 'ordner' : 'datei'}">${e.ordner ? '📁' : '📄'} ${esc(e.name)}</button></td>
<td class="klein">${e.ordner ? 'Ordner' : `${e.groesse} Zeichen`}</td>
<td class="nw-aktionen">${e.ordner ? '' : '<button type="button" class="uf-link" data-t="laden" title="Auf deinen Computer herunterladen">⬇</button>'}
<button type="button" class="uf-link" data-t="umbenennen" title="Umbenennen">✎</button>
<button type="button" class="uf-link" data-t="loeschen" title="Löschen">✕</button></td></tr>`).join('')}
</tbody></table>
${inhalt.length ? '' : '<p class="klein nw-tipp">Dieser Ordner ist leer.</p>'}
<p class="klein nw-tipp">Klick auf einen Ordner öffnet ihn, Klick auf eine Datei öffnet sie im Text-Editor. „Importieren“ holt Textdateien (z. B. .html, .txt) von deinem Computer in diesen Ordner.</p>`;
      const form = f.inhalt.querySelector('.nw-name-form');
      const frageName = (beschriftung, wert, ok) => {
        form.hidden = false;
        form.querySelector('label').textContent = beschriftung;
        const eingabe = form.querySelector('input');
        eingabe.value = wert;
        eingabe.focus();
        eingabe.setSelectionRange(0, wert.includes('.') ? wert.lastIndexOf('.') : wert.length);
        form.onsubmit = (e) => {
          e.preventDefault();
          try { ok(eingabe.value.trim()); speichere(); f.aufbauen(f); } catch (err) { melde(err.message, 'fehler'); }
        };
      };
      const pfadIn = (name) => (f.ordner === '/' ? `/${name}` : `${f.ordner}/${name}`);
      f.inhalt.querySelectorAll('[data-ordner]').forEach((b) => b.addEventListener('click', () => { f.ordner = b.dataset.ordner; f.aufbauen(f); }));
      f.inhalt.querySelector('[data-t="hoch"]').addEventListener('click', () => { f.ordner = ordnerVon(f.ordner); f.aufbauen(f); });
      f.inhalt.querySelector('[data-t="ordner"]').addEventListener('click', () => frageName('Name des neuen Ordners', 'Neuer Ordner', (n) => neuerOrdner(g, pfadIn(n))));
      f.inhalt.querySelector('[data-t="datei"]').addEventListener('click', () => frageName('Name der neuen Datei', 'neu.txt', (n) => {
        if (existiert(g, pfadIn(n))) throw new Error(`${n} gibt es hier schon.`);
        schreibeDatei(g, pfadIn(n), '');
      }));
      form.querySelector('[data-t="abbrechen"]').addEventListener('click', () => { form.hidden = true; });
      f.inhalt.querySelectorAll('.nw-eintrag').forEach((b) => b.addEventListener('click', () => {
        const p = b.closest('tr').dataset.pfad;
        if (b.dataset.art === 'ordner') { f.ordner = p; f.aufbauen(f); return; }
        if (!g.software.includes('texteditor')) { melde('Installiere den Text-Editor (Software-Installation), um Dateien zu öffnen.', 'fehler'); return; }
        texteditor(g, p);
      }));
      f.inhalt.querySelectorAll('[data-t="laden"]').forEach((b) => b.addEventListener('click', () => {
        const p = b.closest('tr').dataset.pfad;
        herunterladen(dateiname(p), leseDatei(g, p), p.endsWith('.html') ? 'text/html' : 'text/plain');
      }));
      f.inhalt.querySelectorAll('[data-t="umbenennen"]').forEach((b) => b.addEventListener('click', () => {
        const p = b.closest('tr').dataset.pfad;
        frageName(`Neuer Name für ${dateiname(p)}`, dateiname(p), (n) => {
          const neu = benenneUm(g, p, n);
          const editor = fensterListe.get(`texteditor:${g.id}`);
          if (editor?.pfad === p) { editor.pfad = neu; editor.zeigeStatus(); }
        });
      }));
      f.inhalt.querySelectorAll('[data-t="loeschen"]').forEach((b) => b.addEventListener('click', () => {
        const p = b.closest('tr').dataset.pfad;
        const vorher = JSON.parse(JSON.stringify(dateisystem(g)));
        loesche(g, p);
        speichere();
        f.aufbauen(f);
        melde(`„${dateiname(p)}“ gelöscht.`, 'info', () => { g.daten.dateisystem = vorher; speichere(); aktualisiereExplorer(g); });
      }));
      f.inhalt.querySelector('.nw-import').addEventListener('change', async (e) => {
        const dateien = [...e.target.files];
        e.target.value = '';
        let anzahl = 0;
        for (const datei of dateien) {
          const text = await datei.text();
          if (text.length > MAX_DATEI || text.includes('\u0000')) { melde(`„${datei.name}“ ist keine Textdatei oder zu groß (höchstens ${MAX_DATEI / 1000} 000 Zeichen).`, 'fehler'); continue; }
          // Name bereinigen und nichts überschreiben: „name (2).txt“
          const basis = datei.name.replace(/[\\/:*?"<>|]/g, '_').slice(0, 55) || 'datei.txt';
          const punkt = basis.lastIndexOf('.') > 0 ? basis.lastIndexOf('.') : basis.length;
          let name = basis;
          for (let i = 2; existiert(g, pfadIn(name)); i++) name = `${basis.slice(0, punkt)} (${i})${basis.slice(punkt)}`;
          try { schreibeDatei(g, pfadIn(name), text); anzahl++; } catch (err) { melde(err.message, 'fehler'); }
        }
        if (anzahl) { speichere(); f.aufbauen(f); melde(`${anzahl} Datei${anzahl > 1 ? 'en' : ''} importiert.`); }
      });
    },
  });
}

// ------------------------------------------------------------------ Modem (Verbindung zu einer anderen Simulation)

const modems = new Map(); // Geräte-ID → {code, token, seite, partner, raus, gesendet, empfangen, timer, laeuft, fehler}
const MODEM_ABFRAGE = 1000; // ms zwischen zwei Abfragen beim Server

async function modemApi(methode, pfad, daten) {
  let antwort;
  try {
    antwort = await fetch(API + pfad, {
      method: methode,
      headers: { Accept: 'application/json', ...(methode !== 'GET' && { 'Content-Type': 'application/json' }) },
      body: methode === 'GET' ? undefined : JSON.stringify(daten ?? {}),
    });
  } catch {
    throw Object.assign(new Error('Der Server ist nicht erreichbar. Bitte prüfe die Internetverbindung.'), { status: 0 });
  }
  const json = antwort.status === 204 ? null : await antwort.json().catch(() => null);
  if (!antwort.ok) throw Object.assign(new Error(json?.error || `Serverfehler (${antwort.status}).`), { status: antwort.status });
  return json;
}

function modemText(g) {
  const v = modems.get(g.id);
  if (!v) return zustand.modus === 'simulation' ? 'nicht verbunden' : '';
  if (!v.code) return 'wählt …';
  return v.partner ? `verbunden (${v.code})` : `Code ${v.code} – wartet`;
}

/** Was das Modem am Kabel empfängt, geht zur Gegenseite (gesammelt, damit nicht jeder Rahmen eine Anfrage wird). */
function modemAusgang(g, rahmen) {
  const v = modems.get(g.id);
  if (!v?.token) return;
  v.raus.push(rahmen);
  if (v.raus.length > 300) v.raus.splice(0, v.raus.length - 300); // Leitung überlastet: Älteste gehen verloren
  if (!v.sendetBald) { v.sendetBald = true; setTimeout(() => modemSenden(g.id), 150); }
}

async function modemSenden(gid) {
  const v = modems.get(gid);
  if (!v) return;
  v.sendetBald = false;
  if (v.sendet || !v.raus.length) return;
  v.sendet = true;
  const paket = v.raus.splice(0, 50);
  try {
    const r = await modemApi('POST', `/modem/${v.code}/send`, { token: v.token, rahmen: paket });
    v.gesendet += paket.length;
    v.partner = r.partner;
  } catch (err) {
    v.fehler = err.message;
    if (err.status === 404 || err.status === 403) { modemTrennen(gid, 'Die Verbindung besteht nicht mehr – die Gegenseite hat aufgelegt.'); return; }
  } finally {
    v.sendet = false;
  }
  if (v.raus.length && modems.get(gid) === v) modemSenden(gid);
}

async function modemAbfragen(gid) {
  const v = modems.get(gid);
  if (!v?.laeuft) return;
  try {
    const r = await modemApi('GET', `/modem/${v.code}?token=${v.token}`);
    if (modems.get(gid) !== v) return;
    const vorher = v.partner;
    v.partner = r.partner;
    v.fehler = '';
    for (const rahmen of r.rahmen ?? []) zustand.netz.modemEingang(gid, rahmen);
    v.empfangen += r.rahmen?.length ?? 0;
    if (vorher !== v.partner) { zeichneGeraetText(); melde(v.partner ? `${zustand.netz.geraete.get(gid)?.name}: Verbindung zur Gegenseite steht.` : `${zustand.netz.geraete.get(gid)?.name}: Gegenseite nicht mehr erreichbar.`); }
  } catch (err) {
    if (modems.get(gid) !== v) return;
    if (err.status === 404 || err.status === 403) { modemTrennen(gid, 'Die Gegenseite hat aufgelegt.'); return; }
    v.fehler = err.message;
  }
  fensterListe.get(`modem:${gid}`)?.aktualisieren?.(fensterListe.get(`modem:${gid}`));
  if (modems.get(gid) === v && v.laeuft) v.timer = setTimeout(() => modemAbfragen(gid), MODEM_ABFRAGE);
}

async function modemVerbinden(g, code) {
  if (modems.has(g.id)) return;
  const v = { code: '', token: '', seite: '', partner: false, raus: [], gesendet: 0, empfangen: 0, timer: null, laeuft: false, fehler: '' };
  modems.set(g.id, v);
  zeichneGeraetText();
  try {
    const r = code ? await modemApi('POST', `/modem/${code}/join`) : await modemApi('POST', '/modem');
    if (modems.get(g.id) !== v) { modemApi('POST', `/modem/${r.code}/hangup`, { token: r.token }).catch(() => {}); return; }
    Object.assign(v, { code: r.code, token: r.token, seite: r.seite, laeuft: true });
    modemAbfragen(g.id);
  } catch (err) {
    modems.delete(g.id);
    melde(err.message, 'fehler');
  }
  zeichneGeraetText();
  const f = fensterListe.get(`modem:${g.id}`);
  f?.aufbauen?.(f);
}

/** Auflegen: beim Server abmelden (ohne darauf zu warten) und den Zustand vergessen */
function modemTrennen(gid, hinweis = '') {
  const v = modems.get(gid);
  if (!v) return;
  modems.delete(gid);
  clearTimeout(v.timer);
  v.laeuft = false;
  if (v.token) fetch(`${API}/modem/${v.code}/hangup`, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: v.token }) }).catch(() => {});
  if (hinweis) melde(hinweis, 'fehler');
  zeichneGeraetText();
  const f = fensterListe.get(`modem:${gid}`);
  f?.aufbauen?.(f);
}

function modemeTrennen() { for (const gid of [...modems.keys()]) modemTrennen(gid); }
window.addEventListener('pagehide', modemeTrennen);

function modemFenster(g) {
  fenster(`modem:${g.id}`, `Modem – ${g.name}`, {
    breite: 440, hoehe: 330,
    aufbauen(f) {
      const v = modems.get(g.id);
      if (!v) {
        f.inhalt.innerHTML = `<p class="klein">Das Modem verbindet dein Netz mit dem Netz einer anderen Gruppe. Eine Seite bietet die Verbindung an,
die andere wählt sich mit dem Code ein. Danach verhalten sich beide Netze, als wären die Modems mit einem langen Kabel verbunden.</p>
<div class="nw-modem-wahl"><div><h4>Verbindung anbieten</h4><p class="klein">Du bekommst einen Code für die andere Gruppe.</p>
<button type="button" class="knopf primaer nw-anbieten">Code erzeugen</button></div>
<form class="nw-einwaehlen"><h4>Einwählen</h4><label class="klein" for="nw-code-${g.id}">Code der anderen Gruppe</label>
<span class="nw-zeile"><input id="nw-code-${g.id}" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" required placeholder="123456" autocomplete="off"><button class="knopf primaer">Verbinden</button></span></form></div>
<p class="nw-hinweis klein">Die Rahmen laufen über den Server des Online-Schulbuchs und brauchen dabei etwa eine Sekunde. Stell das Tempo daher eher langsam ein.</p>`;
        f.inhalt.querySelector('.nw-anbieten').addEventListener('click', () => modemVerbinden(g, ''));
        f.inhalt.querySelector('.nw-einwaehlen').addEventListener('submit', (e) => {
          e.preventDefault();
          const code = e.target.querySelector('input').value.replace(/\D/g, '');
          if (code.length !== 6) { melde('Der Code hat sechs Ziffern.', 'fehler'); return; }
          modemVerbinden(g, code);
        });
        return;
      }
      f.inhalt.innerHTML = '<div class="nw-modem-status"></div>';
      f.aktualisieren(f);
    },
    aktualisieren(f) {
      const v = modems.get(g.id);
      const el = f.inhalt.querySelector('.nw-modem-status');
      if (!v || !el) return;
      const text = !v.code ? '<p>Verbinde …</p>'
        : `${v.seite === 'a' ? `<p>Code für die andere Gruppe:</p><p class="nw-modem-code">${v.code}</p>` : `<p>Eingewählt mit Code <strong>${v.code}</strong>.</p>`}
<p class="nw-modem-zustand ${v.partner ? 'ok' : ''}">${v.partner ? '● Verbunden – die Gegenseite ist da.' : '○ Warte auf die Gegenseite …'}</p>
<p class="klein">Gesendet: ${v.gesendet} Rahmen · empfangen: ${v.empfangen} Rahmen</p>
${v.fehler ? `<p class="nw-hinweis klein">${esc(v.fehler)}</p>` : ''}
<button type="button" class="knopf nw-auflegen">Auflegen</button>`;
      if (el.dataset.text === text) return;
      el.dataset.text = text;
      el.innerHTML = text;
      el.querySelector('.nw-auflegen')?.addEventListener('click', () => modemTrennen(g.id));
    },
  });
}

// ------------------------------------------------------------------ Modus und Ablauf

function setzeModus(modus) {
  if (modus === zustand.modus) return;
  zustand.modus = modus;
  setzeWerkzeug('auswahl');
  schliesseAlle();
  clearInterval(zustand.timer);
  if (modus === 'simulation') {
    zustand.netz.modemAusgang = modemAusgang;
    zustand.netz.start();
    starteTakt();
    melde('Simulation gestartet. Doppelklick auf einen Rechner öffnet seinen Desktop.');
  } else {
    modemeTrennen();
    zustand.netz.stop();
    zustand.aktivBis.clear();
  }
  app.classList.toggle('simulation', modus === 'simulation');
  app.querySelectorAll('.nw-modus').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modus === modus)));
  panelFuer = null;
  speichere();
  zeichne();
}

let takte = 0;
function starteTakt() {
  clearInterval(zustand.timer);
  zustand.timer = setInterval(() => {
    if (zustand.modus !== 'simulation') return;
    const aktive = zustand.netz.schritt();
    const bis = performance.now() + Math.max(250, TEMPO[zustand.tempo] * 1.5);
    for (const id of aktive) zustand.aktivBis.set(id, bis);
    markiereKabel();
    app.querySelector('.nw-zeit').textContent = `Takt ${zustand.netz.zeit}`;
    if (++takte % 5 === 0) {
      for (const f of fensterListe.values()) f.aktualisieren?.(f);
      // Adressen per DHCP: Beschriftung nachziehen
      const beschriftung = [...zustand.netz.geraete.values()].map((g) => g.nics.map((x) => x.ip).join()).join('|');
      if (beschriftung !== starteTakt.letzte) { starteTakt.letzte = beschriftung; zeichneGeraetText(); }
    }
  }, TEMPO[zustand.tempo]);
}

app.querySelectorAll('.nw-modus').forEach((b) => b.addEventListener('click', () => setzeModus(b.dataset.modus)));
app.querySelector('.nw-tempo input').addEventListener('input', (e) => {
  zustand.tempo = Number(e.target.value);
  if (zustand.modus === 'simulation') starteTakt();
});

// ------------------------------------------------------------------ Datei, Beispiele, Hilfe, Vollbild

function lade(netz, hinweis) {
  setzeModus('entwurf');
  zustand.netz = netz;
  zustand.auswahl = null;
  speichere();
  zeichne();
  if (hinweis) melde(hinweis);
}

let neuScharf = false;
app.querySelector('.nw-neu').addEventListener('click', (e) => {
  if (!neuScharf && zustand.netz.geraete.size) {
    neuScharf = true;
    e.target.textContent = 'Wirklich alles löschen?';
    e.target.classList.add('uf-warnung');
    setTimeout(() => { neuScharf = false; e.target.textContent = 'Neu'; e.target.classList.remove('uf-warnung'); }, 4000);
    return;
  }
  neuScharf = false;
  e.target.textContent = 'Neu';
  e.target.classList.remove('uf-warnung');
  lade(new Netz(), 'Neues, leeres Netzwerk.');
});

app.querySelector('.nw-speichern').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(zustand.netz, null, 2)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `netzwerk-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  melde('Als Datei gespeichert. Mit „Öffnen …“ lässt sie sich wieder laden.');
});

app.querySelector('.nw-oeffnen').addEventListener('change', async (e) => {
  const datei = e.target.files[0];
  e.target.value = '';
  if (!datei) return;
  try {
    lade(Netz.ausJSON(JSON.parse(await datei.text())), `„${datei.name}“ geöffnet.`);
  } catch (err) {
    melde(err instanceof SyntaxError ? 'Die Datei ist keine gültige Netzwerk-Datei.' : err.message, 'fehler');
  }
});

const BEISPIELE = {
  'Zwei Rechner an einem Switch': () => {
    const n = new Netz();
    const s = n.neuesGeraet('switch', { x: 420, y: 240 });
    const a = n.neuesGeraet('rechner', { x: 200, y: 100, name: 'Rechner A' });
    const b = n.neuesGeraet('rechner', { x: 640, y: 100, name: 'Rechner B' });
    const c = n.neuesGeraet('notebook', { x: 420, y: 420, name: 'Notebook C' });
    a.nics[0].ip = '192.168.0.1'; b.nics[0].ip = '192.168.0.2'; c.nics[0].ip = '192.168.0.3';
    [a, b, c].forEach((g) => n.verbinde(g.id, s.id));
    return n;
  },
  'Zwei Netze mit Router': () => {
    const n = new Netz();
    const r = n.neuesGeraet('router', { x: 520, y: 240, name: 'Router' });
    const s1 = n.neuesGeraet('switch', { x: 260, y: 240, name: 'Switch 1' });
    const s2 = n.neuesGeraet('switch', { x: 780, y: 240, name: 'Switch 2' });
    n.verbinde(s1.id, r.id); n.verbinde(s2.id, r.id);
    r.nics[0].ip = '192.168.1.1'; r.nics[1].ip = '192.168.2.1';
    [['A', 100, 100, '192.168.1.10', s1, '192.168.1.1'], ['B', 100, 380, '192.168.1.11', s1, '192.168.1.1'],
      ['C', 960, 100, '192.168.2.10', s2, '192.168.2.1'], ['D', 960, 380, '192.168.2.11', s2, '']].forEach(([name, x, y, ip, s, gw]) => {
      const g = n.neuesGeraet('rechner', { x, y, name: `Rechner ${name}` });
      g.nics[0].ip = ip;
      g.gateway = gw;
      n.verbinde(g.id, s.id);
    });
    return n; // Rechner D fehlt das Gateway – ein guter Anlass zur Fehlersuche
  },
  'Kleines Internet mit DNS, DHCP und Webserver': () => {
    const n = new Netz();
    const s1 = n.neuesGeraet('switch', { x: 300, y: 260, name: 'Switch Schule' });
    const r = n.neuesGeraet('router', { x: 560, y: 260, name: 'Router' });
    const s2 = n.neuesGeraet('switch', { x: 820, y: 260, name: 'Switch Provider' });
    n.verbinde(s1.id, r.id); n.verbinde(s2.id, r.id);
    r.nics[0].ip = '192.168.0.1'; r.nics[1].ip = '10.0.0.1';
    const dhcp = n.neuesGeraet('rechner', { x: 300, y: 450, name: 'Schulserver' });
    Object.assign(dhcp.nics[0], { ip: '192.168.0.2' });
    dhcp.gateway = '192.168.0.1';
    dhcp.dhcpServer = { aktiv: true, von: '192.168.0.100', bis: '192.168.0.150', gateway: '192.168.0.1', dns: '10.0.0.53' };
    for (const [i, x] of [[1, 80], [2, 200]]) {
      const g = n.neuesGeraet('notebook', { x, y: 80, name: `Schüler ${i}` });
      g.dhcp = true;
      g.nics[0].ip = '';
      g.software = ['befehlszeile', 'webbrowser'];
      n.verbinde(g.id, s1.id);
    }
    n.verbinde(dhcp.id, s1.id);
    const dns = n.neuesGeraet('rechner', { x: 1040, y: 100, name: 'DNS-Server' });
    dns.nics[0].ip = '10.0.0.53'; dns.nics[0].maske = '255.255.255.0'; dns.gateway = '10.0.0.1';
    dns.software = ['befehlszeile', 'dnsserver'];
    dns.daten.dnsserver = { laeuft: true, eintraege: [{ name: 'www.schulbuch.test', ip: '10.0.0.80' }] };
    const web = n.neuesGeraet('rechner', { x: 1040, y: 400, name: 'Webserver' });
    web.nics[0].ip = '10.0.0.80'; web.gateway = '10.0.0.1';
    web.software = ['befehlszeile', 'webserver'];
    web.daten.webserver = { laeuft: true };
    Object.entries({ 'index.html': '<html><body>\n<h1>Willkommen!</h1>\n<p>Diese Seite kam über DNS, Router und TCP zu dir.</p>\n<p><a href="impressum.html">Impressum</a></p>\n</body></html>\n', 'impressum.html': '<html><body><h1>Impressum</h1><p><a href="index.html">Zurück</a></p></body></html>\n' })
      .forEach(([name, text]) => schreibeDatei(web, `/webserver/${name}`, text));
    n.verbinde(dns.id, s2.id); n.verbinde(web.id, s2.id);
    return n;
  },
};
BEISPIELE['E-Mail zwischen zwei Domains'] = () => {
  const n = new Netz();
  const r = n.neuesGeraet('router', { x: 560, y: 300, name: 'Router' });
  const s1 = n.neuesGeraet('switch', { x: 300, y: 300, name: 'Switch Schule' });
  const s2 = n.neuesGeraet('switch', { x: 820, y: 300, name: 'Switch Verein' });
  n.verbinde(s1.id, r.id); n.verbinde(s2.id, r.id);
  r.nics[0].ip = '10.1.0.1'; r.nics[1].ip = '10.2.0.1';
  const host = (name, typ, x, y, ip, gw, software, s) => {
    const g = n.neuesGeraet(typ, { x, y, name });
    Object.assign(g.nics[0], { ip, maske: '255.255.255.0' });
    Object.assign(g, { gateway: gw, dns: '10.1.0.53', software: ['befehlszeile', ...software] });
    n.verbinde(g.id, s.id);
    return g;
  };
  const dns = host('DNS-Server', 'rechner', 300, 520, '10.1.0.53', '10.1.0.1', ['dnsserver'], s1);
  dns.daten.dnsserver = { laeuft: true, eintraege: [
    { name: 'mail.schule.test', typ: 'A', ip: '10.1.0.25' }, { name: 'schule.test', typ: 'MX', ip: 'mail.schule.test' },
    { name: 'mail.verein.test', typ: 'A', ip: '10.2.0.25' }, { name: 'verein.test', typ: 'MX', ip: 'mail.verein.test' },
  ] };
  const m1 = host('Mailserver Schule', 'rechner', 100, 520, '10.1.0.25', '10.1.0.1', ['emailserver'], s1);
  m1.daten.emailserver = { laeuft: true, domain: 'schule.test', konten: [{ name: 'anna', passwort: 'anna' }, { name: 'carl', passwort: 'carl' }], postfaecher: {} };
  const m2 = host('Mailserver Verein', 'rechner', 1020, 520, '10.2.0.25', '10.2.0.1', ['emailserver'], s2);
  m2.daten.emailserver = { laeuft: true, domain: 'verein.test', konten: [{ name: 'ben', passwort: 'ben' }], postfaecher: {} };
  const konto = (adresse, server) => ({ adresse, smtp: server, pop3: server, benutzer: adresse.split('@')[0], passwort: adresse.split('@')[0], eingang: [], gesendet: [] });
  host('Anna', 'notebook', 100, 100, '10.1.0.10', '10.1.0.1', ['emailprogramm'], s1).daten.emailprogramm = konto('anna@schule.test', 'mail.schule.test');
  host('Carl', 'notebook', 300, 80, '10.1.0.11', '10.1.0.1', ['emailprogramm'], s1).daten.emailprogramm = konto('carl@schule.test', 'mail.schule.test');
  host('Ben', 'notebook', 1020, 100, '10.2.0.10', '10.2.0.1', ['emailprogramm'], s2).daten.emailprogramm = konto('ben@verein.test', 'mail.verein.test');
  return n;
};
const auswahlBeispiel = app.querySelector('.nw-beispiel');
auswahlBeispiel.insertAdjacentHTML('beforeend', Object.keys(BEISPIELE).map((k) => `<option>${esc(k)}</option>`).join(''));
auswahlBeispiel.addEventListener('change', () => {
  const name = auswahlBeispiel.value;
  auswahlBeispiel.value = '';
  if (name) lade(BEISPIELE[name](), `Beispiel „${name}“ geladen. Oben auf „▶ Simulation“ schalten und ausprobieren.`);
});

app.querySelector('.nw-hilfe-knopf').addEventListener('click', () => fenster('hilfe', 'Hilfe', {
  breite: 600, hoehe: 440,
  aufbauen(f) {
    f.inhalt.classList.add('nw-hilfe');
    f.inhalt.innerHTML = `<h4>Entwurf ✎</h4>
<ul><li>Links ein Gerät anklicken oder auf die Fläche ziehen. Geräte lassen sich verschieben.</li>
<li><strong>Kabel:</strong> Kabel-Werkzeug wählen, dann nacheinander zwei Geräte anklicken. Rechner haben einen Anschluss, Switch und Router bekommen bei Bedarf weitere.</li>
<li>Ein angeklicktes Gerät stellst du unten ein (IP-Adresse, Netzmaske, Gateway, DNS-Server, DHCP). Beim Router: Anschlüsse und Weiterleitungstabelle.</li>
<li>Löschen: Gerät in den <strong>Papierkorb</strong> ziehen – oder Gerät bzw. Kabel anklicken und dann Entf drücken oder auf den Papierkorb klicken. Versehentlich gelöscht? In der Meldung auf <em>Rückgängig</em> klicken (oder Strg+Z).</li></ul>
<h4>Simulation ▶</h4>
<ul><li>Doppelklick auf einen Rechner öffnet den Desktop. Über <em>Software-Installation</em> kommen Programme dazu: Befehlszeile, Webbrowser, Webserver, DNS-Server, E-Mail-Programm, E-Mail-Server, Firewall, Echo-Server, einfacher Client, Text-Editor, Datei-Explorer.</li>
<li><strong>Echo-Server und einfacher Client:</strong> Der Echo-Server (Port 55555) schickt jede Nachricht zurück; mit dem einfachen Client baust du eine TCP-Verbindung auf, schickst Nachrichten und trennst wieder – im Datenaustausch sieht man Verbindungsaufbau, Daten und Abbau.</li>
<li><strong>Datei-Explorer und Text-Editor:</strong> Jeder Rechner hat Ordner und Textdateien. Im Datei-Explorer legst du Ordner und Dateien an, benennst sie um, löschst sie, importierst Textdateien von deinem Computer oder lädst sie herunter. Im Text-Editor schreibst du Dateien und speicherst sie (Strg+S). Der Webserver liefert die Dateien im Ordner <code>/webserver</code> aus. In der Befehlszeile zeigen <code>dir</code> und <code>type</code> Ordner und Dateien an.</li>
<li><strong>Firewall:</strong> auf Rechnern als Software (prüft ankommende Pakete), auf Routern über „Firewall“ (prüft alles, was durchläuft). Verworfene Pakete erscheinen im Datenaustausch.</li>
<li><strong>E-Mail:</strong> Der E-Mail-Server verwaltet eine Domain mit Konten. Das E-Mail-Programm verschickt über SMTP (Postausgangsserver) und holt über POP3 ab (Posteingangsserver). Für fremde Domains braucht der DNS-Server einen MX-Eintrag, der auf deren Mailserver zeigt.</li>
<li>Befehlszeile: <code>ipconfig</code>, <code>ping</code>, <code>traceroute</code>, <code>host</code>, <code>arp</code>, <code>route</code>, <code>netstat</code> – <code>help</code> zeigt alle.</li>
<li>Server müssen nach der Installation <strong>gestartet</strong> werden.</li>
<li><em>Datenaustausch anzeigen</em> (Rechner/Router) listet jede Nachricht mit einer Zeile je Schicht: Netzzugang, Vermittlung, Transport, Anwendung. Beim Switch zeigt die <em>Lerntabelle</em>, welche MAC-Adresse an welchem Anschluss hängt.</li>
<li><strong>Modem:</strong> verbindet zwei Simulationen auf verschiedenen Geräten. Doppelklick auf das Modem: Eine Gruppe erzeugt einen Code, die andere wählt sich damit ein. Danach verhalten sich beide Netze wie mit einem langen Kabel verbunden – z. B. Modem → Router auf beiden Seiten, verschiedene Netze, passende Weiterleitungstabellen. Beim Wechsel in den Entwurf wird aufgelegt.</li>
<li>Grün leuchtende Kabel übertragen gerade Daten; das Tempo stellst du oben ein.</li></ul>
<h4>Speichern</h4><p>Der Entwurf bleibt in diesem Browser erhalten. Mit „Speichern“ lädst du ihn als Datei herunter, mit „Öffnen …“ lädst du sie wieder.</p>`;
  },
}));

app.querySelector('.nw-vollbild').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else app.requestFullscreen?.().catch(() => {});
});

// ------------------------------------------------------------------ Start

try {
  const gespeichert = localStorage.getItem(SPEICHER);
  if (gespeichert) zustand.netz = Netz.ausJSON(JSON.parse(gespeichert));
} catch { /* dann eben leer */ }
if (!zustand.netz.geraete.size) zustand.netz = BEISPIELE['Zwei Rechner an einem Switch']();
app.querySelectorAll('.nw-modus').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modus === zustand.modus)));
zeichne();
