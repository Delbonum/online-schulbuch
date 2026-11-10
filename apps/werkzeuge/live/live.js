// Gemeinsame Bausteine der Live-Werkzeuge (Umfragen, Wortwolke, Quiz, Evaluation).
//
// Jedes Werkzeug hat eine eigene Seite unter /werkzeuge/<name>/ und ruft werkzeug({...}) auf. Hier liegen:
// Zugriff auf die Schulbuch-API, Anmeldung der Lehrkraft, Liste der eigenen Einträge (Durchführen, Bearbeiten,
// Exportieren, Importieren, Löschen, frühere Durchführungen), Teilnahme per Code und der Rahmen der
// Beamer-Ansicht mit Code und QR-Code. Schülerinnen und Schüler brauchen kein Konto.

import { qrSvg } from '../qr-code/qr-encode.js';

export const API = '/api';
export const BASIS = window.SCHULBUCH_BASIS ?? '/';

export const WERKZEUGE = {
  poll: { name: 'Umfrage', mehrzahl: 'Umfragen', artikel: 'eine Umfrage', pfad: 'werkzeuge/umfragen/', kurz: 'umfrage' },
  wordcloud: { name: 'Wortwolke', mehrzahl: 'Wortwolken', artikel: 'eine Wortwolke', pfad: 'werkzeuge/wortwolke/', kurz: 'wortwolke' },
  quiz: { name: 'Quiz', mehrzahl: 'Quiz', artikel: 'ein Quiz', pfad: 'werkzeuge/quiz/', kurz: 'quiz' },
  evaluation: { name: 'Evaluation', mehrzahl: 'Evaluationen', artikel: 'eine Evaluation', pfad: 'werkzeuge/evaluation/', kurz: 'evaluation' },
  // eigene Tabellen und Endpunkte (/api/termine, /api/termin/{code}); hier nur für Code-Eingabe, QR-Code und Kurzadresse
  booking: { name: 'Terminbuchung', mehrzahl: 'Terminbuchungen', artikel: 'eine Terminbuchung', pfad: 'werkzeuge/termine/', kurz: 'termine' },
};
export const toolUrl = (kind) => `${location.origin}${BASIS}${WERKZEUGE[kind].pfad}`;
// Kurze Adresse zum Abtippen (die Umleitungen /umfrage usw. gibt es nur auf der echten Seite)
export const kurzUrl = (kind) => (BASIS === '/' ? `${location.host}/${WERKZEUGE[kind].kurz}` : toolUrl(kind).replace(/^https?:\/\//, ''));

// ------------------------------------------------------------------ Hilfen

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const datum = (iso) => new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
export const zeit = (iso) => new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const sekunden = (s) => (s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} min` : `${s} s`);
export const lies = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
export const schreib = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* ohne Speicher */ } };

export async function api(methode, pfad, daten) {
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

export function html(text) {
  const t = document.createElement('template');
  t.innerHTML = text.trim();
  return t.content.firstElementChild;
}

// Knopf, der beim ersten Klick nachfragt („Wirklich löschen?“) und erst beim zweiten auslöst
export function zweiSchritte(knopf, frage, aktion) {
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

export function meldung(ziel, text, art = 'fehler') {
  if (!ziel) return;
  ziel.innerHTML = text ? `<p class="uf-meldung ${art}" role="${art === 'fehler' ? 'alert' : 'status'}">${esc(text)}</p>` : '';
}

/** Zufällige Teilnahme-Kennung je Code, im Browser gemerkt (kein Konto, kein Name). */
export function kennung(code) {
  const schluessel = `umfrage-teilnahme:${code}`;
  let k = lies(schluessel);
  if (!k || !/^[a-z0-9]{16}$/.test(k)) {
    const zufall = crypto.getRandomValues(new Uint8Array(16));
    k = [...zufall].map((b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
    schreib(schluessel, k);
  }
  return k;
}

/** Datei im Browser speichern lassen */
export function herunterladen(name, inhalt, typ = 'application/json') {
  const url = URL.createObjectURL(new Blob([inhalt], { type: typ }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const dateiname = (titel) => titel.toLowerCase().replace(/[^a-z0-9äöüß]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'export';

// ------------------------------------------------------------------ Rahmen einer Werkzeugseite

/**
 * Startet ein Werkzeug auf seiner Seite.
 * @param {object} w
 * @param {string} w.kind
 * @param {HTMLElement} w.wurzel
 * @param {(eintrag: object|null, vorlage?: object) => void} w.editor
 * @param {(eintrag: object, karte: HTMLElement) => void} w.durchfuehren  Start (direkt oder mit Rückfrage)
 * @param {(run: object, nurLesen: boolean) => void} w.buehne           Live-Ansicht bzw. Ergebnisse
 * @param {(code: string, stand: object) => void} w.teilnehmen          Ansicht für Teilnehmende
 * @param {() => boolean|Promise<boolean>} [w.sonderstart]               z. B. Übernahme aus dem Schulbuch
 * @param {(bereich: HTMLElement) => void} [w.leereListe]               Inhalt bei leerer Liste
 * @param {string} [w.hinweisListe]                                      Zusatzzeile unter der Liste
 */
export function werkzeug(w) {
  const info = WERKZEUGE[w.kind];
  const r = { lehrkraft: null };

  async function start() {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (code && /^\d{6}$/.test(code)) {
      beitreten(code, null);
      return;
    }
    try {
      const { user } = await api('GET', '/auth/me');
      r.lehrkraft = user?.role === 'teacher' ? user : null;
    } catch {
      r.lehrkraft = null;
    }
    if (w.sonderstart && await w.sonderstart()) return;
    startseite();
  }

  async function beitreten(code, fehlerZiel) {
    let stand;
    try {
      stand = await api('GET', `/join/${code}?participant=${kennung(code)}`);
    } catch (err) {
      // Vielleicht ein Code der Terminbuchung (eigene Endpunkte) → dorthin
      if (err.status === 404 && await api('GET', `/termin/${code}`).then(() => true, () => false)) {
        location.replace(`${toolUrl('booking')}?code=${code}`);
        return;
      }
      const text = err.status === 404 ? 'Zu diesem Code läuft gerade nichts.' : err.message;
      if (fehlerZiel) { meldung(fehlerZiel, text); return; }
      await startseite();
      meldung(w.wurzel.querySelector('.uf-code-meldung'), text);
      return;
    }
    // Code gehört zu einem anderen Werkzeug → dorthin
    if (stand.kind !== w.kind) {
      location.replace(`${toolUrl(stand.kind)}?code=${code}`);
      return;
    }
    history.replaceState(null, '', `${location.pathname}?code=${code}`);
    w.teilnehmen(code, stand);
  }

  function startseite(hinweis = '') {
    w.wurzel.replaceChildren();
    const teil = html(`<section class="uf-karte uf-beitreten" aria-labelledby="uf-beitreten-titel">
<h2 id="uf-beitreten-titel">Mitmachen</h2>
<p>Gib den sechsstelligen Code ein, den deine Lehrkraft zeigt – oder scanne den QR-Code. Du brauchst kein Konto.</p>
<form class="uf-code-form">
<label class="sr" for="uf-code">Code</label>
<input id="uf-code" inputmode="numeric" autocomplete="off" maxlength="7" placeholder="123456" required>
<button type="submit" class="knopf primaer">Mitmachen</button>
</form>
<div class="uf-code-meldung"></div>
</section>`);
    teil.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const wert = teil.querySelector('input').value.replace(/\D/g, '');
      if (wert.length !== 6) { meldung(teil.querySelector('.uf-code-meldung'), 'Der Code hat sechs Ziffern.'); return; }
      beitreten(wert, teil.querySelector('.uf-code-meldung'));
    });
    w.wurzel.append(teil);
    const bereich = html('<section class="uf-lehrkraft-bereich" aria-label="Für Lehrkräfte"></section>');
    w.wurzel.append(bereich);
    if (r.lehrkraft) return liste(bereich);
    anmeldung(bereich, hinweis);
    return Promise.resolve();
  }

  function anmeldung(bereich, hinweis, weiter = null) {
    bereich.replaceChildren(html(`<div class="uf-karte">
<h2>${esc(info.mehrzahl)} erstellen und durchführen</h2>
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
        r.lehrkraft = user;
        if (weiter) weiter();
        else if (w.sonderstart && await w.sonderstart()) { /* erledigt */ } else liste(bereich);
      } catch (err) {
        meldung(ziel, err.status === 401 ? 'Benutzername oder Passwort stimmen nicht.' : err.message);
      }
    });
  }

  async function abmelden() {
    await api('POST', '/auth/logout', {}).catch(() => {});
    // Die Anmeldung gilt für die ganze Website – also auch die Inhalte für Lehrkräfte wieder sperren
    try { localStorage.removeItem('schulbuch-lehrkraft'); sessionStorage.removeItem('schulbuch-lehrkraft'); } catch { /* egal */ }
    r.lehrkraft = null;
    startseite();
  }

  // Fehler 401 heißt: Sitzung abgelaufen → zurück zur Anmeldung
  function fehler(err, ziel) {
    if (err.status === 401 || err.status === 403) {
      r.lehrkraft = null;
      document.querySelector('.uf-buehne')?.remove();
      document.documentElement.classList.remove('uf-buehne-offen');
      startseite('Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.');
      return;
    }
    meldung(ziel, err.message);
  }

  async function liste(bereich = w.wurzel.querySelector('.uf-lehrkraft-bereich')) {
    if (!bereich) { startseite(); return; }
    bereich.replaceChildren(html(`<div class="uf-karte">
<div class="uf-kopfzeile"><h2>Meine ${esc(info.mehrzahl)}</h2><p class="klein">Angemeldet als <strong>${esc(r.lehrkraft.username)}</strong> · <button type="button" class="uf-link uf-abmelden">Abmelden</button></p></div>
<div class="uf-leiste">
<button type="button" class="knopf primaer uf-neu">+ ${w.kind === 'quiz' ? 'Neues' : 'Neue'} ${esc(info.name)}</button>
<label class="knopf uf-import">Importieren … <input type="file" accept=".json,application/json" class="sr"></label>
</div>
<div class="uf-liste-meldung"></div>
<div class="uf-liste"><p class="klein">Lädt …</p></div>
<p class="klein uf-fussnote">${w.hinweisListe ? `${esc(w.hinweisListe)} ` : ''}Einträge, die 500 Tage lang weder bearbeitet noch durchgeführt wurden, werden automatisch gelöscht.
Mit „Exportieren“ speicherst du einen Eintrag samt allen Ergebnissen als Datei und kannst ihn später vollständig wieder importieren.</p>
</div>`));
    const ziel = bereich.querySelector('.uf-liste-meldung');
    bereich.querySelector('.uf-abmelden').addEventListener('click', abmelden);
    bereich.querySelector('.uf-neu').addEventListener('click', () => w.editor(null));
    bereich.querySelector('.uf-import input').addEventListener('change', async (e) => {
      const datei = e.target.files[0];
      e.target.value = '';
      if (!datei) return;
      try {
        const daten = JSON.parse(await datei.text());
        const art = daten.poll?.kind ?? daten.kind ?? 'poll';
        if (art !== w.kind) throw new Error(`Diese Datei gehört zum Werkzeug „${WERKZEUGE[art]?.mehrzahl ?? art}“. Bitte dort importieren.`);
        const { poll } = await api('POST', '/polls/import', daten);
        await liste(bereich);
        meldung(bereich.querySelector('.uf-liste-meldung'), `„${poll.title}“ wurde importiert.`, 'info');
      } catch (err) {
        if (err instanceof SyntaxError) meldung(ziel, 'Die Datei ist keine gültige Export-Datei.');
        else fehler(err, ziel);
      }
    });

    let polls;
    try {
      ({ polls } = await api('GET', `/polls?kind=${w.kind}`));
    } catch (err) {
      fehler(err, ziel);
      return;
    }
    r.eintraege = polls;
    const listeEl = bereich.querySelector('.uf-liste');
    if (!polls.length) {
      listeEl.innerHTML = `<p>Du hast noch keine ${esc(info.mehrzahl)}.</p>`;
      w.leereListe?.(listeEl);
      return;
    }
    listeEl.replaceChildren(...polls.map((p) => karte(p, bereich)));
  }

  function karte(p, bereich) {
    const laufend = p.runs.find((x) => x.code);
    const fertig = p.runs.filter((x) => !x.code);
    const k = html(`<article class="uf-umfrage" data-id="${p.id}">
<h3>${esc(p.title)}</h3>
<p class="klein uf-meta">${w.beschreibung ? esc(w.beschreibung(p)) : `${p.questions.length} Fragen`}
· zuletzt aktiv ${datum(p.activeAt)} · ohne Aktivität gelöscht am ${datum(p.deletesAt)}</p>
${laufend ? `<p class="uf-laeuft">Läuft gerade – Code <strong>${laufend.code}</strong> · ${laufend.participants} Teilnehmende <button type="button" class="knopf primaer uf-oeffnen">Live-Ansicht öffnen</button></p>` : ''}
<div class="uf-leiste">
<button type="button" class="knopf primaer uf-starten">Durchführen</button>
<button type="button" class="knopf uf-bearbeiten">Bearbeiten</button>
<button type="button" class="knopf uf-export">Exportieren</button>
<button type="button" class="knopf uf-loeschen">Löschen</button>
</div>
${fertig.length ? `<details class="uf-durchfuehrungen"><summary>Ergebnisse früherer Durchführungen (${fertig.length})</summary><ul>${fertig.map((x) => `<li data-run="${x.id}">${zeit(x.startedAt)} · ${x.participants} Teilnehmende
<button type="button" class="uf-link uf-ergebnis">ansehen</button> <button type="button" class="uf-link uf-run-loeschen">löschen</button></li>`).join('')}</ul></details>` : ''}
</article>`);
    const ziel = bereich.querySelector('.uf-liste-meldung');
    k.querySelector('.uf-starten').addEventListener('click', () => w.durchfuehren(p, k));
    k.querySelector('.uf-bearbeiten').addEventListener('click', () => w.editor(p));
    k.querySelector('.uf-oeffnen')?.addEventListener('click', async () => {
      try { w.buehne((await api('GET', `/poll-runs/${laufend.id}`)).run, false); } catch (err) { fehler(err, ziel); }
    });
    k.querySelector('.uf-export').addEventListener('click', async () => {
      try {
        const daten = await api('GET', `/polls/${p.id}/export`);
        herunterladen(`${WERKZEUGE[w.kind].kurz}-${dateiname(p.title)}-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(daten, null, 2));
      } catch (err) { fehler(err, ziel); }
    });
    zweiSchritte(k.querySelector('.uf-loeschen'), 'Wirklich löschen?', async () => {
      try { await api('DELETE', `/polls/${p.id}`); liste(bereich); } catch (err) { fehler(err, ziel); }
    });
    k.querySelectorAll('li[data-run]').forEach((li) => {
      const id = li.dataset.run;
      li.querySelector('.uf-ergebnis').addEventListener('click', async () => {
        try { w.buehne((await api('GET', `/poll-runs/${id}`)).run, true); } catch (err) { fehler(err, ziel); }
      });
      zweiSchritte(li.querySelector('.uf-run-loeschen'), 'wirklich löschen?', async () => {
        try { await api('DELETE', `/poll-runs/${id}`); liste(bereich); } catch (err) { fehler(err, ziel); }
      });
    });
    return k;
  }

  /** Startet eine Durchführung sofort und öffnet die Live-Ansicht */
  async function sofortStarten(p, ziel, optionen = {}) {
    try {
      const { run } = await api('POST', `/polls/${p.id}/runs`, optionen);
      w.buehne(run, false);
    } catch (err) { fehler(err, ziel); }
  }

  /** Nach dem Speichern im Editor: zurück zur Liste, Eintrag zeigen, auf Wunsch gleich durchführen */
  async function nachSpeichern(gespeichert, starten) {
    await startseite();
    const k = w.wurzel.querySelector(`.uf-umfrage[data-id="${gespeichert.id}"]`);
    if (!k) return;
    k.scrollIntoView({ block: 'center' });
    if (starten) w.durchfuehren(gespeichert, k);
  }

  Object.assign(r, { start, startseite, liste, anmeldung, fehler, sofortStarten, nachSpeichern, beitreten });
  return r;
}

// ------------------------------------------------------------------ Beamer-Ansicht

/** Feld mit QR-Code, Kurzadresse und Code (für den Beamer) */
export function zugang(el, kind, code) {
  if (el.dataset.code === code) return;
  el.dataset.code = code;
  const ziel = `${toolUrl(kind)}?code=${code}`;
  el.innerHTML = `<div class="uf-qr">${qrSvg(ziel, { titel: `QR-Code zum Mitmachen (${ziel})` })}</div>
<p class="uf-zugang-text">${esc(kurzUrl(kind))}</p>
<p class="uf-code" aria-label="Code ${code.split('').join(' ')}">${code.slice(0, 3)} ${code.slice(3)}</p>`;
}

/**
 * Rahmen der Live-Ansicht: Kopfzeile (Titel, Status, Knöpfe), Zugang (QR/Code) und Inhalt; fragt den Stand
 * regelmäßig ab, solange die Durchführung läuft.
 * @param {object} run
 * @param {object} o
 * @param {boolean} o.nurLesen
 * @param {number} [o.intervall=2000]
 * @param {(inhalt: HTMLElement, run: object, steuern: Function, ansicht: object) => void} o.zeichne
 * @param {(run: object) => string} [o.status]   Text neben dem Live-Abzeichen
 * @param {() => void} o.schliessen
 * @param {boolean} [o.codeGross]
 * @param {(run: object) => boolean} [o.zugangZeigen]  QR/Code nur in bestimmten Phasen (Quiz: Lobby)
 */
export function buehnenRahmen(run, o) {
  document.querySelector('.uf-buehne')?.remove();
  const ansicht = { run, codeGross: o.codeGross ?? true, timer: null };
  const el = html(`<div class="uf-buehne uf-buehne-${run.kind}" role="dialog" aria-modal="true" aria-label="${esc(run.title)}">
<header class="uf-buehne-kopf">
<h2>${esc(run.title)}</h2>
<div class="uf-buehne-status"></div>
<div class="uf-buehne-knoepfe">
<button type="button" class="knopf uf-code-umschalten"></button>
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
    clearTimeout(ansicht.timer);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    el.remove();
    document.documentElement.classList.remove('uf-buehne-offen');
    o.schliessen();
  };
  el.querySelector('.uf-schliessen').addEventListener('click', schliessen);
  el.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !document.fullscreenElement) schliessen(); });
  el.querySelector('.uf-vollbild').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  });
  el.querySelector('.uf-code-umschalten').addEventListener('click', () => { ansicht.codeGross = !ansicht.codeGross; zeichne(); });
  zweiSchritte(el.querySelector('.uf-beenden'), 'Wirklich beenden?', () => steuern({ end: true }));

  async function steuern(aenderung) {
    try {
      ansicht.run = (await api('PATCH', `/poll-runs/${ansicht.run.id}`, aenderung)).run;
      zeichne();
    } catch (err) {
      meldung(el.querySelector('.uf-buehne-meldung'), err.message);
    }
  }

  function zeichne() {
    const r = ansicht.run;
    const live = !o.nurLesen && !r.endedAt;
    const zeigen = live && (o.zugangZeigen ? o.zugangZeigen(r) : true);
    el.classList.toggle('code-gross', ansicht.codeGross && zeigen);
    el.querySelector('.uf-beenden').hidden = !live;
    el.querySelector('.uf-code-umschalten').hidden = !zeigen;
    el.querySelector('.uf-code-umschalten').textContent = ansicht.codeGross ? 'Code verkleinern' : 'Code groß zeigen';
    const zusatz = o.status ? o.status(r) : `${r.participants} Teilnehmende`;
    el.querySelector('.uf-buehne-status').innerHTML = r.endedAt
      ? `<span class="uf-abzeichen">${o.nurLesen ? `Durchführung vom ${zeit(r.startedAt)}` : 'Beendet'}</span> ${zusatz}`
      : `<span class="uf-abzeichen live">Live</span> ${zusatz}`;
    const z = el.querySelector('.uf-zugang');
    z.hidden = !zeigen;
    if (zeigen) zugang(z, r.kind, r.code);
    o.zeichne(el.querySelector('.uf-auswertung'), r, steuern, ansicht);
  }

  async function aktualisieren() {
    if (!el.isConnected || o.nurLesen || ansicht.run.endedAt) return;
    try {
      ansicht.run = (await api('GET', `/poll-runs/${ansicht.run.id}`)).run;
      zeichne();
      meldung(el.querySelector('.uf-buehne-meldung'), '');
      ansicht.timer = setTimeout(aktualisieren, o.intervall ?? 2000);
    } catch (err) {
      if (err.status === 401 || err.status === 403) { meldung(el.querySelector('.uf-buehne-meldung'), 'Deine Anmeldung ist abgelaufen. Schließe die Ansicht und melde dich erneut an.'); return; }
      meldung(el.querySelector('.uf-buehne-meldung'), 'Verbindung unterbrochen – neuer Versuch …');
      ansicht.timer = setTimeout(aktualisieren, 5000);
    }
  }
  ansicht.zeichne = zeichne;
  ansicht.steuern = steuern;
  ansicht.el = el;
  zeichne();
  ansicht.timer = setTimeout(aktualisieren, o.intervall ?? 2000);
  el.querySelector('.uf-schliessen').focus();
  return ansicht;
}

// ------------------------------------------------------------------ Teilnahme

/** Rahmen der Teilnahme-Ansicht; fragt den Stand regelmäßig ab und meldet das Ende */
export function teilnahmeRahmen(wurzel, code, stand, o) {
  wurzel.replaceChildren();
  const el = html(`<section class="uf-karte uf-teilnahme uf-teilnahme-${stand.kind}" aria-live="polite">
<p class="klein uf-teilnahme-kopf">${esc(WERKZEUGE[stand.kind].name)} · Code ${code}</p>
<h2>${esc(stand.title)}</h2>
<div class="uf-teilnahme-inhalt"></div>
<div class="uf-teilnahme-meldung"></div>
</section>`);
  wurzel.append(el);
  const t = {
    el,
    stand,
    ich: kennung(code),
    inhalt: el.querySelector('.uf-teilnahme-inhalt'),
    meldeZiel: el.querySelector('.uf-teilnahme-meldung'),
    timer: null,
    ende(text = 'Hier ist Schluss. Danke fürs Mitmachen!') {
      clearTimeout(t.timer);
      t.inhalt.innerHTML = `<p class="uf-ende">${esc(text)}</p>`;
      meldung(t.meldeZiel, '');
      history.replaceState(null, '', location.pathname);
    },
    async senden(pfad, daten) {
      meldung(t.meldeZiel, '');
      try {
        return await api('POST', `/join/${code}/${pfad}`, { participant: t.ich, ...daten });
      } catch (err) {
        if (err.status === 404) { t.ende(); return null; }
        meldung(t.meldeZiel, err.message);
        throw err;
      }
    },
    async abfragen() {
      clearTimeout(t.timer);
      if (!el.isConnected) return;
      try {
        t.stand = await api('GET', `/join/${code}?participant=${t.ich}`);
        o.zeichne(t);
        t.timer = setTimeout(() => t.abfragen(), o.intervall(t.stand));
      } catch (err) {
        if (err.status === 404) { t.ende(); return; }
        t.timer = setTimeout(() => t.abfragen(), 6000);
      }
    },
  };
  o.zeichne(t);
  t.timer = setTimeout(() => t.abfragen(), o.intervall(stand));
  return t;
}
