// Werkzeug „Wortwolke“ (/werkzeuge/wortwolke/): Die Klasse schickt Begriffe zu einer Frage, am Beamer wächst
// live eine Wortwolke. Häufige Begriffe werden größer; Groß-/Kleinschreibung zählt nicht. Die Lehrkraft kann
// unpassende Begriffe mit einem Klick ausblenden. Rahmen (Anmeldung, Liste, Export …): ../live/live.js

import { api, html, esc, meldung, werkzeug, buehnenRahmen, teilnahmeRahmen } from '../live/live.js';
import { zaehleWoerter, wolkeLayout } from './wolke.js';

const wurzel = document.getElementById('wortwolke');
const FARBEN = ['#3d4a5c', '#4743c5', '#0b6b72', '#c8372d', '#22883b', '#8a6d1f', '#7a3fa0', '#1f6fb2'];

const W = werkzeug({
  kind: 'wordcloud',
  wurzel,
  editor: (p) => editor(p),
  durchfuehren: (p, karte) => W.sofortStarten(p, karte.querySelector('.uf-meta')),
  buehne: (run, nurLesen) => buehne(run, nurLesen),
  teilnehmen: (code, stand) => teilnehmen(code, stand),
  beschreibung: (p) => (p.questions.length === 1 ? `„${p.questions[0].text}“` : `${p.questions.length} Fragen`),
});

// ------------------------------------------------------------------ Editor

const neueFrage = () => ({ id: '', text: '', type: 'words', maxWords: 3, maxLength: 30 });

function editor(p) {
  const daten = { title: p?.title ?? '', questions: structuredClone(p?.questions ?? [neueFrage()]) };
  wurzel.replaceChildren();
  const form = html(`<form class="uf-karte uf-editor" novalidate>
<h2>${p ? 'Wortwolke bearbeiten' : 'Neue Wortwolke'}</h2>
<label class="uf-feld">Titel <input name="titel" maxlength="200" required value="${esc(daten.title)}" placeholder="z. B. Einstieg Klimawandel"></label>
<h3>Fragen</h3>
<p class="klein">Meist genügt eine Frage. Bei mehreren schaltest du während der Durchführung weiter.</p>
<ol class="uf-fragen"></ol>
<div class="uf-leiste"><button type="button" class="knopf uf-plus">+ Weitere Frage</button></div>
<div class="uf-editor-meldung"></div>
<div class="uf-leiste uf-editor-fuss">
<button type="submit" class="knopf primaer" data-danach="liste">Speichern</button>
<button type="submit" class="knopf" data-danach="starten">Speichern und durchführen</button>
<button type="button" class="knopf uf-abbrechen">Abbrechen</button>
</div>
</form>`);
  const listeEl = form.querySelector('.uf-fragen');
  const zeichne = () => listeEl.replaceChildren(...daten.questions.map((f, i) => {
    const li = html(`<li class="uf-frage">
<div class="uf-frage-kopf"><strong>Frage ${i + 1}</strong>
<span class="uf-frage-knoepfe"><button type="button" class="uf-link" data-weg${daten.questions.length === 1 ? ' disabled' : ''}>entfernen</button></span></div>
<label class="uf-feld"><span class="sr">Frage</span><textarea rows="2" maxlength="500" placeholder="z. B. Was fällt dir zum Begriff „Freiheit“ ein?">${esc(f.text)}</textarea></label>
<label class="klein">Begriffe pro Person <select>${[1, 2, 3, 4, 5].map((n) => `<option${n === f.maxWords ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
</li>`);
    li.querySelector('textarea').addEventListener('input', (e) => { f.text = e.target.value; });
    li.querySelector('select').addEventListener('change', (e) => { f.maxWords = Number(e.target.value); });
    li.querySelector('[data-weg]').addEventListener('click', () => { daten.questions.splice(i, 1); zeichne(); });
    return li;
  }));
  zeichne();
  form.querySelector('.uf-plus').addEventListener('click', () => { daten.questions.push(neueFrage()); zeichne(); listeEl.lastElementChild.querySelector('textarea').focus(); });
  form.querySelector('.uf-abbrechen').addEventListener('click', () => W.startseite());
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ziel = form.querySelector('.uf-editor-meldung');
    const body = { kind: 'wordcloud', title: form.titel.value.trim(), questions: daten.questions };
    if (!body.title) { meldung(ziel, 'Bitte gib der Wortwolke einen Titel.'); form.titel.focus(); return; }
    try {
      const { poll } = p ? await api('PATCH', `/polls/${p.id}`, body) : await api('POST', '/polls', body);
      await W.nachSpeichern(poll, e.submitter?.dataset.danach === 'starten');
    } catch (err) { W.fehler(err, ziel); }
  });
  wurzel.append(form);
  form.titel.focus();
}

// ------------------------------------------------------------------ Beamer

function buehne(run, nurLesen) {
  buehnenRahmen(run, {
    nurLesen,
    intervall: 2500,
    schliessen: () => W.liste(),
    status: (r) => `<strong class="uf-teilnehmende">${r.participants}</strong> Teilnehmende`,
    zeichne(inhalt, r, steuern, ansicht) {
      ansicht.frage ??= r.current;
      if (!nurLesen && !r.endedAt) ansicht.frage = r.current;
      const i = ansicht.frage;
      const f = r.questions[i];
      const hidden = new Set((r.settings.hidden ?? []).filter((h) => h.question === f.id).map((h) => h.word));
      const alle = zaehleWoerter(r.words[f.id] ?? []);
      const sichtbar = alle.filter((w) => !hidden.has(w.schluessel));
      const verborgen = alle.filter((w) => hidden.has(w.schluessel));
      const signatur = JSON.stringify([i, sichtbar, verborgen.length, ansicht.liste, r.endedAt]);
      if (ansicht.signatur === signatur) return; // nichts Neues: Wolke nicht neu setzen (kein Flackern)
      ansicht.signatur = signatur;
      const steuerbar = !nurLesen && !r.endedAt;
      inhalt.innerHTML = `<div class="uf-frage-leiste"><span class="uf-frage-nr">${r.questions.length > 1 ? `Frage ${i + 1} von ${r.questions.length} · ` : ''}${sichtbar.reduce((a, w) => a + w.anzahl, 0)} Begriffe</span></div>
<h3 class="uf-frage-text">${esc(f.text)}</h3>
<div class="ww-flaeche">${sichtbar.length ? (ansicht.liste ? liste(sichtbar) : svgWolke(sichtbar)) : '<p class="uf-leer">Noch keine Begriffe.</p>'}</div>
${steuerbar && sichtbar.length ? '<p class="klein uf-tipp">Klicke auf einen Begriff, um ihn auszublenden.</p>' : ''}
${verborgen.length ? `<p class="klein ww-verborgen">Ausgeblendet: ${verborgen.map((w) => `<button type="button" class="uf-link" data-zeigen="${esc(w.schluessel)}">${esc(w.text)} (${w.anzahl})</button>`).join(', ')}${steuerbar ? ' – zum Wiedereinblenden anklicken' : ''}</p>` : ''}
<div class="uf-leiste uf-navigation">
${r.questions.length > 1 ? `<button type="button" class="knopf uf-zurueck"${i === 0 ? ' disabled' : ''}>◀ Vorherige Frage</button><button type="button" class="knopf primaer uf-weiter"${i === r.questions.length - 1 ? ' disabled' : ''}>Nächste Frage ▶</button>` : ''}
<button type="button" class="knopf ww-ansicht">${ansicht.liste ? 'Als Wolke zeigen' : 'Als Liste zeigen'}</button>
</div>`;
      const gehe = (n) => { if (steuerbar) steuern({ current: n }); else { ansicht.frage = n; ansicht.signatur = null; ansicht.zeichne(); } };
      inhalt.querySelector('.uf-zurueck')?.addEventListener('click', () => gehe(i - 1));
      inhalt.querySelector('.uf-weiter')?.addEventListener('click', () => gehe(i + 1));
      inhalt.querySelector('.ww-ansicht').addEventListener('click', () => { ansicht.liste = !ansicht.liste; ansicht.signatur = null; ansicht.zeichne(); });
      if (steuerbar) {
        inhalt.querySelectorAll('[data-wort]').forEach((t) => t.addEventListener('click', () => { ansicht.signatur = null; steuern({ hide: { question: f.id, word: t.dataset.wort } }); }));
        inhalt.querySelectorAll('[data-zeigen]').forEach((t) => t.addEventListener('click', () => { ansicht.signatur = null; steuern({ show: { question: f.id, word: t.dataset.zeigen } }); }));
      }
    },
  });
}

function liste(woerter) {
  return `<table class="ww-liste"><thead><tr><th>Begriff</th><th>Anzahl</th></tr></thead><tbody>${woerter.map((w) => `<tr><td><span data-wort="${esc(w.schluessel)}" role="button" tabindex="0">${esc(w.text)}</span></td><td>${w.anzahl}</td></tr>`).join('')}</tbody></table>`;
}

let messer = null;
function textBreite(text, groesse) {
  messer ??= document.createElement('canvas').getContext('2d');
  messer.font = `700 ${groesse}px Raleway, "Segoe UI", sans-serif`;
  return messer.measureText(text).width;
}

function svgWolke(woerter) {
  const { teile, box } = wolkeLayout(woerter, textBreite);
  const rand = 12;
  return `<svg class="ww-wolke" viewBox="${box.x - rand} ${box.y - rand} ${box.w + 2 * rand} ${box.h + 2 * rand}" role="img" aria-label="Wortwolke">
${teile.map((t, i) => `<text x="${t.x + t.w / 2}" y="${t.y + t.h * 0.78}" font-size="${t.groesse}" fill="${FARBEN[i % FARBEN.length]}" text-anchor="middle" data-wort="${esc(t.schluessel)}"><title>${esc(t.text)}: ${t.anzahl}</title>${esc(t.text)}</text>`).join('')}
</svg>`;
}

// ------------------------------------------------------------------ Teilnahme

function teilnehmen(code, stand) {
  let angezeigt = null;
  teilnahmeRahmen(wurzel, code, stand, {
    intervall: () => 4000,
    zeichne(t) {
      const s = t.stand;
      const f = s.questions[0];
      const rest = f.maxWords - s.words.length;
      const schluessel = JSON.stringify([s.current, s.words]);
      if (schluessel === angezeigt) return;
      angezeigt = schluessel;
      const box = html(`<div class="ww-teilnahme">
${s.total > 1 ? `<p class="uf-frage-nr">Frage ${s.current + 1} von ${s.total}</p>` : ''}
<p class="ww-frage">${esc(f.text)}</p>
${rest > 0 ? `<form class="ww-eingabe"><label class="sr" for="ww-wort">Dein Begriff</label><input id="ww-wort" maxlength="${f.maxLength}" autocomplete="off" placeholder="Dein Begriff"><button type="submit" class="knopf primaer">Abschicken</button></form>
<p class="klein">${rest === 1 ? 'Du kannst noch einen Begriff abschicken.' : `Du kannst noch ${rest} Begriffe abschicken.`}</p>` : '<p class="uf-ende">Danke! Schau nach vorn zur Wortwolke.</p>'}
${s.words.length ? `<p class="klein">Deine Begriffe: ${s.words.map((w) => `<strong>${esc(w)}</strong>`).join(', ')}</p>` : ''}
</div>`);
      box.querySelector('form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const feld = box.querySelector('input');
        const wort = feld.value.trim();
        if (!wort) return;
        try {
          const antwort = await t.senden('answers', { answers: { [f.id]: wort } });
          if (antwort) { t.stand.words = antwort.words; this.zeichne(t); }
        } catch (err) {
          if (err.status === 409) t.abfragen();
        }
      });
      t.inhalt.replaceChildren(box);
      box.querySelector('input')?.focus();
    },
  });
}

W.start();
