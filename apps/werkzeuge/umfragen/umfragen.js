// Werkzeug „Umfragen“ (/werkzeuge/umfragen/): Live-Umfragen mit Schiebereglern und Antwortvorgaben.
//
// Lehrkräfte (Konto der Schulbuch-API) legen Umfragen an, führen sie durch (Code + QR-Code für die Klasse,
// Auswertung live für den Beamer), exportieren und importieren sie. Schülerinnen und Schüler nehmen ohne
// Konto mit dem Code teil (…/werkzeuge/umfragen/?code=123456).
//
// Übernahme aus dem Schulbuch: Eine Seite legt unter localStorage „umfragen:uebernahme“ eine Umfrage ab
// ({title, mode, questions, source}) und öffnet …/werkzeuge/umfragen/?uebernehmen=1 (siehe arbeitsblatt.js).
//
// Live-Aktualisierung per regelmäßiger Abfrage (Lehrkraft alle 2 s, Teilnehmende alle 3 bzw. 10 s).

import { skala, auswahl, zahl, prozent } from './statistik.js';
import { qrSvg } from '../qr-code/qr-encode.js';

const wurzel = document.getElementById('umfragen');
const API = '/api';
const BASIS = window.SCHULBUCH_BASIS ?? '/';
const TOOL_URL = `${location.origin}${BASIS}werkzeuge/umfragen/`;
// Kurze Adresse zum Abtippen (die Umleitung /umfrage gibt es nur auf der echten Seite)
const KURZ_URL = BASIS === '/' ? `${location.host}/umfrage` : TOOL_URL.replace(/^https?:\/\//, '');
const UEBERNAHME = 'umfragen:uebernahme';

const MODI = {
  single: ['Frage für Frage', 'Es ist immer nur eine Frage zu sehen. Du schaltest weiter (oder ein Countdown); die Auswertung der aktuellen Frage ist ausführlich.'],
  all: ['Alle Fragen auf einmal', 'Alle sehen und beantworten sofort alle Fragen. Die Auswertung zeigt alle Fragen kompakt nebeneinander.'],
};
const COUNTDOWNS = [0, 10, 15, 20, 30, 45, 60, 90, 120, 180, 300];
const VORGABEN = [
  ['nein', 'eher nein', 'eher ja', 'ja'],
  ['ja', 'nein'],
  ['trifft nicht zu', 'trifft eher nicht zu', 'trifft eher zu', 'trifft zu'],
  ['sehr schlecht', 'schlecht', 'mittel', 'gut', 'sehr gut'],
  ['A', 'B', 'C', 'D'],
];

// ------------------------------------------------------------------ Hilfen

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const datum = (iso) => new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const zeit = (iso) => new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const sekunden = (s) => (s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} min` : `${s} s`);
const lies = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const schreib = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* ohne Speicher */ } };

async function api(methode, pfad, daten) {
  // Schreibende Anfragen müssen als JSON kommen (CSRF-Schutz der API), auch ohne Inhalt
  if (daten === undefined && methode !== 'GET') daten = {};
  let antwort;
  try {
    antwort = await fetch(API + pfad, {
      method: methode,
      credentials: 'same-origin',
      headers: { Accept: 'application/json', ...(daten !== undefined && { 'Content-Type': 'application/json' }) },
      body: daten === undefined ? undefined : JSON.stringify(daten),
    });
  } catch {
    throw Object.assign(new Error('Der Server ist nicht erreichbar. Bitte prüfe die Internetverbindung.'), { status: 0 });
  }
  const json = antwort.status === 204 ? null : await antwort.json().catch(() => null);
  if (!antwort.ok) throw Object.assign(new Error(json?.error || `Serverfehler (${antwort.status}).`), { status: antwort.status });
  return json;
}

function html(text) {
  const t = document.createElement('template');
  t.innerHTML = text.trim();
  return t.content.firstElementChild;
}

// Knopf, der beim ersten Klick nachfragt („Wirklich löschen?“) und erst beim zweiten auslöst
function zweiSchritte(knopf, frage, aktion) {
  const text = knopf.textContent;
  let scharf = false;
  let timer;
  knopf.addEventListener('click', () => {
    if (!scharf) {
      scharf = true;
      knopf.textContent = frage;
      knopf.classList.add('uf-warnung');
      timer = setTimeout(() => { scharf = false; knopf.textContent = text; knopf.classList.remove('uf-warnung'); }, 4000);
      return;
    }
    clearTimeout(timer);
    aktion();
  });
}

function meldung(ziel, text, art = 'fehler') {
  ziel.innerHTML = text ? `<p class="uf-meldung ${art}" role="${art === 'fehler' ? 'alert' : 'status'}">${esc(text)}</p>` : '';
}

let lehrkraft = null; // angemeldete Lehrkraft oder null

// ------------------------------------------------------------------ Start

async function start() {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  if (code && /^\d{6}$/.test(code)) {
    teilnehmen(code);
    return;
  }
  try {
    const { user } = await api('GET', '/auth/me');
    lehrkraft = user?.role === 'teacher' ? user : null;
  } catch {
    lehrkraft = null;
  }
  if (params.has('uebernehmen') && lies(UEBERNAHME)) {
    if (lehrkraft) uebernehmen();
    else startseite('Melde dich an, um die Umfrage aus dem Schulbuch zu übernehmen.');
    return;
  }
  startseite();
}

function startseite(hinweis = '') {
  wurzel.replaceChildren();
  const teil = html(`<section class="uf-karte uf-beitreten" aria-labelledby="uf-beitreten-titel">
<h2 id="uf-beitreten-titel">An einer Umfrage teilnehmen</h2>
<p>Gib den sechsstelligen Code ein, den deine Lehrkraft zeigt – oder scanne den QR-Code.</p>
<form class="uf-code-form">
<label class="sr" for="uf-code">Code</label>
<input id="uf-code" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="123456" pattern="[0-9]{6}" required>
<button type="submit" class="knopf primaer">Teilnehmen</button>
</form>
<div class="uf-code-meldung"></div>
</section>`);
  teil.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const wert = teil.querySelector('input').value.replace(/\D/g, '');
    if (wert.length !== 6) { meldung(teil.querySelector('.uf-code-meldung'), 'Der Code hat sechs Ziffern.'); return; }
    teilnehmen(wert, teil.querySelector('.uf-code-meldung'));
  });
  wurzel.append(teil);

  const bereich = html('<section class="uf-lehrkraft-bereich" aria-label="Für Lehrkräfte"></section>');
  wurzel.append(bereich);
  if (lehrkraft) return liste(bereich);
  anmeldung(bereich, hinweis);
  return Promise.resolve();
}

function anmeldung(bereich, hinweis) {
  bereich.replaceChildren(html(`<div class="uf-karte">
<h2>Umfragen erstellen und durchführen</h2>
<p>Für Lehrkräfte: Melde dich mit deinem Lehrkräfte-Konto des Online-Schulbuchs an (dasselbe wie im KryptoGAME).
Noch kein Konto? <a href="/informatik/kryptogame/registrieren" target="_blank" rel="noopener">Zugang beantragen</a>.</p>
${hinweis ? `<p class="uf-meldung info">${esc(hinweis)}</p>` : ''}
<form class="uf-anmelden">
<label>Benutzername <input name="name" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>
<label>Passwort <input name="passwort" type="password" autocomplete="current-password" required></label>
<button type="submit" class="knopf primaer">Anmelden</button>
</form>
<div class="uf-anmelden-meldung"></div>
</div>`));
  const form = bereich.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ziel = bereich.querySelector('.uf-anmelden-meldung');
    meldung(ziel, 'Einen Moment …', 'info');
    try {
      const { user } = await api('POST', '/auth/login', { username: form.name.value.trim(), password: form.passwort.value });
      if (user.role !== 'teacher') {
        await api('POST', '/auth/logout', {}).catch(() => {});
        throw new Error('Das ist kein Konto für Lehrkräfte.');
      }
      lehrkraft = user;
      if (new URLSearchParams(location.search).has('uebernehmen') && lies(UEBERNAHME)) uebernehmen();
      else liste(bereich);
    } catch (err) {
      meldung(ziel, err.status === 401 ? 'Benutzername oder Passwort stimmen nicht.' : err.message);
    }
  });
}

async function abmelden() {
  await api('POST', '/auth/logout', {}).catch(() => {});
  // Die Anmeldung gilt für die ganze Website – also auch die Inhalte für Lehrkräfte wieder sperren
  try { localStorage.removeItem('schulbuch-lehrkraft'); sessionStorage.removeItem('schulbuch-lehrkraft'); } catch { /* egal */ }
  lehrkraft = null;
  startseite();
}

// Fehler 401 heißt: Sitzung abgelaufen → zurück zur Anmeldung
function fehlerBehandeln(err, ziel) {
  if (err.status === 401 || err.status === 403) {
    lehrkraft = null;
    startseite('Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.');
    return;
  }
  meldung(ziel, err.message);
}

// ------------------------------------------------------------------ Liste der eigenen Umfragen

async function liste(bereich = wurzel.querySelector('.uf-lehrkraft-bereich')) {
  if (!bereich) { startseite(); return; }
  bereich.replaceChildren(html(`<div class="uf-karte">
<div class="uf-kopfzeile"><h2>Meine Umfragen</h2><p class="klein">Angemeldet als <strong>${esc(lehrkraft.username)}</strong> · <button type="button" class="uf-link uf-abmelden">Abmelden</button></p></div>
<div class="uf-leiste">
<button type="button" class="knopf primaer uf-neu">+ Neue Umfrage</button>
<label class="knopf uf-import">Importieren … <input type="file" accept=".json,application/json" class="sr"></label>
</div>
<div class="uf-liste-meldung"></div>
<div class="uf-liste"><p class="klein">Lädt …</p></div>
<p class="klein uf-fussnote">Umfragen, die 500 Tage lang weder bearbeitet noch durchgeführt wurden, werden automatisch gelöscht.
Mit „Exportieren“ speicherst du eine Umfrage samt Ergebnissen als Datei und kannst sie später wieder importieren.</p>
</div>`));
  const ziel = bereich.querySelector('.uf-liste-meldung');
  bereich.querySelector('.uf-abmelden').addEventListener('click', abmelden);
  bereich.querySelector('.uf-neu').addEventListener('click', () => editor(null));
  bereich.querySelector('.uf-import input').addEventListener('change', async (e) => {
    const datei = e.target.files[0];
    e.target.value = '';
    if (!datei) return;
    try {
      const daten = JSON.parse(await datei.text());
      const { poll } = await api('POST', '/polls/import', daten);
      await liste(bereich);
      meldung(bereich.querySelector('.uf-liste-meldung'), `„${poll.title}“ wurde importiert.`, 'info');
    } catch (err) {
      if (err instanceof SyntaxError) meldung(ziel, 'Die Datei ist keine gültige Umfrage-Datei.');
      else fehlerBehandeln(err, ziel);
    }
  });

  let polls;
  try {
    ({ polls } = await api('GET', '/polls'));
  } catch (err) {
    fehlerBehandeln(err, ziel);
    return;
  }
  const liste_ = bereich.querySelector('.uf-liste');
  if (!polls.length) {
    liste_.innerHTML = '<p>Du hast noch keine Umfragen. Lege eine neue an oder übernimm eine aus dem Schulbuch (in den Hinweisen für Lehrkräfte, z. B. bei Meinungslinien).</p>';
    return;
  }
  liste_.replaceChildren(...polls.map((p) => umfrageKarte(p, bereich)));
}

function umfrageKarte(p, bereich) {
  const laufend = p.runs.find((r) => r.code);
  const fertig = p.runs.filter((r) => !r.code);
  const karte = html(`<article class="uf-umfrage" data-id="${p.id}">
<h3>${esc(p.title)}</h3>
<p class="klein uf-meta">${p.questions.length} ${p.questions.length === 1 ? 'Frage' : 'Fragen'} · ${MODI[p.mode][0]}${p.mode === 'single' && p.countdown ? ` · Countdown ${sekunden(p.countdown)}` : ''}
· zuletzt aktiv ${datum(p.activeAt)} · ohne Aktivität gelöscht am ${datum(p.deletesAt)}</p>
${laufend ? `<p class="uf-laeuft">Läuft gerade – Code <strong>${laufend.code}</strong> · ${laufend.participants} Teilnehmende <button type="button" class="knopf primaer uf-oeffnen">Live-Ansicht öffnen</button></p>` : ''}
<div class="uf-leiste">
<button type="button" class="knopf primaer uf-starten">Durchführen</button>
<button type="button" class="knopf uf-bearbeiten">Bearbeiten</button>
<button type="button" class="knopf uf-export">Exportieren</button>
<button type="button" class="knopf uf-loeschen">Löschen</button>
</div>
${fertig.length ? `<details class="uf-durchfuehrungen"><summary>Ergebnisse früherer Durchführungen (${fertig.length})</summary><ul>${fertig.map((r) => `<li data-run="${r.id}">${zeit(r.startedAt)} · ${MODI[r.mode][0]} · ${r.participants} Teilnehmende
<button type="button" class="uf-link uf-ergebnis">ansehen</button> <button type="button" class="uf-link uf-run-loeschen">löschen</button></li>`).join('')}</ul></details>` : ''}
</article>`);
  const ziel = bereich.querySelector('.uf-liste-meldung');
  karte.querySelector('.uf-starten').addEventListener('click', () => startDialog(p, karte));
  karte.querySelector('.uf-bearbeiten').addEventListener('click', () => editor(p));
  karte.querySelector('.uf-oeffnen')?.addEventListener('click', async () => {
    try { buehne((await api('GET', `/poll-runs/${laufend.id}`)).run, false); } catch (err) { fehlerBehandeln(err, ziel); }
  });
  karte.querySelector('.uf-export').addEventListener('click', async () => {
    try {
      const daten = await api('GET', `/polls/${p.id}/export`);
      const name = `umfrage-${p.title.toLowerCase().replace(/[^a-z0-9äöüß]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'export'}-${new Date().toISOString().slice(0, 10)}.json`;
      const url = URL.createObjectURL(new Blob([JSON.stringify(daten, null, 2)], { type: 'application/json' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: name });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { fehlerBehandeln(err, ziel); }
  });
  zweiSchritte(karte.querySelector('.uf-loeschen'), 'Wirklich löschen?', async () => {
    try { await api('DELETE', `/polls/${p.id}`); liste(bereich); } catch (err) { fehlerBehandeln(err, ziel); }
  });
  karte.querySelectorAll('li[data-run]').forEach((li) => {
    const id = li.dataset.run;
    li.querySelector('.uf-ergebnis').addEventListener('click', async () => {
      try { buehne((await api('GET', `/poll-runs/${id}`)).run, true); } catch (err) { fehlerBehandeln(err, ziel); }
    });
    zweiSchritte(li.querySelector('.uf-run-loeschen'), 'wirklich löschen?', async () => {
      try { await api('DELETE', `/poll-runs/${id}`); liste(bereich); } catch (err) { fehlerBehandeln(err, ziel); }
    });
  });
  return karte;
}

// Vor dem Start: Modus und Countdown bestätigen (vorbelegt aus der Umfrage)
function startDialog(p, karte) {
  karte.querySelector('.uf-start-dialog')?.remove();
  const d = html(`<form class="uf-start-dialog">
<fieldset><legend>Wie möchtest du die Umfrage durchführen?</legend>
${Object.entries(MODI).map(([k, [titel, text]]) => `<label class="uf-modus"><input type="radio" name="modus" value="${k}"${p.mode === k ? ' checked' : ''}> <span><strong>${titel}</strong><br><span class="klein">${text}</span></span></label>`).join('')}
</fieldset>
<label class="uf-countdown">Countdown je Frage <select name="countdown">${COUNTDOWNS.map((s) => `<option value="${s}"${s === p.countdown ? ' selected' : ''}>${s ? sekunden(s) : 'aus – ich schalte selbst weiter'}</option>`).join('')}</select></label>
<div class="uf-leiste"><button type="submit" class="knopf primaer">Jetzt starten</button><button type="button" class="knopf uf-abbrechen">Abbrechen</button></div>
<div class="uf-start-meldung"></div>
</form>`);
  const zeigeCountdown = () => { d.querySelector('.uf-countdown').hidden = d.modus.value !== 'single'; };
  d.addEventListener('change', zeigeCountdown);
  zeigeCountdown();
  d.querySelector('.uf-abbrechen').addEventListener('click', () => d.remove());
  d.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const { run } = await api('POST', `/polls/${p.id}/runs`, { mode: d.modus.value, countdown: d.modus.value === 'single' ? Number(d.countdown.value) : 0 });
      buehne(run, false);
    } catch (err) { fehlerBehandeln(err, d.querySelector('.uf-start-meldung')); }
  });
  karte.append(d);
  d.querySelector('input:checked')?.focus();
}

// ------------------------------------------------------------------ Übernahme aus dem Schulbuch

async function uebernehmen() {
  let vorlage;
  try { vorlage = JSON.parse(lies(UEBERNAHME)); } catch { vorlage = null; }
  schreib(UEBERNAHME, null);
  history.replaceState(null, '', location.pathname);
  if (!vorlage?.questions?.length) { startseite(); return; }
  await startseite();
  const bereich = wurzel.querySelector('.uf-lehrkraft-bereich');
  let polls = [];
  try { ({ polls } = await api('GET', '/polls')); } catch { /* dann eben ohne Abgleich */ }
  const vorhanden = vorlage.source ? polls.filter((p) => p.source === vorlage.source) : [];
  if (!vorhanden.length) { editor(null, vorlage); return; }
  const p = vorhanden[0];
  const hinweis = html(`<div class="uf-karte uf-hinweis">
<h2>Umfrage aus dem Schulbuch</h2>
<p>Diese Umfrage hast du schon angelegt: <strong>${esc(p.title)}</strong> (zuletzt aktiv ${datum(p.activeAt)}, ${p.runs.length} Durchführungen).</p>
<div class="uf-leiste"><button type="button" class="knopf primaer uf-vorhanden">Vorhandene verwenden</button><button type="button" class="knopf uf-nochmal">Neu anlegen</button></div>
</div>`);
  hinweis.querySelector('.uf-vorhanden').addEventListener('click', () => {
    hinweis.remove();
    const karte = bereich.querySelector(`.uf-umfrage[data-id="${p.id}"]`);
    if (karte) { startDialog(p, karte); karte.scrollIntoView({ block: 'center' }); }
  });
  hinweis.querySelector('.uf-nochmal').addEventListener('click', () => editor(null, vorlage));
  bereich.prepend(hinweis);
}

// ------------------------------------------------------------------ Editor

const neueFrage = (typ) => (typ === 'scale'
  ? { id: '', text: '', type: 'scale', min: 0, max: 10, step: 1, left: 'stimme gar nicht zu', right: 'stimme voll zu' }
  : { id: '', text: '', type: 'choice', options: [...VORGABEN[0]], correct: null });

function editor(poll, vorlage = null) {
  const quelle = poll ?? vorlage;
  const daten = {
    title: quelle?.title ?? '',
    mode: quelle?.mode ?? 'single',
    countdown: quelle?.countdown ?? 0,
    questions: structuredClone(quelle?.questions ?? [neueFrage('scale')]),
    source: quelle?.source ?? null,
  };
  wurzel.replaceChildren();
  const form = html(`<form class="uf-karte uf-editor" novalidate>
<h2>${poll ? 'Umfrage bearbeiten' : 'Neue Umfrage'}</h2>
${vorlage ? '<p class="uf-meldung info">Aus dem Schulbuch übernommen. Prüfe die Fragen, wähle den Modus und speichere die Umfrage.</p>' : ''}
<label class="uf-feld">Titel <input name="titel" maxlength="200" required value="${esc(daten.title)}"></label>
<fieldset><legend>Modus (lässt sich beim Start noch ändern)</legend>
${Object.entries(MODI).map(([k, [titel, text]]) => `<label class="uf-modus"><input type="radio" name="modus" value="${k}"${daten.mode === k ? ' checked' : ''}> <span><strong>${titel}</strong><br><span class="klein">${text}</span></span></label>`).join('')}
<label class="uf-countdown">Countdown je Frage <select name="countdown">${COUNTDOWNS.map((s) => `<option value="${s}"${s === daten.countdown ? ' selected' : ''}>${s ? sekunden(s) : 'aus – ich schalte selbst weiter'}</option>`).join('')}</select></label>
</fieldset>
<h3>Fragen</h3>
<ol class="uf-fragen"></ol>
<div class="uf-leiste">
<button type="button" class="knopf uf-plus" data-typ="scale">+ Frage mit Schieberegler</button>
<button type="button" class="knopf uf-plus" data-typ="choice">+ Frage mit Antwortvorgaben</button>
</div>
<div class="uf-editor-meldung"></div>
<div class="uf-leiste uf-editor-fuss">
<button type="submit" class="knopf primaer" data-danach="liste">Speichern</button>
<button type="submit" class="knopf" data-danach="starten">Speichern und durchführen</button>
<button type="button" class="knopf uf-abbrechen">Abbrechen</button>
</div>
</form>`);
  const liste_ = form.querySelector('.uf-fragen');
  const zeigeCountdown = () => { form.querySelector('.uf-countdown').hidden = form.modus.value !== 'single'; };
  form.addEventListener('change', (e) => { if (e.target.name === 'modus') zeigeCountdown(); });
  zeigeCountdown();

  const zeichne = () => {
    liste_.replaceChildren(...daten.questions.map((f, i) => frageEditor(f, i, daten, zeichne)));
  };
  zeichne();
  form.querySelectorAll('.uf-plus').forEach((k) => k.addEventListener('click', () => {
    daten.questions.push(neueFrage(k.dataset.typ));
    zeichne();
    liste_.lastElementChild?.querySelector('textarea')?.focus();
  }));
  form.querySelector('.uf-abbrechen').addEventListener('click', () => startseite());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const danach = e.submitter?.dataset.danach ?? 'liste';
    const ziel = form.querySelector('.uf-editor-meldung');
    const body = {
      title: form.titel.value.trim(),
      mode: form.modus.value,
      countdown: form.modus.value === 'single' ? Number(form.countdown.value) : 0,
      questions: daten.questions,
      ...(daten.source && !poll && { source: daten.source }),
    };
    if (!body.title) { meldung(ziel, 'Bitte gib der Umfrage einen Titel.'); form.titel.focus(); return; }
    try {
      const { poll: gespeichert } = poll
        ? await api('PATCH', `/polls/${poll.id}`, body)
        : await api('POST', '/polls', body);
      await startseite();
      const karte = wurzel.querySelector(`.uf-umfrage[data-id="${gespeichert.id}"]`);
      if (karte) {
        karte.scrollIntoView({ block: 'center' });
        if (danach === 'starten') startDialog(gespeichert, karte);
      }
    } catch (err) { fehlerBehandeln(err, ziel); }
  });
  wurzel.append(form);
  form.titel.focus();
}

function frageEditor(f, i, daten, zeichne) {
  const anzahl = daten.questions.length;
  const li = html(`<li class="uf-frage">
<div class="uf-frage-kopf"><strong>Frage ${i + 1}</strong>
<select class="uf-typ" aria-label="Art der Frage"><option value="scale"${f.type === 'scale' ? ' selected' : ''}>Schieberegler (Skala)</option><option value="choice"${f.type === 'choice' ? ' selected' : ''}>Antwortvorgaben</option></select>
<span class="uf-frage-knoepfe">
<button type="button" class="uf-link" data-tat="hoch"${i === 0 ? ' disabled' : ''} aria-label="nach oben">↑</button>
<button type="button" class="uf-link" data-tat="runter"${i === anzahl - 1 ? ' disabled' : ''} aria-label="nach unten">↓</button>
<button type="button" class="uf-link" data-tat="kopie">duplizieren</button>
<button type="button" class="uf-link" data-tat="weg"${anzahl === 1 ? ' disabled' : ''}>entfernen</button>
</span></div>
<label class="uf-feld"><span class="sr">Fragetext</span><textarea rows="2" maxlength="500" placeholder="Frage oder Aussage">${esc(f.text)}</textarea></label>
<div class="uf-frage-details"></div>
</li>`);
  li.querySelector('textarea').addEventListener('input', (e) => { f.text = e.target.value; });
  li.querySelector('.uf-typ').addEventListener('change', (e) => {
    Object.assign(f, neueFrage(e.target.value), { id: f.id, text: f.text });
    if (e.target.value === 'scale') delete f.options, delete f.correct;
    else delete f.min, delete f.max, delete f.step, delete f.left, delete f.right;
    zeichne();
  });
  li.querySelectorAll('[data-tat]').forEach((k) => k.addEventListener('click', () => {
    const q = daten.questions;
    if (k.dataset.tat === 'hoch') [q[i - 1], q[i]] = [q[i], q[i - 1]];
    if (k.dataset.tat === 'runter') [q[i + 1], q[i]] = [q[i], q[i + 1]];
    if (k.dataset.tat === 'kopie') q.splice(i + 1, 0, { ...structuredClone(f), id: '' });
    if (k.dataset.tat === 'weg') q.splice(i, 1);
    zeichne();
  }));

  const details = li.querySelector('.uf-frage-details');
  if (f.type === 'scale') {
    details.innerHTML = `<div class="uf-skala-felder">
<label>von <input type="number" data-feld="min" value="${f.min}" step="1"></label>
<label>bis <input type="number" data-feld="max" value="${f.max}" step="1"></label>
<label>Schrittweite <input type="number" data-feld="step" value="${f.step}" min="0.01" step="any"></label>
</div>
<div class="uf-skala-felder">
<label>Beschriftung links <input data-feld="left" value="${esc(f.left)}" maxlength="100"></label>
<label>Beschriftung rechts <input data-feld="right" value="${esc(f.right)}" maxlength="100"></label>
</div>`;
    details.querySelectorAll('[data-feld]').forEach((inp) => inp.addEventListener('input', () => {
      f[inp.dataset.feld] = inp.type === 'number' ? Number(inp.value) : inp.value;
    }));
  } else {
    const zeichneOptionen = () => {
      details.innerHTML = `<ol class="uf-optionen">${f.options.map((o, j) => `<li><input value="${esc(o)}" maxlength="200" aria-label="Antwortvorgabe ${j + 1}" data-j="${j}">
<label class="klein"><input type="radio" name="richtig-${i}" value="${j}"${f.correct === j ? ' checked' : ''}> richtig</label>
<button type="button" class="uf-link" data-weg="${j}"${f.options.length <= 2 ? ' disabled' : ''} aria-label="Vorgabe ${j + 1} entfernen">✕</button></li>`).join('')}</ol>
<div class="uf-leiste klein">
<button type="button" class="uf-link uf-option-plus"${f.options.length >= 12 ? ' disabled' : ''}>+ Vorgabe</button>
<label>Vorlage: <select class="uf-vorlage"><option value="">auswählen …</option>${VORGABEN.map((v, j) => `<option value="${j}">${esc(v.join(' · '))}</option>`).join('')}</select></label>
<label><input type="radio" name="richtig-${i}" value=""${f.correct == null ? ' checked' : ''}> keine richtige Antwort</label>
</div>`;
      details.querySelectorAll('input[data-j]').forEach((inp) => inp.addEventListener('input', () => { f.options[inp.dataset.j] = inp.value; }));
      details.querySelectorAll(`input[name="richtig-${i}"]`).forEach((r) => r.addEventListener('change', () => { f.correct = r.value === '' ? null : Number(r.value); }));
      details.querySelectorAll('[data-weg]').forEach((k) => k.addEventListener('click', () => {
        const j = Number(k.dataset.weg);
        f.options.splice(j, 1);
        if (f.correct === j) f.correct = null;
        else if (f.correct > j) f.correct--;
        zeichneOptionen();
      }));
      details.querySelector('.uf-option-plus').addEventListener('click', () => { f.options.push(''); zeichneOptionen(); details.querySelector(`input[data-j="${f.options.length - 1}"]`).focus(); });
      details.querySelector('.uf-vorlage').addEventListener('change', (e) => {
        if (e.target.value === '') return;
        f.options = [...VORGABEN[e.target.value]];
        f.correct = null;
        zeichneOptionen();
      });
    };
    zeichneOptionen();
  }
  return li;
}

// ------------------------------------------------------------------ Live-Ansicht / Ergebnisse (Beamer)

let buehnenTimer = null;

function buehne(run, nurLesen) {
  clearTimeout(buehnenTimer);
  document.querySelector('.uf-buehne')?.remove();
  const zustand = {
    run,
    ansicht: run.mode === 'single' ? run.current : null, // im Modus „alle“: null = Übersicht, sonst Detail einer Frage
    codeGross: !nurLesen && !run.endedAt,
    ergebnisse: true,
    loesung: false,
    countdownEnde: null,
  };
  const el = html(`<div class="uf-buehne" role="dialog" aria-modal="true" aria-label="Umfrage: ${esc(run.title)}">
<header class="uf-buehne-kopf">
<h2>${esc(run.title)}</h2>
<div class="uf-buehne-status"></div>
<div class="uf-buehne-knoepfe">
<button type="button" class="knopf uf-code-umschalten"></button>
<button type="button" class="knopf uf-ergebnisse-umschalten"></button>
<button type="button" class="knopf uf-vollbild">Vollbild</button>
<button type="button" class="knopf uf-beenden">Beenden</button>
<button type="button" class="knopf uf-schliessen">Schließen</button>
</div>
</header>
<div class="uf-buehne-inhalt">
<aside class="uf-zugang"></aside>
<main class="uf-auswertung"></main>
</div>
<div class="uf-buehne-meldung"></div>
</div>`);
  document.body.append(el);
  document.documentElement.classList.add('uf-buehne-offen');

  const schliessen = () => {
    clearTimeout(buehnenTimer);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    el.remove();
    document.documentElement.classList.remove('uf-buehne-offen');
    liste();
  };
  el.querySelector('.uf-schliessen').addEventListener('click', schliessen);
  el.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !document.fullscreenElement) schliessen(); });
  el.querySelector('.uf-vollbild').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  });
  el.querySelector('.uf-code-umschalten').addEventListener('click', () => { zustand.codeGross = !zustand.codeGross; zeichne(); });
  el.querySelector('.uf-ergebnisse-umschalten').addEventListener('click', () => { zustand.ergebnisse = !zustand.ergebnisse; zeichne(); });
  zweiSchritte(el.querySelector('.uf-beenden'), 'Wirklich beenden?', () => steuern({ end: true }));

  async function steuern(aenderung) {
    try {
      zustand.run = (await api('PATCH', `/poll-runs/${zustand.run.id}`, aenderung)).run;
      if (zustand.run.mode === 'single') zustand.ansicht = zustand.run.current;
      zustand.loesung = false;
      zeichne();
      if (zustand.run.endedAt) { zustand.codeGross = false; zeichne(); }
    } catch (err) {
      meldung(el.querySelector('.uf-buehne-meldung'), err.message);
    }
  }

  function zeichne() {
    const r = zustand.run;
    const beendet = Boolean(r.endedAt);
    const live = !nurLesen && !beendet;
    el.classList.toggle('code-gross', zustand.codeGross && live);
    el.querySelector('.uf-beenden').hidden = !live;
    el.querySelector('.uf-code-umschalten').hidden = !live;
    el.querySelector('.uf-code-umschalten').textContent = zustand.codeGross ? 'Code verkleinern' : 'Code groß zeigen';
    el.querySelector('.uf-ergebnisse-umschalten').textContent = zustand.ergebnisse ? 'Ergebnisse verbergen' : 'Ergebnisse zeigen';
    el.querySelector('.uf-buehne-status').innerHTML = beendet
      ? `<span class="uf-abzeichen">${nurLesen ? `Durchführung vom ${zeit(r.startedAt)}` : 'Beendet'}</span> ${r.participants} Teilnehmende`
      : `<span class="uf-abzeichen live">Live</span> <strong class="uf-teilnehmende">${r.participants}</strong> Teilnehmende`;

    const zugang = el.querySelector('.uf-zugang');
    zugang.hidden = !live;
    if (live) {
      const ziel = `${TOOL_URL}?code=${r.code}`;
      if (zugang.dataset.code !== r.code) {
        zugang.dataset.code = r.code;
        zugang.innerHTML = `<div class="uf-qr">${qrSvg(ziel, { titel: `QR-Code zur Umfrage (${ziel})` })}</div>
<p class="uf-zugang-text">${esc(KURZ_URL)}</p>
<p class="uf-code" aria-label="Code ${r.code.split('').join(' ')}">${r.code.slice(0, 3)} ${r.code.slice(3)}</p>`;
      }
    }

    const ausw = el.querySelector('.uf-auswertung');
    if (r.mode === 'single' || zustand.ansicht !== null) {
      const i = zustand.ansicht ?? 0;
      const f = r.questions[i];
      const werte = r.answers[f.id] ?? [];
      const steuerbar = live && r.mode === 'single';
      ausw.innerHTML = `<div class="uf-frage-leiste">
<span class="uf-frage-nr">Frage ${i + 1} von ${r.questions.length}</span>
${steuerbar && r.remaining !== null ? '<span class="uf-countdown-anzeige" aria-live="off"></span>' : ''}
</div>
<h3 class="uf-frage-text">${esc(f.text)}</h3>
<div class="uf-detail">${zustand.ergebnisse ? detail(f, werte, zustand.loesung) : '<p class="uf-verborgen">Ergebnisse verborgen</p>'}</div>
<div class="uf-leiste uf-navigation">
${r.mode === 'all' ? '<button type="button" class="knopf uf-uebersicht">← Alle Fragen</button>' : ''}
<button type="button" class="knopf uf-zurueck"${i === 0 ? ' disabled' : ''}>◀ Vorherige Frage</button>
<button type="button" class="knopf primaer uf-weiter"${i === r.questions.length - 1 ? ' disabled' : ''}>Nächste Frage ▶</button>
${f.type === 'choice' && f.correct != null ? `<button type="button" class="knopf uf-loesung">${zustand.loesung ? 'Lösung verbergen' : 'Lösung zeigen'}</button>` : ''}
${steuerbar ? `<label class="klein">Countdown <select class="uf-countdown-wahl">${COUNTDOWNS.map((s) => `<option value="${s}"${s === r.countdown ? ' selected' : ''}>${s ? sekunden(s) : 'aus'}</option>`).join('')}</select></label>` : ''}
</div>`;
      const gehe = (n) => {
        if (steuerbar) steuern({ current: n });
        else { zustand.ansicht = n; zustand.loesung = false; zeichne(); }
      };
      ausw.querySelector('.uf-zurueck').addEventListener('click', () => gehe(i - 1));
      ausw.querySelector('.uf-weiter').addEventListener('click', () => gehe(i + 1));
      ausw.querySelector('.uf-uebersicht')?.addEventListener('click', () => { zustand.ansicht = null; zeichne(); });
      ausw.querySelector('.uf-loesung')?.addEventListener('click', () => { zustand.loesung = !zustand.loesung; zeichne(); });
      ausw.querySelector('.uf-countdown-wahl')?.addEventListener('change', (e) => steuern({ countdown: Number(e.target.value) }));
      if (steuerbar && r.remaining !== null) {
        zustand.countdownEnde = Date.now() + r.remaining * 1000;
        tick();
      }
    } else {
      ausw.innerHTML = `<div class="uf-raster">${r.questions.map((f, i) => `<button type="button" class="uf-kachel" data-i="${i}">
<span class="uf-kachel-nr">${i + 1}</span><span class="uf-kachel-text">${esc(f.text)}</span>
${zustand.ergebnisse ? kompakt(f, r.answers[f.id] ?? []) : ''}</button>`).join('')}</div>
<p class="klein uf-tipp">Klicke auf eine Frage für die ausführliche Auswertung.</p>`;
      ausw.querySelectorAll('.uf-kachel').forEach((k) => k.addEventListener('click', () => { zustand.ansicht = Number(k.dataset.i); zeichne(); }));
    }
  }

  function tick() {
    const anzeige = el.querySelector('.uf-countdown-anzeige');
    if (!anzeige || zustand.countdownEnde === null) return;
    const rest = Math.max(0, Math.ceil((zustand.countdownEnde - Date.now()) / 1000));
    anzeige.textContent = `⏱ ${sekunden(rest)}`;
    anzeige.classList.toggle('knapp', rest <= 5);
  }
  const tickTimer = setInterval(() => { if (!el.isConnected) clearInterval(tickTimer); else tick(); }, 250);

  // Regelmäßig neu laden, solange die Durchführung läuft
  async function aktualisieren() {
    if (!el.isConnected || nurLesen || zustand.run.endedAt) return;
    try {
      const { run: neu } = await api('GET', `/poll-runs/${zustand.run.id}`);
      const frageGewechselt = neu.current !== zustand.run.current;
      zustand.run = neu;
      if (neu.mode === 'single' && frageGewechselt) { zustand.ansicht = neu.current; zustand.loesung = false; }
      zeichne();
      meldung(el.querySelector('.uf-buehne-meldung'), '');
      buehnenTimer = setTimeout(aktualisieren, 2000);
    } catch (err) {
      if (err.status === 401 || err.status === 403) { meldung(el.querySelector('.uf-buehne-meldung'), 'Deine Anmeldung ist abgelaufen. Schließe die Ansicht und melde dich erneut an.'); return; }
      meldung(el.querySelector('.uf-buehne-meldung'), 'Verbindung unterbrochen – neuer Versuch …');
      buehnenTimer = setTimeout(aktualisieren, 5000);
    }
  }
  zeichne();
  buehnenTimer = setTimeout(aktualisieren, 2000);
  el.querySelector('.uf-schliessen').focus();
}

// ---------------------------------------------------------------- Diagramme

function detail(f, werte, loesung) {
  if (!werte.length) return '<p class="uf-leer">Noch keine Antworten.</p>';
  if (f.type === 'scale') {
    const s = skala(werte, f);
    const kennzahlen = [
      ['Antworten', s.n],
      ['Mittelwert', zahl(s.mittel)],
      ['Median', zahl(s.median)],
      ['Standardabweichung', zahl(s.sd)],
      ['Spannweite', `${zahl(s.min)} bis ${zahl(s.max)}`],
      ['mittlere 50 %', `${zahl(s.q1)} bis ${zahl(s.q3)}`],
      ['häufigster Wert', s.modi.length > 3 ? 'mehrere' : s.modi.map((m) => zahl(m)).join(', ')],
    ];
    return `${histogramm(f, s, true)}<dl class="uf-kennzahlen">${kennzahlen.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
  }
  const a = auswahl(werte, f);
  const max = Math.max(...a.anzahl, 1);
  const balken = f.options.map((o, i) => `<div class="uf-balken-zeile${loesung && a.richtig === i ? ' richtig' : ''}">
<span class="uf-balken-label">${loesung && a.richtig === i ? '✓ ' : ''}${esc(o)}</span>
<span class="uf-balken"><span style="width:${(a.anzahl[i] / max) * 100}%"></span></span>
<span class="uf-balken-wert">${a.anzahl[i]} <span class="klein">(${prozent(a.anteil[i])})</span></span></div>`).join('');
  const kennzahlen = [
    ['Antworten', a.n],
    ['häufigste Antwort', a.haeufigste.map((i) => esc(f.options[i])).join(', ')],
    ...(loesung && a.anteilRichtig !== null ? [['richtig beantwortet', prozent(a.anteilRichtig)]] : []),
    ...(f.options.length >= 3 && f.correct == null ? [['mittlere Position', `${zahl(a.mittlerePosition)} von ${f.options.length}`], ['Median-Position', `${zahl(a.medianPosition)} von ${f.options.length}`]] : []),
  ];
  return `<div class="uf-balken-liste">${balken}</div><dl class="uf-kennzahlen">${kennzahlen.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
}

function kompakt(f, werte) {
  if (!werte.length) return '<span class="uf-kachel-werte klein">noch keine Antworten</span>';
  if (f.type === 'scale') {
    const s = skala(werte, f);
    return `${histogramm(f, s, false)}<span class="uf-mini-skala"><span>${esc(f.left || zahl(f.min))}</span><span>${esc(f.right || zahl(f.max))}</span></span><span class="uf-kachel-werte"><strong>Ø ${zahl(s.mittel)}</strong> · Median ${zahl(s.median)} · n = ${s.n}</span>`;
  }
  const a = auswahl(werte, f);
  return `<span class="uf-mini-balken">${f.options.map((o, i) => `<span class="uf-mini-zeile"><span class="uf-mini-label">${esc(o)}</span><span class="uf-balken"><span style="width:${a.anteil[i] * 100}%"></span></span><span class="uf-mini-wert">${prozent(a.anteil[i])}</span></span>`).join('')}</span>
<span class="uf-kachel-werte klein">n = ${a.n}</span>`;
}

// Säulendiagramm einer Skalenfrage; ausführlich mit Achse, Mittelwert, Median und Boxplot
function histogramm(f, s, gross) {
  const B = 600;
  const H = gross ? 240 : 70;
  const unten = gross ? 34 : 4;
  const k = s.klassen.length;
  const spalte = B / k;
  const maxA = Math.max(1, ...s.klassen.map((c) => c.anzahl));
  const xWert = (w) => ((w - f.min) / (f.max - f.min || 1)) * (B - spalte) + spalte / 2;
  const saeulen = s.klassen.map((c, i) => {
    const h = (c.anzahl / maxA) * (H - unten - (gross ? 22 : 4));
    return `<rect class="uf-saeule" x="${i * spalte + spalte * 0.12}" y="${H - unten - h}" width="${spalte * 0.76}" height="${h}"><title>${zahl(c.wert)}: ${c.anzahl}</title></rect>${gross && c.anzahl ? `<text class="uf-saeule-zahl" x="${i * spalte + spalte / 2}" y="${H - unten - h - 5}" text-anchor="middle">${c.anzahl}</text>` : ''}`;
  }).join('');
  const jedes = Math.ceil(k / 11);
  const achse = gross ? s.klassen.map((c, i) => (i % jedes === 0 || i === k - 1 ? `<text class="uf-achse" x="${i * spalte + spalte / 2}" y="${H - unten + 18}" text-anchor="middle">${zahl(c.wert)}</text>` : '')).join('') : '';
  const marker = (w, cls) => `<line class="${cls}" x1="${xWert(w)}" x2="${xWert(w)}" y1="${gross ? 4 : 0}" y2="${H - unten}"/>`;
  const svg = `<svg class="uf-histogramm${gross ? ' gross' : ''}" viewBox="0 0 ${B} ${H}" preserveAspectRatio="none" role="img" aria-label="Verteilung der Antworten">
${saeulen}${achse}${marker(s.mittel, 'uf-mittel')}${marker(s.median, 'uf-median')}</svg>`;
  if (!gross) return svg;
  const box = `<svg class="uf-boxplot" viewBox="0 0 ${B} 34" preserveAspectRatio="none" role="img" aria-label="Boxplot: Minimum ${zahl(s.min)}, unteres Quartil ${zahl(s.q1)}, Median ${zahl(s.median)}, oberes Quartil ${zahl(s.q3)}, Maximum ${zahl(s.max)}">
<line class="uf-box-linie" x1="${xWert(s.min)}" x2="${xWert(s.max)}" y1="17" y2="17"/>
<line class="uf-box-linie" x1="${xWert(s.min)}" x2="${xWert(s.min)}" y1="9" y2="25"/><line class="uf-box-linie" x1="${xWert(s.max)}" x2="${xWert(s.max)}" y1="9" y2="25"/>
<rect class="uf-box" x="${xWert(s.q1)}" y="5" width="${Math.max(1, xWert(s.q3) - xWert(s.q1))}" height="24"/>
<line class="uf-median" x1="${xWert(s.median)}" x2="${xWert(s.median)}" y1="5" y2="29"/></svg>`;
  return `<div class="uf-pole"><span>${esc(f.left)}</span><span>${esc(f.right)}</span></div>${svg}${box}
<p class="uf-legende klein"><span class="uf-leg-mittel"></span> Mittelwert <span class="uf-leg-median"></span> Median · Kasten: mittlere 50 % der Antworten</p>`;
}

// ------------------------------------------------------------------ Teilnahme (Schülerinnen und Schüler)

function kennung(code) {
  const schluessel = `umfrage-teilnahme:${code}`;
  let k = lies(schluessel);
  if (!k || !/^[a-z0-9]{16}$/.test(k)) {
    const zufall = crypto.getRandomValues(new Uint8Array(16));
    k = [...zufall].map((b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
    schreib(schluessel, k);
  }
  return k;
}

let teilnahmeTimer = null;

async function teilnehmen(code, fehlerZiel = null) {
  clearTimeout(teilnahmeTimer);
  const ich = kennung(code);
  let stand;
  try {
    stand = await api('GET', `/join/${code}?participant=${ich}`);
  } catch (err) {
    if (fehlerZiel) { meldung(fehlerZiel, err.status === 404 ? 'Zu diesem Code läuft gerade keine Umfrage.' : err.message); return; }
    startseite();
    meldung(wurzel.querySelector('.uf-code-meldung'), err.status === 404 ? 'Zu diesem Code läuft gerade keine Umfrage.' : err.message);
    return;
  }
  history.replaceState(null, '', `${location.pathname}?code=${code}`);
  wurzel.replaceChildren();
  const el = html(`<section class="uf-karte uf-teilnahme" aria-live="polite">
<p class="klein uf-teilnahme-kopf">Umfrage · Code ${code}</p>
<h2>${esc(stand.title)}</h2>
<div class="uf-teilnahme-inhalt"></div>
<div class="uf-teilnahme-meldung"></div>
</section>`);
  wurzel.append(el);
  const inhalt = el.querySelector('.uf-teilnahme-inhalt');
  const meldeZiel = el.querySelector('.uf-teilnahme-meldung');
  let angezeigt = null; // Kennung der angezeigten Frage(n), damit Eingaben beim Aktualisieren erhalten bleiben
  let countdownEnde = null;

  function zeichne() {
    const schluessel = stand.mode === 'single' ? `${stand.current}` : 'alle';
    if (schluessel === angezeigt) { aktualisiereStatus(); return; }
    angezeigt = schluessel;
    if (stand.mode === 'single') {
      const f = stand.questions[0];
      inhalt.replaceChildren(html(`<div class="uf-einzeln">
<p class="uf-frage-nr">Frage ${stand.current + 1} von ${stand.total}<span class="uf-countdown-anzeige"></span></p>
</div>`));
      const block = antwortBlock(f, stand.answers[f.id], senden);
      inhalt.firstElementChild.append(block);
      inhalt.firstElementChild.append(html('<p class="klein uf-warten">Die nächste Frage erscheint automatisch, sobald deine Lehrkraft weiterschaltet.</p>'));
    } else {
      const form = html('<form class="uf-alle"></form>');
      stand.questions.forEach((f, i) => {
        const block = antwortBlock(f, stand.answers[f.id], null, i + 1);
        form.append(block);
      });
      form.append(html('<div class="uf-leiste"><button type="submit" class="knopf primaer">Antworten senden</button></div>'));
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const antworten = {};
        form.querySelectorAll('.uf-antwort').forEach((b) => { if (b.wert() !== null) antworten[b.dataset.frage] = b.wert(); });
        if (!Object.keys(antworten).length) { meldung(meldeZiel, 'Du hast noch keine Frage beantwortet.'); return; }
        senden(antworten);
      });
      inhalt.replaceChildren(form);
    }
    aktualisiereStatus();
  }

  function aktualisiereStatus() {
    inhalt.querySelectorAll('.uf-antwort').forEach((b) => b.zeigeGesendet(stand.answers[b.dataset.frage]));
    countdownEnde = stand.remaining !== null && stand.remaining !== undefined ? Date.now() + stand.remaining * 1000 : null;
    tick();
  }

  function tick() {
    const anzeige = inhalt.querySelector('.uf-countdown-anzeige');
    if (!anzeige) return;
    if (countdownEnde === null) { anzeige.textContent = ''; return; }
    const rest = Math.max(0, Math.ceil((countdownEnde - Date.now()) / 1000));
    anzeige.textContent = ` · noch ${sekunden(rest)}`;
  }
  const tickTimer = setInterval(() => { if (!el.isConnected) clearInterval(tickTimer); else tick(); }, 500);

  async function senden(antworten) {
    meldung(meldeZiel, '');
    try {
      const { answers } = await api('POST', `/join/${code}/answers`, { participant: ich, answers: antworten });
      stand.answers = answers;
      aktualisiereStatus();
      meldung(meldeZiel, stand.mode === 'single' ? 'Gesendet. Du kannst deine Antwort noch ändern, bis die nächste Frage kommt.' : 'Gesendet. Du kannst deine Antworten noch ändern, solange die Umfrage läuft.', 'info');
    } catch (err) {
      if (err.status === 404) { ende(); return; }
      if (err.status === 409) { meldung(meldeZiel, err.message); abfragen(); return; }
      meldung(meldeZiel, err.message);
    }
  }

  function ende() {
    clearTimeout(teilnahmeTimer);
    inhalt.innerHTML = '<p class="uf-ende">Die Umfrage ist beendet. Danke fürs Mitmachen!</p>';
    meldung(meldeZiel, '');
    history.replaceState(null, '', location.pathname);
  }

  async function abfragen() {
    clearTimeout(teilnahmeTimer);
    if (!el.isConnected) return;
    try {
      stand = await api('GET', `/join/${code}?participant=${ich}`);
      zeichne();
      teilnahmeTimer = setTimeout(abfragen, stand.mode === 'single' ? 3000 : 10000);
    } catch (err) {
      if (err.status === 404) { ende(); return; }
      teilnahmeTimer = setTimeout(abfragen, 6000);
    }
  }

  zeichne();
  teilnahmeTimer = setTimeout(abfragen, stand.mode === 'single' ? 3000 : 10000);
}

// Eingabe für eine Frage. `sofort` = eigener Senden-Knopf (Modus „Frage für Frage“).
function antwortBlock(f, bisher, sofort, nummer = null) {
  const block = html(`<fieldset class="uf-antwort" data-frage="${esc(f.id)}">
<legend>${nummer ? `<span class="uf-nr">${nummer}</span> ` : ''}${esc(f.text)}</legend>
<div class="uf-eingabe"></div>
<p class="uf-gesendet klein"></p>
</fieldset>`);
  const eingabe = block.querySelector('.uf-eingabe');
  let wert = bisher ?? null;
  if (f.type === 'scale') {
    const mitte = f.min + Math.round((f.max - f.min) / f.step / 2) * f.step;
    eingabe.innerHTML = `<div class="uf-regler${wert === null ? ' unberuehrt' : ''}">
<input type="range" min="${f.min}" max="${f.max}" step="${f.step}" value="${wert ?? mitte}" aria-label="${esc(f.text)}">
<div class="uf-pole"><span>${esc(f.left || zahl(f.min))}</span><output>${wert === null ? 'Schiebe den Regler' : zahl(wert, 2)}</output><span>${esc(f.right || zahl(f.max))}</span></div>
</div>`;
    const regler = eingabe.querySelector('input');
    const ausgabe = eingabe.querySelector('output');
    const setzen = () => { wert = Number(regler.value); ausgabe.textContent = zahl(wert, 2); eingabe.firstElementChild.classList.remove('unberuehrt'); };
    regler.addEventListener('input', setzen);
    regler.addEventListener('pointerdown', setzen);
  } else {
    eingabe.innerHTML = `<div class="uf-optionen-wahl">${f.options.map((o, i) => `<label><input type="radio" name="f-${esc(f.id)}" value="${i}"${wert === i ? ' checked' : ''}> <span>${esc(o)}</span></label>`).join('')}</div>`;
    eingabe.querySelectorAll('input').forEach((r) => r.addEventListener('change', () => { wert = Number(r.value); if (sofort) sofort({ [f.id]: wert }); }));
  }
  if (sofort && f.type === 'scale') {
    const knopf = html('<button type="button" class="knopf primaer">Antwort senden</button>');
    knopf.addEventListener('click', () => {
      if (wert === null) { block.querySelector('.uf-gesendet').textContent = 'Schiebe den Regler zuerst auf deine Antwort.'; return; }
      sofort({ [f.id]: wert });
    });
    block.append(knopf);
  }
  block.wert = () => wert;
  block.zeigeGesendet = (gesendet) => {
    const p = block.querySelector('.uf-gesendet');
    if (gesendet === undefined || gesendet === null) { block.classList.remove('gesendet'); return; }
    block.classList.add('gesendet');
    p.textContent = `✓ Gesendet: ${f.type === 'scale' ? zahl(gesendet, 2) : f.options[gesendet]}`;
  };
  return block;
}

start();
