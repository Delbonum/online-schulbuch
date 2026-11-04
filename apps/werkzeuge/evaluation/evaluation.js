// Werkzeug „Evaluation“ (/werkzeuge/evaluation/): anonyme Unterrichtsevaluation.
//
// Anonymität: Die Schülerinnen und Schüler brauchen kein Konto und geben keinen Namen an. Der Server speichert die
// Antworten ohne Verbindung zur Teilnahme-Kennung und ohne Zeitpunkt. Während der Durchführung sieht die
// Lehrkraft nur, wie viele Bögen abgegeben wurden – die Auswertung gibt es erst nach dem Ende und nur ab einer
// Mindestzahl an Rückmeldungen (Standard 5), damit sich keine Rückschlüsse auf Einzelne ziehen lassen.
// Rahmen (Anmeldung, Liste, Export …): ../live/live.js

import { api, html, esc, meldung, lies, schreib, zeit, zweiSchritte, werkzeug, buehnenRahmen, teilnahmeRahmen, herunterladen, dateiname } from '../live/live.js';
import { zahl } from '../umfragen/statistik.js';
import { skalen, aussagen, freitexte, csv } from './auswertung.js';
import { VORLAGEN } from './vorlagen.js';

const wurzel = document.getElementById('evaluation');
const STUFEN = ['trifft nicht zu', 'trifft eher nicht zu', 'trifft eher zu', 'trifft zu'];

const W = werkzeug({
  kind: 'evaluation',
  wurzel,
  editor: (p, vorlage) => editor(p, vorlage),
  durchfuehren: (p, karte) => W.sofortStarten(p, karte.querySelector('.uf-meta')),
  buehne: (run, nurLesen) => buehne(run, nurLesen),
  teilnehmen: (code, stand) => teilnehmen(code, stand),
  beschreibung: (p) => `${p.questions.length} Fragen · Auswertung ab ${p.settings.minResponses ?? 5} Rückmeldungen`,
  hinweisListe: 'Ergebnisse siehst du erst nach dem Beenden einer Durchführung unter „Ergebnisse früherer Durchführungen“.',
  leereListe: (el) => el.append(vorlagenWahl()),
});

function vorlagenWahl() {
  const box = html(`<div class="ev-vorlagen"><p><strong>Mit einer Vorlage beginnen:</strong></p>
${VORLAGEN.map((v, i) => `<button type="button" class="knopf" data-vorlage="${i}">${esc(v.name)}</button>`).join(' ')}</div>`);
  box.querySelectorAll('[data-vorlage]').forEach((k) => k.addEventListener('click', () => editor(null, structuredClone(VORLAGEN[k.dataset.vorlage].daten))));
  return box;
}

// ------------------------------------------------------------------ Editor

const neueFrage = (typ, vorher) => ({
  id: '',
  text: '',
  type: typ,
  ...(typ === 'choice' && { options: [...STUFEN], correct: null }),
  ...(typ === 'scale' && { min: 1, max: 10, step: 1, left: 'trifft nicht zu', right: 'trifft zu' }),
  ...(typ === 'text' && { maxLength: 1000 }),
  ...(vorher?.section && { section: vorher.section }),
});

function editor(p, vorlage = null) {
  const q = p ?? vorlage ?? {};
  const daten = {
    title: q.title ?? '',
    settings: { intro: '', outro: 'Vielen Dank für deine Rückmeldung!', minResponses: 5, dimensions: [], ...(q.settings ?? {}) },
    questions: structuredClone(q.questions ?? [neueFrage('choice')]),
  };
  wurzel.replaceChildren();
  const form = html(`<form class="uf-karte uf-editor" novalidate>
<h2>${p ? 'Evaluation bearbeiten' : 'Neue Evaluation'}</h2>
${p ? '' : `<div class="ev-vorlagen-ort"></div>`}
<label class="uf-feld">Titel <input name="titel" maxlength="200" required value="${esc(daten.title)}"></label>
<label class="uf-feld">Einleitung (sehen die Schülerinnen und Schüler oben) <textarea name="intro" rows="2" maxlength="2000">${esc(daten.settings.intro)}</textarea></label>
<label class="uf-feld">Abschluss (nach dem Abgeben) <input name="outro" maxlength="2000" value="${esc(daten.settings.outro)}"></label>
<label class="uf-countdown">Auswertung erst ab <select name="min">${[3, 5, 8, 10, 15].map((n) => `<option${n === daten.settings.minResponses ? ' selected' : ''}>${n}</option>`).join('')}</select> Rückmeldungen</label>
<p class="klein">Zum Schutz der Anonymität: Ergebnisse gibt es nur nach dem Beenden und nur ab dieser Zahl an abgegebenen Bögen.</p>
<h3>Fragen (${daten.questions.length})</h3>
<p class="klein">Mit <em>Abschnitt</em> gruppierst du Aussagen unter einer Überschrift (z. B. „Unsere Lehrkraft …“). Mit <em>Skala</em> fasst die
Auswertung mehrere Aussagen zu einem Kennwert zusammen; <em>umgepolt</em> heißt: Zustimmung zählt negativ.</p>
<ol class="uf-fragen"></ol>
<div class="uf-leiste">
<button type="button" class="knopf uf-plus" data-typ="choice">+ Aussage (4 Stufen)</button>
<button type="button" class="knopf uf-plus" data-typ="scale">+ Schieberegler</button>
<button type="button" class="knopf uf-plus" data-typ="text">+ Freitext</button>
</div>
<div class="uf-editor-meldung"></div>
<div class="uf-leiste uf-editor-fuss">
<button type="submit" class="knopf primaer" data-danach="liste">Speichern</button>
<button type="submit" class="knopf" data-danach="starten">Speichern und durchführen</button>
<button type="button" class="knopf uf-abbrechen">Abbrechen</button>
</div>
</form>`);
  form.querySelector('.ev-vorlagen-ort')?.append(vorlagenWahl());
  const listeEl = form.querySelector('.uf-fragen');
  const zeichne = () => {
    form.querySelector('h3').textContent = `Fragen (${daten.questions.length})`;
    listeEl.replaceChildren(...daten.questions.map((f, i) => frage(f, i)));
  };
  const frage = (f, i) => {
    const n = daten.questions.length;
    const li = html(`<li class="uf-frage">
<div class="uf-frage-kopf"><strong>${i + 1}</strong>
<span class="klein">${f.type === 'choice' ? `Aussage (${f.options.length} Stufen)` : f.type === 'scale' ? 'Schieberegler' : 'Freitext'}</span>
<span class="uf-frage-knoepfe">
<button type="button" class="uf-link" data-tat="hoch"${i === 0 ? ' disabled' : ''} aria-label="nach oben">↑</button>
<button type="button" class="uf-link" data-tat="runter"${i === n - 1 ? ' disabled' : ''} aria-label="nach unten">↓</button>
<button type="button" class="uf-link" data-tat="weg"${n === 1 ? ' disabled' : ''}>entfernen</button>
</span></div>
<label class="uf-feld"><span class="sr">Text</span><textarea rows="1" maxlength="500" placeholder="Aussage oder Frage" data-feld="text">${esc(f.text)}</textarea></label>
<div class="ev-felder">
<label>Abschnitt <input data-feld="section" maxlength="200" value="${esc(f.section ?? '')}" placeholder="optional"></label>
${f.type === 'text' ? '' : `<label>Skala <input data-feld="dimension" maxlength="100" value="${esc(f.dimension ?? '')}" placeholder="optional" list="ev-skalen"></label>
<label class="ev-umgepolt"><input type="checkbox" data-umgepolt${f.reverse ? ' checked' : ''}> umgepolt</label>`}
</div>
</li>`);
    li.querySelectorAll('[data-feld]').forEach((inp) => inp.addEventListener('input', () => {
      f[inp.dataset.feld] = inp.value;
    }));
    li.querySelector('[data-umgepolt]')?.addEventListener('change', (e) => { if (e.target.checked) f.reverse = true; else delete f.reverse; });
    li.querySelectorAll('[data-tat]').forEach((k) => k.addEventListener('click', () => {
      const q2 = daten.questions;
      if (k.dataset.tat === 'hoch') [q2[i - 1], q2[i]] = [q2[i], q2[i - 1]];
      if (k.dataset.tat === 'runter') [q2[i + 1], q2[i]] = [q2[i], q2[i + 1]];
      if (k.dataset.tat === 'weg') q2.splice(i, 1);
      zeichne();
    }));
    return li;
  };
  zeichne();
  const vorschlaege = html(`<datalist id="ev-skalen">${[...new Set(daten.questions.map((f) => f.dimension).filter(Boolean))].map((d) => `<option value="${esc(d)}">`).join('')}</datalist>`);
  form.append(vorschlaege);
  form.querySelectorAll('.uf-plus').forEach((k) => k.addEventListener('click', () => {
    daten.questions.push(neueFrage(k.dataset.typ, daten.questions[daten.questions.length - 1]));
    zeichne();
    listeEl.lastElementChild.querySelector('textarea').focus();
  }));
  form.querySelector('.uf-abbrechen').addEventListener('click', () => W.startseite());
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ziel = form.querySelector('.uf-editor-meldung');
    const body = {
      kind: 'evaluation',
      title: form.titel.value.trim(),
      settings: { ...daten.settings, intro: form.intro.value, outro: form.outro.value, minResponses: Number(form.min.value) },
      questions: daten.questions,
    };
    if (!body.title) { meldung(ziel, 'Bitte gib der Evaluation einen Titel.'); form.titel.focus(); return; }
    try {
      const { poll } = p ? await api('PATCH', `/polls/${p.id}`, body) : await api('POST', '/polls', body);
      await W.nachSpeichern(poll, e.submitter?.dataset.danach === 'starten');
    } catch (err) { W.fehler(err, ziel); }
  });
  wurzel.append(form);
  form.titel.focus();
}

// ------------------------------------------------------------------ Beamer und Auswertung

function buehne(run, nurLesen) {
  buehnenRahmen(run, {
    nurLesen,
    intervall: 5000,
    codeGross: true,
    schliessen: () => W.liste(),
    status: (r) => `<strong class="uf-teilnehmende">${r.submissions}</strong> ${r.submissions === 1 ? 'Bogen' : 'Bögen'} abgegeben`,
    zeichne(inhalt, r, steuern, a) {
      if (!r.endedAt && !nurLesen) {
        inhalt.innerHTML = `<h3 class="uf-frage-text">Anonyme Evaluation</h3>
<p class="ev-zahl"><strong>${r.submissions}</strong> ${r.submissions === 1 ? 'Bogen' : 'Bögen'} abgegeben</p>
<p>Die Schülerinnen und Schüler füllen den Bogen am eigenen Gerät aus (${r.questions.length} Fragen). Es werden keine Namen gespeichert.</p>
<p class="klein">Ergebnisse gibt es bewusst nicht live: Die Auswertung erscheint erst, wenn du die Evaluation beendest, und nur ab ${r.minResponses} Rückmeldungen.</p>`;
        return;
      }
      if (a.gezeichnet === r.id) return;
      a.gezeichnet = r.id;
      inhalt.innerHTML = auswertung(r);
      inhalt.querySelector('.ev-csv')?.addEventListener('click', () => {
        herunterladen(`evaluation-${dateiname(r.title)}-${r.startedAt.slice(0, 10)}.csv`, csv(r.questions, r.responses, r.settings.dimensions ?? []), 'text/csv;charset=utf-8');
      });
      inhalt.querySelector('.ev-drucken')?.addEventListener('click', () => window.print());
    },
  });
}

function auswertung(r) {
  const kopf = `<p class="klein">Durchführung vom ${zeit(r.startedAt)} · ${r.submissions} ${r.submissions === 1 ? 'Bogen' : 'Bögen'}</p>`;
  if (!r.responses) {
    return `${kopf}<p class="uf-leer">Zu wenige Rückmeldungen für eine anonyme Auswertung (${r.submissions} von mindestens ${r.minResponses}).</p>
<p class="klein">Zum Schutz der Schülerinnen und Schüler werden die Antworten dieser Durchführung nicht angezeigt und nicht exportiert.</p>`;
  }
  const boegen = r.responses;
  const sk = skalen(r.questions, boegen, r.settings.dimensions ?? []);
  const items = aussagen(r.questions, boegen);
  const texte = freitexte(r.questions, boegen);
  let gruppe = null;
  const skalenHtml = sk.length ? `<h3>Skalen</h3>
<p class="klein">Skalenwert je Person = Mittelwert ihrer Aussagen der Skala (umgepolte Aussagen gespiegelt); darüber Median, Mittelwert, Standardabweichung, Minimum und Maximum.</p>
<table class="ev-tabelle"><thead><tr><th>Skala</th><th>n</th><th>Median</th><th>Mittelwert</th><th>SD</th><th>Min</th><th>Max</th><th class="ev-balken-spalte">Mittelwert</th></tr></thead><tbody>
${sk.map((s) => {
    const zeile = `${s.group && s.group !== gruppe ? `<tr class="ev-gruppe"><th colspan="8">${esc(s.group)}</th></tr>` : ''}<tr><th scope="row">${esc(s.name)}${s.hint ? `<br><span class="klein ev-hinweis">${esc(s.hint)}</span>` : ''}</th>
<td>${s.n}</td><td>${zahl(s.median, 2)}</td><td><strong>${zahl(s.mittel, 2)}</strong></td><td>${zahl(s.sd, 2)}</td><td>${zahl(s.min, 2)}</td><td>${zahl(s.max, 2)}</td>
<td class="ev-balken-spalte"><span class="ev-balken"><span style="width:${((s.mittel - s.bereich[0]) / (s.bereich[1] - s.bereich[0] || 1)) * 100}%"></span></span></td></tr>`;
    gruppe = s.group;
    return zeile;
  }).join('')}</tbody></table>` : '';
  let abschnitt = null;
  const itemHtml = `<h3>Einzelne Aussagen</h3>
<table class="ev-tabelle ev-aussagen"><thead><tr><th>Aussage</th><th>n</th><th>Mittelwert</th><th>Verteilung</th></tr></thead><tbody>
${items.map((it) => {
    const f = it.frage;
    const kopfzeile = f.section && f.section !== abschnitt ? `<tr class="ev-gruppe"><th colspan="4">${esc(f.section)}</th></tr>` : '';
    abschnitt = f.section ?? abschnitt;
    const verteilung = it.verteilung
      ? `<span class="ev-stapel" title="${f.options.map((o, i) => `${o}: ${it.verteilung[i]}`).join(', ')}">${it.verteilung.map((v, i) => `<span class="ev-stufe-${Math.round((i / Math.max(1, f.options.length - 1)) * 3)}" style="width:${it.n ? (v / it.n) * 100 : 0}%">${v || ''}</span>`).join('')}</span>`
      : `${zahl(it.min)} bis ${zahl(it.max)}`;
    return `${kopfzeile}<tr><td>${esc(f.text)}${f.reverse ? ' <span class="klein ev-hinweis">(umgepolt)</span>' : ''}${f.dimension ? `<br><span class="klein ev-skala">${esc(f.dimension)}</span>` : ''}</td><td>${it.n}</td><td>${zahl(it.mittel, 2)}</td><td>${verteilung}</td></tr>`;
  }).join('')}</tbody></table>
${items.some((it) => it.verteilung) ? `<p class="klein ev-legende">${STUFEN.map((s, i) => `<span class="ev-stufe-${i}"></span> ${s}`).join(' ')} (bei vierstufigen Aussagen; Werte 1 bis 4)</p>` : ''}`;
  const textHtml = texte.map((t) => `<h3>${esc(t.frage.text)}</h3>${t.texte.length ? `<ul class="ev-texte">${t.texte.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="klein">Keine Antworten.</p>'}`).join('');
  return `${kopf}<div class="uf-leiste"><button type="button" class="knopf ev-csv">Rohdaten als CSV (Excel)</button><button type="button" class="knopf ev-drucken">Drucken / als PDF</button></div>
${skalenHtml}${itemHtml}${textHtml}`;
}

// ------------------------------------------------------------------ Teilnahme

function teilnehmen(code, stand) {
  const ENTWURF = `evaluation-entwurf:${code}`;
  let gezeichnet = false;
  teilnahmeRahmen(wurzel, code, stand, {
    intervall: () => 30000,
    zeichne(t) {
      const s = t.stand;
      if (s.submitted) {
        schreib(ENTWURF, null);
        t.inhalt.innerHTML = `<p class="uf-ende">${esc(s.outro || 'Vielen Dank für deine Rückmeldung!')}</p><p class="klein">Du hast den Bogen abgegeben.</p>`;
        return;
      }
      if (gezeichnet) return;
      gezeichnet = true;
      let entwurf = {};
      try { entwurf = JSON.parse(lies(ENTWURF) ?? '{}') ?? {}; } catch { entwurf = {}; }
      let abschnitt = null;
      const form = html(`<form class="ev-bogen">
${s.intro ? `<p class="ev-intro">${esc(s.intro)}</p>` : ''}
<p class="klein ev-anonym">🔒 Deine Antworten sind anonym: Es wird kein Name gespeichert, und deine Lehrkraft sieht nur die Gesamtauswertung der Klasse – erst nach dem Ende und nur, wenn genug mitgemacht haben.</p>
${s.questions.map((f, i) => {
    const kopfzeile = f.section && f.section !== abschnitt ? `<h3 class="ev-abschnitt">${esc(f.section)}</h3>` : '';
    abschnitt = f.section ?? abschnitt;
    const w = entwurf[f.id];
    let eingabe;
    if (f.type === 'choice') {
      eingabe = `<div class="ev-stufen" role="radiogroup" aria-label="${esc(f.text)}">${f.options.map((o, j) => `<label><input type="radio" name="f${i}" value="${j}"${w === j ? ' checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div>`;
    } else if (f.type === 'scale') {
      eingabe = `<div class="uf-regler${w === undefined ? ' unberuehrt' : ''}"><input type="range" name="f${i}" min="${f.min}" max="${f.max}" step="${f.step}" value="${w ?? Math.round((f.min + f.max) / 2)}" aria-label="${esc(f.text)}">
<div class="uf-pole"><span>${esc(f.left)}</span><output>${w === undefined ? 'nicht beantwortet' : zahl(w)}</output><span>${esc(f.right)}</span></div></div>`;
    } else {
      eingabe = `<textarea name="f${i}" rows="3" maxlength="${f.maxLength}" aria-label="${esc(f.text)}">${esc(typeof w === 'string' ? w : '')}</textarea>`;
    }
    return `${kopfzeile}<div class="ev-frage" data-i="${i}"><p class="ev-text">${esc(f.text)}</p>${eingabe}</div>`;
  }).join('')}
<p class="klein">Du kannst Fragen auch auslassen. Nach dem Abgeben lässt sich nichts mehr ändern.</p>
<div class="uf-leiste"><button type="button" class="knopf primaer ev-abgeben">Bogen abgeben</button></div>
</form>`);
      const werte = () => {
        const a = {};
        s.questions.forEach((f, i) => {
          const el = form.elements[`f${i}`];
          if (f.type === 'choice') { const c = form.querySelector(`input[name="f${i}"]:checked`); if (c) a[f.id] = Number(c.value); }
          if (f.type === 'scale' && !el.closest('.uf-regler').classList.contains('unberuehrt')) a[f.id] = Number(el.value);
          if (f.type === 'text' && el.value.trim()) a[f.id] = el.value;
        });
        return a;
      };
      form.addEventListener('input', (e) => {
        const regler = e.target.closest('.uf-regler');
        if (regler) { regler.classList.remove('unberuehrt'); regler.querySelector('output').textContent = zahl(Number(e.target.value)); }
        schreib(ENTWURF, JSON.stringify(werte()));
      });
      zweiSchritte(form.querySelector('.ev-abgeben'), 'Wirklich abgeben?', async () => {
        const antworten = werte();
        if (!Object.keys(antworten).length) { meldung(t.meldeZiel, 'Du hast noch nichts beantwortet.'); return; }
        try {
          const antwort = await t.senden('answers', { answers: antworten });
          if (antwort) { t.stand.submitted = true; this.zeichne(t); }
        } catch (err) {
          if (err.status === 409) t.abfragen();
        }
      });
      t.inhalt.replaceChildren(form);
    },
  });
}

W.start();
