// Werkzeug „Terminbuchung“ (/werkzeuge/termine/): Lehrkräfte legen Zeiträume und die Dauer eines Termins fest,
// Schülerinnen und Schüler buchen ohne Konto mit Code und Namen einen Termin – wer zuerst bucht, bekommt ihn.
// Daten: Schulbuch-API (/api/termine für Lehrkräfte, /api/termin/{code} ohne Konto). Rechnungen: slots.js.

import { api, html, esc, meldung, zweiSchritte, herunterladen, dateiname, kennung, lies, schreib, zugang, toolUrl, kurzUrl } from '../live/live.js';
import { slots, pruefeZeitraeume, nachTagen, datumLang, datumMini, datumKurz, terminText, ics, csv } from './slots.js';
import { qrSvg } from '../qr-code/qr-encode.js';

const wurzel = document.getElementById('termine');
const zustand = { lehrkraft: null, timer: null };
const stoppeTimer = () => { clearTimeout(zustand.timer); zustand.timer = null; };
/** regelmäßig nachfragen, aber nicht, solange die Seite im Hintergrund ist */
function wiederholen(fn, ms) {
  stoppeTimer();
  zustand.timer = setTimeout(async () => {
    if (document.hidden) { wiederholen(fn, ms); return; }
    await fn();
  }, ms);
}
const heute = () => new Date().toLocaleDateString('sv-SE');
const plusTage = (datum, n) => { const d = new Date(`${datum}T12:00:00`); d.setDate(d.getDate() + n); return d.toLocaleDateString('sv-SE'); };

// ------------------------------------------------------------------ Start

async function start() {
  const code = new URLSearchParams(location.search).get('code');
  if (code && /^\d{6}$/.test(code)) { buchen(code); return; }
  try {
    const { user } = await api('GET', '/auth/me');
    zustand.lehrkraft = user?.role === 'teacher' ? user : null;
  } catch { zustand.lehrkraft = null; }
  startseite();
}

function startseite(hinweis = '') {
  stoppeTimer();
  history.replaceState(null, '', location.pathname);
  wurzel.replaceChildren();
  const teil = html(`<section class="uf-karte uf-beitreten">
<h2>Termin buchen</h2>
<p>Gib den sechsstelligen Code ein, den du von deiner Lehrkraft bekommen hast – oder scanne den QR-Code. Du brauchst kein Konto.</p>
<form class="uf-code-form"><label class="sr" for="tb-code">Code</label>
<input id="tb-code" inputmode="numeric" autocomplete="off" maxlength="7" placeholder="123456" required>
<button type="submit" class="knopf primaer">Weiter</button></form>
<div class="tb-code-meldung"></div>
</section>`);
  teil.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = teil.querySelector('input').value.replace(/\D/g, '');
    const ziel = teil.querySelector('.tb-code-meldung');
    if (code.length !== 6) { meldung(ziel, 'Der Code hat sechs Ziffern.'); return; }
    try { await api('GET', `/termin/${code}`); buchen(code); } catch (err) {
      if (err.status !== 404) { meldung(ziel, err.message); return; }
      // vielleicht ein Code eines anderen Live-Tools (Umfrage, Quiz …)
      try {
        const stand = await api('GET', `/join/${code}`);
        location.href = `${toolUrl(stand.kind)}?code=${code}`;
      } catch { meldung(ziel, 'Zu diesem Code gibt es keine Terminbuchung.'); }
    }
  });
  wurzel.append(teil);
  const bereich = html('<section class="uf-lehrkraft-bereich" aria-label="Für Lehrkräfte"></section>');
  wurzel.append(bereich);
  if (zustand.lehrkraft) liste(bereich);
  else anmeldung(bereich, hinweis);
}

function anmeldung(bereich, hinweis) {
  bereich.replaceChildren(html(`<div class="uf-karte">
<h2>Terminbuchungen anlegen</h2>
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
      if (user.role !== 'teacher') { await api('POST', '/auth/logout', {}).catch(() => {}); throw new Error('Das ist kein Konto für Lehrkräfte.'); }
      zustand.lehrkraft = user;
      liste(bereich);
    } catch (err) { meldung(ziel, err.status === 401 ? 'Benutzername oder Passwort stimmen nicht.' : err.message); }
  });
}

/** Sitzung abgelaufen → zurück zur Anmeldung, sonst Meldung zeigen */
function fehler(err, ziel) {
  if (err.status === 401 || err.status === 403) {
    zustand.lehrkraft = null;
    document.querySelector('.tb-beamer')?.remove();
    document.documentElement.classList.remove('uf-buehne-offen');
    startseite('Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.');
    return;
  }
  meldung(ziel, err.message);
}

// ------------------------------------------------------------------ Liste der eigenen Terminbuchungen

async function liste(bereich = null) {
  stoppeTimer();
  if (!bereich) { startseite(); return; }
  bereich.replaceChildren(html(`<div class="uf-karte">
<div class="uf-kopfzeile"><h2>Meine Terminbuchungen</h2><p class="klein">Angemeldet als <strong>${esc(zustand.lehrkraft.username)}</strong> · <button type="button" class="uf-link tb-abmelden">Abmelden</button></p></div>
<div class="uf-leiste"><button type="button" class="knopf primaer tb-neu">+ Neue Terminbuchung</button></div>
<div class="tb-liste-meldung"></div>
<div class="tb-liste"><p class="klein">Lädt …</p></div>
<p class="klein uf-fussnote">Terminbuchungen werden samt allen Namen ${30} Tage nach ihrem letzten Termin automatisch gelöscht. Mit „Als Tabelle speichern“ in der Übersicht sicherst du die Liste vorher.</p>
</div>`));
  const ziel = bereich.querySelector('.tb-liste-meldung');
  bereich.querySelector('.tb-abmelden').addEventListener('click', async () => {
    await api('POST', '/auth/logout', {}).catch(() => {});
    try { localStorage.removeItem('schulbuch-lehrkraft'); sessionStorage.removeItem('schulbuch-lehrkraft'); } catch { /* egal */ }
    zustand.lehrkraft = null;
    startseite();
  });
  bereich.querySelector('.tb-neu').addEventListener('click', () => editor(null));
  let events;
  try { ({ events } = await api('GET', '/termine')); } catch (err) { fehler(err, ziel); return; }
  const el = bereich.querySelector('.tb-liste');
  if (!events.length) { el.innerHTML = '<p>Du hast noch keine Terminbuchungen. Lege eine an, z. B. für mündliche Prüfungen, Referate oder Sprechstunden.</p>'; return; }
  el.replaceChildren(...events.map((ev) => {
    const erster = ev.periods[0].datum;
    const karte = html(`<article class="uf-umfrage">
<h3>${esc(ev.title)}</h3>
<p class="klein uf-meta">${ev.periods.length === 1 ? datumLang(erster) : `${datumKurz(erster)} bis ${datumKurz(ev.lastDay)} (${ev.periods.length} Zeiträume)`}
· ${ev.settings.dauer} Minuten je Termin · <strong>${ev.gebucht}</strong> von ${ev.plaetzeGesamt} Plätzen gebucht
· Code <strong>${ev.code}</strong> · ${ev.buchbar ? 'Buchung offen' : 'Buchung geschlossen'} · wird gelöscht am ${datumKurz(ev.deletesOn)}</p>
<div class="uf-leiste">
<button type="button" class="knopf primaer tb-oeffnen">Übersicht</button>
<button type="button" class="knopf tb-bearbeiten">Bearbeiten</button>
<button type="button" class="knopf tb-kopie">Als Vorlage kopieren</button>
<button type="button" class="knopf tb-loeschen">Löschen</button>
</div></article>`);
    karte.querySelector('.tb-oeffnen').addEventListener('click', () => uebersicht(ev.id));
    karte.querySelector('.tb-bearbeiten').addEventListener('click', () => editor(ev));
    karte.querySelector('.tb-kopie').addEventListener('click', () => editor({ ...ev, id: null, title: `${ev.title} (Kopie)` }));
    zweiSchritte(karte.querySelector('.tb-loeschen'), 'Wirklich löschen – mit allen Buchungen?', async () => {
      try { await api('DELETE', `/termine/${ev.id}`); liste(bereich); } catch (err) { fehler(err, ziel); }
    });
    return karte;
  }));
}

// ------------------------------------------------------------------ Editor

function editor(ev) {
  stoppeTimer();
  const neu = !ev?.id;
  const d = {
    title: ev?.title ?? '',
    description: ev?.description ?? '',
    settings: { dauer: 15, pause: 0, plaetze: 1, namenSichtbar: false, umbuchen: true, schluss: null, ...(ev?.settings ?? {}) },
    periods: structuredClone(ev?.periods ?? [{ datum: plusTage(heute(), 7), von: '08:00', bis: '09:30' }]),
    open: ev?.open ?? true,
  };
  wurzel.replaceChildren();
  const form = html(`<form class="uf-karte uf-editor tb-editor" novalidate>
<h2>${neu ? 'Neue Terminbuchung' : 'Terminbuchung bearbeiten'}</h2>
<label class="uf-feld">Titel <input name="titel" maxlength="200" required value="${esc(d.title)}" placeholder="z. B. Mündliche Prüfung Englisch 10b"></label>
<label class="uf-feld">Hinweis für die Klasse <span class="klein">(optional, z. B. Ort, Ablauf, was mitzubringen ist)</span><textarea name="hinweis" rows="3" maxlength="2000">${esc(d.description)}</textarea></label>
<fieldset><legend>Termine</legend>
<div class="tb-zeile">
<label>Dauer eines Termins <span><input name="dauer" type="number" min="5" max="240" value="${d.settings.dauer}"> Minuten</span></label>
<label>Pause zwischen zwei Terminen <span><input name="pause" type="number" min="0" max="120" value="${d.settings.pause}"> Minuten</span></label>
<label>Plätze je Termin <span><input name="plaetze" type="number" min="1" max="30" value="${d.settings.plaetze}"></span></label>
</div>
<p class="klein">Mehr als ein Platz je Termin z. B. für Gruppenreferate. Die Vergabe läuft nach dem Prinzip <strong>„Wer zuerst bucht, bekommt den Termin“</strong>.</p>
</fieldset>
<fieldset><legend>Zeiträume</legend>
<p class="klein">In jedem Zeitraum entstehen nacheinander Termine der eingestellten Dauer. Bleibt am Ende weniger Zeit als ein Termin, entfällt der Rest.</p>
<table class="tb-zeitraeume"><thead><tr><th>Datum</th><th>von</th><th>bis</th><th><span class="sr">entfernen</span></th></tr></thead><tbody></tbody></table>
<div class="uf-leiste"><button type="button" class="knopf tb-plus">+ Zeitraum</button></div>
<div class="tb-vorschau" aria-live="polite"></div>
</fieldset>
<fieldset><legend>Einstellungen</legend>
<label class="uf-modus"><input type="checkbox" name="umbuchen"${d.settings.umbuchen ? ' checked' : ''}> <span><strong>Umbuchen und Stornieren erlauben</strong><br><span class="klein">Wer gebucht hat, kann bis zum Buchungsschluss auf einen anderen freien Termin wechseln oder absagen.</span></span></label>
<label class="uf-modus"><input type="checkbox" name="namen"${d.settings.namenSichtbar ? ' checked' : ''}> <span><strong>Namen für alle sichtbar</strong><br><span class="klein">Die Klasse sieht, wer welchen Termin hat (praktisch bei Referaten). Sonst steht dort nur „belegt“.</span></span></label>
<label class="uf-feld tb-schluss">Buchungsschluss <span class="klein">(optional)</span><input type="datetime-local" name="schluss" value="${esc(d.settings.schluss ?? '')}"></label>
<label class="uf-modus"><input type="checkbox" name="offen"${d.open ? ' checked' : ''}> <span><strong>Buchung geöffnet</strong><br><span class="klein">Lässt sich in der Übersicht jederzeit schließen und wieder öffnen.</span></span></label>
</fieldset>
<div class="tb-editor-meldung"></div>
<div class="uf-leiste uf-editor-fuss">
<button type="submit" class="knopf primaer">Speichern</button>
<button type="button" class="knopf tb-abbrechen">Abbrechen</button>
</div>
</form>`);
  const tbody = form.querySelector('tbody');
  const einstellungen = () => ({ dauer: Number(form.dauer.value), pause: Number(form.pause.value) || 0 });
  const vorschau = () => {
    const el = form.querySelector('.tb-vorschau');
    const fehlerText = pruefeZeitraeume(d.periods, einstellungen());
    if (fehlerText) { el.innerHTML = `<p class="uf-meldung fehler">${esc(fehlerText)}</p>`; return; }
    const s = slots(d.periods, einstellungen());
    const plaetze = Math.max(1, Number(form.plaetze.value) || 1);
    el.innerHTML = `<p><strong>${s.length} Termine</strong>${plaetze > 1 ? ` mit je ${plaetze} Plätzen (${s.length * plaetze} Plätze)` : ''}:</p>
<ul class="tb-vorschau-liste">${nachTagen(s).map((t) => `<li><strong>${datumMini(t.datum)}</strong> ${t.slots.map((x) => x.von).join(' · ')}</li>`).join('')}</ul>`;
  };
  const zeichneZeitraeume = () => {
    tbody.replaceChildren(...d.periods.map((p, i) => {
      const tr = html(`<table><tr>
<td><input type="date" value="${esc(p.datum)}" aria-label="Datum, Zeitraum ${i + 1}" data-f="datum"></td>
<td><input type="time" value="${esc(p.von)}" aria-label="Beginn, Zeitraum ${i + 1}" data-f="von"></td>
<td><input type="time" value="${esc(p.bis)}" aria-label="Ende, Zeitraum ${i + 1}" data-f="bis"></td>
<td><button type="button" class="uf-link" data-weg${d.periods.length === 1 ? ' disabled' : ''}>entfernen</button></td></tr></table>`).querySelector('tr');
      tr.querySelectorAll('[data-f]').forEach((inp) => inp.addEventListener('input', () => { p[inp.dataset.f] = inp.value; vorschau(); }));
      tr.querySelector('[data-weg]').addEventListener('click', () => { d.periods.splice(i, 1); zeichneZeitraeume(); });
      return tr;
    }));
    vorschau();
  };
  zeichneZeitraeume();
  form.querySelector('.tb-plus').addEventListener('click', () => {
    const letzter = d.periods.at(-1) ?? { datum: heute(), von: '08:00', bis: '09:30' };
    d.periods.push({ datum: letzter.datum ? plusTage(letzter.datum, 1) : '', von: letzter.von, bis: letzter.bis });
    zeichneZeitraeume();
    tbody.lastElementChild.querySelector('input').focus();
  });
  ['dauer', 'pause', 'plaetze'].forEach((n) => form[n].addEventListener('input', vorschau));
  form.querySelector('.tb-abbrechen').addEventListener('click', () => startseite());
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ziel = form.querySelector('.tb-editor-meldung');
    const body = {
      title: form.titel.value.trim(),
      description: form.hinweis.value.trim(),
      settings: { dauer: Number(form.dauer.value), pause: Number(form.pause.value) || 0, plaetze: Number(form.plaetze.value) || 1,
        umbuchen: form.umbuchen.checked, namenSichtbar: form.namen.checked, schluss: form.schluss.value || null },
      periods: d.periods,
      open: form.offen.checked,
    };
    if (!body.title) { meldung(ziel, 'Bitte gib einen Titel an.'); form.titel.focus(); return; }
    const fehlerText = pruefeZeitraeume(d.periods, body.settings);
    if (fehlerText) { meldung(ziel, fehlerText); return; }
    try {
      const { event } = neu ? await api('POST', '/termine', { ...body, blocked: [] }) : await api('PATCH', `/termine/${ev.id}`, { ...body, blocked: ev.blocked ?? [] });
      uebersicht(event.id, event);
    } catch (err) { fehler(err, ziel); }
  });
  wurzel.append(form);
  form.titel.focus();
}

// ------------------------------------------------------------------ Übersicht für die Lehrkraft

async function uebersicht(id, vorab = null) {
  stoppeTimer();
  wurzel.replaceChildren();
  const el = html(`<section class="uf-karte tb-uebersicht">
<div class="uf-kopfzeile"><h2 class="tb-titel"></h2><p><button type="button" class="uf-link tb-zurueck">← Meine Terminbuchungen</button></p></div>
<div class="tb-kopf"></div>
<div class="tb-meldung"></div>
<div class="tb-tabelle"></div>
</section>`);
  wurzel.append(el);
  el.querySelector('.tb-zurueck').addEventListener('click', () => startseite());
  const ziel = el.querySelector('.tb-meldung');
  let ev = vorab;
  let kopfFertig = false;

  const zeichneKopf = () => {
    el.querySelector('.tb-titel').textContent = ev.title;
    const link = `${toolUrl('booking')}?code=${ev.code}`;
    el.querySelector('.tb-kopf').innerHTML = `<div class="tb-zugang">
<div class="uf-qr">${qrSvg(link, { titel: `QR-Code zur Terminbuchung (${link})` })}</div>
<div><p class="klein">Code für die Klasse</p><p class="uf-code">${ev.code.slice(0, 3)} ${ev.code.slice(3)}</p>
<p class="klein">${esc(kurzUrl('booking'))} · <a href="${esc(link)}" target="_blank" rel="noopener">Link öffnen</a> · <button type="button" class="uf-link tb-link-kopieren">Link kopieren</button></p>
<p class="tb-status"></p>
<div class="uf-leiste">
<button type="button" class="knopf tb-offen"></button>
<button type="button" class="knopf tb-beamer-knopf">Beamer-Ansicht</button>
<button type="button" class="knopf tb-bearbeiten">Bearbeiten</button>
<button type="button" class="knopf tb-csv">Als Tabelle speichern</button>
<button type="button" class="knopf tb-drucken">Drucken</button>
</div></div></div>`;
    el.querySelector('.tb-link-kopieren').addEventListener('click', async (e) => {
      try { await navigator.clipboard.writeText(link); e.target.textContent = 'kopiert!'; } catch { e.target.textContent = link; }
    });
    el.querySelector('.tb-offen').addEventListener('click', () => aendern({ open: !ev.open }));
    el.querySelector('.tb-beamer-knopf').addEventListener('click', () => beamer(ev));
    el.querySelector('.tb-bearbeiten').addEventListener('click', () => editor(ev));
    el.querySelector('.tb-csv').addEventListener('click', () => herunterladen(`termine-${dateiname(ev.title)}.csv`, csv(ev), 'text/csv;charset=utf-8'));
    el.querySelector('.tb-drucken').addEventListener('click', () => drucken(ev));
    kopfFertig = true;
  };

  const zeichne = () => {
    if (!kopfFertig) zeichneKopf();
    const s = ev.settings;
    el.querySelector('.tb-status').innerHTML = `<strong>${ev.gebucht}</strong> von ${ev.plaetzeGesamt} Plätzen gebucht · ${s.dauer} Minuten je Termin`
      + `${s.plaetze > 1 ? ` · ${s.plaetze} Plätze je Termin` : ''} · ${ev.buchbar ? '<span class="tb-ok">Buchung offen</span>' : '<span class="tb-zu">Buchung geschlossen</span>'}`
      + `${s.schluss ? ` · Buchungsschluss ${datumKurz(s.schluss.slice(0, 10))}, ${s.schluss.slice(11)} Uhr` : ''}`;
    el.querySelector('.tb-offen').textContent = ev.open ? 'Buchung schließen' : 'Buchung öffnen';
    // Eingabefelder nicht unter den Fingern wegziehen
    if (el.querySelector('.tb-tabelle').contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
    el.querySelector('.tb-tabelle').innerHTML = nachTagen(ev.slots).map((t) => `<h3 class="tb-tag">${datumLang(t.datum)}</h3>
<table class="tb-slots"><tbody>${t.slots.map((x) => {
      const plaetze = Array.from({ length: x.plaetze }, (_, i) => x.buchungen.find((b) => b.seat === i) ?? null);
      return `<tr class="${x.gesperrt ? 'tb-gesperrt' : ''}${x.vorbei ? ' tb-vorbei' : ''}" data-slot="${x.key}">
<th>${x.von}–${x.bis}</th>
<td>${plaetze.map((b, i) => (b
        ? `<span class="tb-name" title="${b.selbst ? `gebucht am ${new Date(b.am).toLocaleString('de-DE')}` : 'von dir eingetragen'}">${esc(b.name)}${b.selbst ? '' : ' <span class="klein">(eingetragen)</span>'} <button type="button" class="uf-link tb-weg" data-seat="${i}" aria-label="Buchung von ${esc(b.name)} entfernen">✕</button></span>`
        : x.gesperrt ? '<span class="tb-frei">gesperrt</span>' : `<span class="tb-frei">frei</span> <button type="button" class="uf-link tb-eintragen">eintragen</button>`)).join('')}</td>
<td class="tb-aktion"><button type="button" class="uf-link tb-sperren">${x.gesperrt ? 'freigeben' : 'sperren'}</button></td></tr>`;
    }).join('')}</tbody></table>`).join('');
    el.querySelectorAll('tr[data-slot]').forEach((tr) => {
      const key = tr.dataset.slot;
      tr.querySelector('.tb-sperren').addEventListener('click', () => {
        const blocked = ev.blocked.includes(key) ? ev.blocked.filter((k) => k !== key) : [...ev.blocked, key];
        aendern({ blocked });
      });
      tr.querySelectorAll('.tb-weg').forEach((b) => zweiSchritte(b, 'entfernen?', async () => {
        try { ev = (await api('DELETE', `/termine/${ev.id}/buchungen/${key}/${b.dataset.seat}`)).event; zeichne(); } catch (err) { fehler(err, ziel); }
      }));
      tr.querySelectorAll('.tb-eintragen').forEach((b) => b.addEventListener('click', () => {
        const f = html('<form class="tb-eintragen-form"><input name="name" maxlength="60" placeholder="Name" aria-label="Name eintragen" required> <button class="knopf">OK</button></form>');
        b.replaceWith(f);
        f.name.focus();
        f.addEventListener('submit', async (e) => {
          e.preventDefault();
          try { ev = (await api('POST', `/termine/${ev.id}/buchungen`, { slot: key, name: f.name.value })).event; f.name.blur(); zeichne(); } catch (err) { fehler(err, ziel); }
        });
        f.name.addEventListener('keydown', (e) => { if (e.key === 'Escape') { f.name.blur(); zeichne(); } });
      }));
    });
  };

  async function aendern(teil) {
    try { ev = (await api('PATCH', `/termine/${ev.id}`, teil)).event; meldung(ziel, ''); zeichne(); } catch (err) { fehler(err, ziel); }
  }
  async function laden() {
    try {
      ev = (await api('GET', `/termine/${id}`)).event;
      meldung(ziel, '');
      zeichne();
    } catch (err) {
      if (err.status === 401 || err.status === 403 || err.status === 404) { fehler(err, ziel); if (err.status === 404) startseite(); return; }
      meldung(ziel, 'Verbindung unterbrochen – neuer Versuch …');
    }
    if (el.isConnected) wiederholen(laden, 5000);
  }
  if (ev) { zeichne(); wiederholen(laden, 5000); } else laden();
}

// ------------------------------------------------------------------ Beamer-Ansicht

function beamer(ev0) {
  document.querySelector('.tb-beamer')?.remove();
  const el = html(`<div class="uf-buehne tb-beamer" role="dialog" aria-modal="true" aria-label="${esc(ev0.title)}">
<header class="uf-buehne-kopf"><h2>${esc(ev0.title)}</h2><div class="uf-buehne-status"></div>
<div class="uf-buehne-knoepfe"><button type="button" class="knopf uf-vollbild">Vollbild</button><button type="button" class="knopf uf-schliessen">Schließen</button></div></header>
<div class="uf-buehne-inhalt"><aside class="uf-zugang"></aside><main class="uf-auswertung tb-beamer-slots"></main></div>
</div>`);
  document.body.append(el);
  document.documentElement.classList.add('uf-buehne-offen');
  let timer;
  const schliessen = () => {
    clearTimeout(timer);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    el.remove();
    document.documentElement.classList.remove('uf-buehne-offen');
  };
  el.querySelector('.uf-schliessen').addEventListener('click', schliessen);
  el.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !document.fullscreenElement) schliessen(); });
  el.querySelector('.uf-vollbild').addEventListener('click', () => (document.fullscreenElement ? document.exitFullscreen().catch(() => {}) : el.requestFullscreen?.().catch(() => {})));
  zugang(el.querySelector('.uf-zugang'), 'booking', ev0.code);
  const zeichne = (ev) => {
    el.querySelector('.uf-buehne-status').innerHTML = `<span class="uf-abzeichen${ev.buchbar ? ' tb-abz-offen' : ''}">${ev.buchbar ? 'offen' : 'geschlossen'}</span> <strong class="uf-teilnehmende">${ev.gebucht}</strong> von ${ev.plaetzeGesamt} gebucht`;
    el.querySelector('.tb-beamer-slots').innerHTML = nachTagen(ev.slots).map((t) => `<h3 class="tb-tag">${datumLang(t.datum)}</h3><div class="tb-raster">${t.slots.map((x) => {
      const frei = x.gesperrt ? 0 : x.plaetze - x.buchungen.length;
      const namen = ev.settings.namenSichtbar ? x.buchungen.map((b) => esc(b.name)).join(', ') : '';
      return `<div class="tb-kachel ${x.gesperrt || x.vorbei ? 'tb-k-aus' : frei > 0 ? 'tb-k-frei' : 'tb-k-voll'}"><strong>${x.von}</strong><span>${x.gesperrt ? 'gesperrt' : frei > 0 ? (x.plaetze > 1 ? `${frei} frei` : 'frei') : namen || 'belegt'}</span></div>`;
    }).join('')}</div>`).join('');
  };
  zeichne(ev0);
  const laden = async () => {
    if (!el.isConnected) return;
    try { zeichne((await api('GET', `/termine/${ev0.id}`)).event); } catch { /* nächster Versuch */ }
    timer = setTimeout(laden, 3000);
  };
  timer = setTimeout(laden, 3000);
  el.querySelector('.uf-schliessen').focus();
}

function drucken(ev) {
  let ziel = document.querySelector('.tb-druck');
  if (!ziel) { ziel = document.createElement('div'); ziel.className = 'tb-druck'; document.body.append(ziel); }
  ziel.innerHTML = `<h1>${esc(ev.title)}</h1>${ev.description ? `<p>${esc(ev.description)}</p>` : ''}
${nachTagen(ev.slots).map((t) => `<h2>${datumLang(t.datum)}</h2><table><tbody>${t.slots.map((x) => `<tr><th>${x.von}–${x.bis}</th><td>${
    x.gesperrt ? '<em>gesperrt</em>' : Array.from({ length: x.plaetze }, (_, i) => esc(x.buchungen.find((b) => b.seat === i)?.name ?? '')).join('<br>')}</td></tr>`).join('')}</tbody></table>`).join('')}`;
  document.documentElement.classList.add('tb-drucken');
  const fertig = () => { document.documentElement.classList.remove('tb-drucken'); window.removeEventListener('afterprint', fertig); };
  window.addEventListener('afterprint', fertig);
  window.print();
}

// ------------------------------------------------------------------ Buchen (ohne Konto)

async function buchen(code) {
  stoppeTimer();
  history.replaceState(null, '', `${location.pathname}?code=${code}`);
  const ich = kennung(`termin-${code}`);
  const nameSchluessel = `termin-name:${code}`;
  wurzel.replaceChildren();
  const el = html(`<section class="uf-karte tb-buchen" aria-live="polite">
<p class="klein uf-teilnahme-kopf">Terminbuchung · Code ${code}</p>
<h2 class="tb-titel">…</h2>
<div class="tb-info"></div>
<div class="tb-meine"></div>
<form class="tb-name-form"><label class="uf-feld">Dein Name <input name="name" maxlength="60" autocomplete="name" required placeholder="Vor- und Nachname" value="${esc(lies(nameSchluessel) ?? '')}"></label></form>
<div class="tb-meldung"></div>
<div class="tb-tage"></div>
</section>`);
  wurzel.append(el);
  const ziel = el.querySelector('.tb-meldung');
  const nameFeld = el.querySelector('input[name=name]');
  nameFeld.addEventListener('input', () => schreib(nameSchluessel, nameFeld.value.trim() || null));
  el.querySelector('form').addEventListener('submit', (e) => e.preventDefault());
  let ev = null;
  let vorgemerkt = null; // Umbuchen: erster Klick merkt vor, zweiter bucht

  const zeichne = () => {
    el.querySelector('.tb-titel').textContent = ev.title;
    const s = ev.settings;
    el.querySelector('.tb-info').innerHTML = `${ev.description ? `<p class="tb-hinweis">${esc(ev.description)}</p>` : ''}
<p class="klein">Ein Termin dauert ${s.dauer} Minuten${s.plaetze > 1 ? `, je Termin gibt es ${s.plaetze} Plätze` : ''}. <strong>Wer zuerst bucht, bekommt den Termin.</strong>
${s.umbuchen ? 'Du kannst später auf einen anderen freien Termin wechseln oder absagen.' : 'Deine Buchung ist verbindlich – Änderungen nur über deine Lehrkraft.'}
${s.schluss ? `Buchungsschluss: ${datumKurz(s.schluss.slice(0, 10))}, ${s.schluss.slice(11)} Uhr.` : ''}</p>
${ev.buchbar ? '' : '<p class="uf-meldung info">Die Buchung ist geschlossen. Du siehst nur noch, welche Termine vergeben sind.</p>'}`;
    const meine = ev.meine ? ev.slots.find((x) => x.key === ev.meine.slot) : null;
    const meineEl = el.querySelector('.tb-meine');
    if (meine) {
      if (!nameFeld.value) nameFeld.value = ev.meine.name;
      meineEl.innerHTML = `<div class="tb-bestaetigung"><p>Dein Termin: <strong>${terminText(meine)}</strong><br><span class="klein">gebucht als ${esc(ev.meine.name)}</span></p>
<div class="uf-leiste"><button type="button" class="knopf tb-ics">In meinen Kalender eintragen</button>
${s.umbuchen && ev.buchbar ? '<button type="button" class="knopf tb-absagen">Termin absagen</button>' : ''}</div>
${s.umbuchen && ev.buchbar ? '<p class="klein">Zum Umbuchen wähle unten einen anderen freien Termin.</p>' : ''}</div>`;
      meineEl.querySelector('.tb-ics').addEventListener('click', () => herunterladen(`termin-${dateiname(ev.title)}.ics`, ics({ titel: ev.title, beschreibung: ev.description, slot: meine, kennung: code }), 'text/calendar;charset=utf-8'));
      const absagen = meineEl.querySelector('.tb-absagen');
      if (absagen) zweiSchritte(absagen, 'Wirklich absagen?', async () => {
        try { ev = (await api('POST', `/termin/${code}/stornieren`, { participant: ich })).event; meldung(ziel, 'Dein Termin ist abgesagt.', 'info'); zeichne(); } catch (err) { meldung(ziel, err.message); }
      });
    } else meineEl.innerHTML = '';
    el.querySelector('.tb-name-form').hidden = Boolean(meine) || !ev.buchbar;
    const kannWaehlen = ev.buchbar && (!meine || s.umbuchen);
    el.querySelector('.tb-tage').innerHTML = nachTagen(ev.slots).map((t) => `<h3 class="tb-tag">${datumLang(t.datum)}</h3><div class="tb-raster">${t.slots.map((x) => {
      const frei = x.gesperrt ? 0 : x.plaetze - x.belegt;
      const namen = x.namen?.length ? esc(x.namen.join(', ')) : '';
      let art = 'tb-k-voll'; let text = namen || 'belegt'; let knopf = false;
      if (x.meiner) { art = 'tb-k-meiner'; text = 'dein Termin'; } else if (x.vorbei) { art = 'tb-k-aus'; text = 'vorbei'; } else if (x.gesperrt) { art = 'tb-k-aus'; text = 'nicht verfügbar'; } else if (frei > 0) { art = 'tb-k-frei'; text = x.plaetze > 1 ? `${frei} von ${x.plaetze} frei${namen ? ` · ${namen}` : ''}` : 'frei'; knopf = kannWaehlen; }
      if (vorgemerkt === x.key && knopf) text = 'hierhin umbuchen?';
      return knopf
        ? `<button type="button" class="tb-kachel ${art}${vorgemerkt === x.key ? ' tb-vorgemerkt' : ''}" data-slot="${x.key}" aria-label="${terminText(x)} buchen"><strong>${x.von}–${x.bis}</strong><span>${text}</span></button>`
        : `<div class="tb-kachel ${art}"><strong>${x.von}–${x.bis}</strong><span>${text}</span></div>`;
    }).join('')}</div>`).join('');
    el.querySelectorAll('button[data-slot]').forEach((b) => b.addEventListener('click', () => waehle(b.dataset.slot)));
  };

  async function waehle(key) {
    const name = nameFeld.value.trim();
    if (!ev.meine && name.length < 2) { meldung(ziel, 'Bitte gib zuerst deinen Namen ein.'); nameFeld.focus(); return; }
    if (ev.meine && vorgemerkt !== key) { vorgemerkt = key; zeichne(); return; }
    vorgemerkt = null;
    meldung(ziel, 'Einen Moment …', 'info');
    try {
      const vorher = ev.meine;
      ev = (await api('POST', `/termin/${code}/buchen`, { participant: ich, name: vorher?.name ?? name, slot: key })).event;
      meldung(ziel, vorher ? 'Umgebucht!' : 'Gebucht! Dein Termin steht oben.', 'info');
      zeichne();
      el.querySelector('.tb-meine').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch (err) {
      meldung(ziel, err.message);
      await laden(false);
    }
  }

  async function laden(wiederholt = true) {
    try {
      ev = (await api('GET', `/termin/${code}?participant=${ich}`)).event;
      zeichne();
    } catch (err) {
      if (err.status === 404) { startseite(); meldung(document.querySelector('.tb-code-meldung'), 'Zu diesem Code gibt es keine Terminbuchung (mehr).'); return; }
      meldung(ziel, 'Verbindung unterbrochen – neuer Versuch …');
    }
    if (wiederholt && el.isConnected) wiederholen(laden, 4000);
  }
  await laden();
}

start();
