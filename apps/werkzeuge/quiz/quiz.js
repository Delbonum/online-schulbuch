// Werkzeug „Quiz“ (/werkzeuge/quiz/): Quiz-Spiel für die ganze Klasse. Alle wählen einen Spielnamen; die Lehrkraft
// zeigt am Beamer eine Frage nach der anderen, die Geräte zeigen die farbigen Antwortfelder. Richtige Antworten
// bringen 500 bis 1000 Punkte – je schneller, desto mehr. Nach jeder Frage: Auflösung, auf Wunsch Rangliste,
// am Ende Siegerpodest. Rahmen (Anmeldung, Liste, Export …): ../live/live.js

import { api, html, esc, meldung, sekunden, zweiSchritte, werkzeug, buehnenRahmen, teilnahmeRahmen } from '../live/live.js';

const wurzel = document.getElementById('quiz');
const FORMEN = ['▲', '◆', '●', '■', '★', '⬟'];
const ZEITEN = [5, 10, 15, 20, 30, 45, 60, 90, 120];
const punkte = (n) => n.toLocaleString('de-DE');

const W = werkzeug({
  kind: 'quiz',
  wurzel,
  editor: (p) => editor(p),
  durchfuehren: (p, karte) => W.sofortStarten(p, karte.querySelector('.uf-meta')),
  buehne: (run, nurLesen) => buehne(run, nurLesen),
  teilnehmen: (code, stand) => teilnehmen(code, stand),
  beschreibung: (p) => `${p.questions.length} ${p.questions.length === 1 ? 'Frage' : 'Fragen'}`,
});

// ------------------------------------------------------------------ Editor

const neueFrage = () => ({ id: '', text: '', type: 'quiz', options: ['', '', '', ''], correct: [], time: 20 });

function editor(p) {
  const daten = { title: p?.title ?? '', questions: structuredClone(p?.questions ?? [neueFrage()]) };
  wurzel.replaceChildren();
  const form = html(`<form class="uf-karte uf-editor" novalidate>
<h2>${p ? 'Quiz bearbeiten' : 'Neues Quiz'}</h2>
<label class="uf-feld">Titel <input name="titel" maxlength="200" required value="${esc(daten.title)}"></label>
<h3>Fragen</h3>
<p class="klein">2 bis 6 Antworten je Frage; markiere mindestens eine als richtig. Die Zeit gilt je Frage.</p>
<ol class="uf-fragen"></ol>
<div class="uf-leiste"><button type="button" class="knopf uf-plus">+ Frage</button></div>
<div class="uf-editor-meldung"></div>
<div class="uf-leiste uf-editor-fuss">
<button type="submit" class="knopf primaer" data-danach="liste">Speichern</button>
<button type="submit" class="knopf" data-danach="starten">Speichern und spielen</button>
<button type="button" class="knopf uf-abbrechen">Abbrechen</button>
</div>
</form>`);
  const listeEl = form.querySelector('.uf-fragen');
  const zeichne = () => listeEl.replaceChildren(...daten.questions.map((f, i) => frage(f, i)));
  const frage = (f, i) => {
    const n = daten.questions.length;
    const li = html(`<li class="uf-frage">
<div class="uf-frage-kopf"><strong>Frage ${i + 1}</strong>
<label class="klein">Zeit <select class="qz-zeit">${ZEITEN.map((z) => `<option value="${z}"${z === f.time ? ' selected' : ''}>${sekunden(z)}</option>`).join('')}</select></label>
<span class="uf-frage-knoepfe">
<button type="button" class="uf-link" data-tat="hoch"${i === 0 ? ' disabled' : ''} aria-label="nach oben">↑</button>
<button type="button" class="uf-link" data-tat="runter"${i === n - 1 ? ' disabled' : ''} aria-label="nach unten">↓</button>
<button type="button" class="uf-link" data-tat="kopie">duplizieren</button>
<button type="button" class="uf-link" data-tat="weg"${n === 1 ? ' disabled' : ''}>entfernen</button>
</span></div>
<label class="uf-feld"><span class="sr">Frage</span><textarea rows="2" maxlength="500" placeholder="Frage">${esc(f.text)}</textarea></label>
<ol class="qz-optionen">${f.options.map((o, j) => `<li class="qz-farbe-${j}"><span class="qz-form" aria-hidden="true">${FORMEN[j]}</span>
<input value="${esc(o)}" maxlength="200" placeholder="Antwort ${j + 1}" data-j="${j}" aria-label="Antwort ${j + 1}">
<label class="klein"><input type="checkbox" data-richtig="${j}"${f.correct.includes(j) ? ' checked' : ''}> richtig</label>
<button type="button" class="uf-link" data-weg="${j}"${f.options.length <= 2 ? ' disabled' : ''} aria-label="Antwort ${j + 1} entfernen">✕</button></li>`).join('')}</ol>
${f.options.length < 6 ? '<button type="button" class="uf-link klein qz-plus">+ Antwort</button>' : ''}
</li>`);
    li.querySelector('textarea').addEventListener('input', (e) => { f.text = e.target.value; });
    li.querySelector('.qz-zeit').addEventListener('change', (e) => { f.time = Number(e.target.value); });
    li.querySelectorAll('input[data-j]').forEach((inp) => inp.addEventListener('input', () => { f.options[inp.dataset.j] = inp.value; }));
    li.querySelectorAll('input[data-richtig]').forEach((c) => c.addEventListener('change', () => {
      const j = Number(c.dataset.richtig);
      f.correct = c.checked ? [...new Set([...f.correct, j])].sort() : f.correct.filter((x) => x !== j);
    }));
    li.querySelectorAll('[data-weg]').forEach((k) => k.addEventListener('click', () => {
      const j = Number(k.dataset.weg);
      f.options.splice(j, 1);
      f.correct = f.correct.filter((x) => x !== j).map((x) => (x > j ? x - 1 : x));
      zeichne();
    }));
    li.querySelector('.qz-plus')?.addEventListener('click', () => { f.options.push(''); zeichne(); });
    li.querySelectorAll('[data-tat]').forEach((k) => k.addEventListener('click', () => {
      const q = daten.questions;
      if (k.dataset.tat === 'hoch') [q[i - 1], q[i]] = [q[i], q[i - 1]];
      if (k.dataset.tat === 'runter') [q[i + 1], q[i]] = [q[i], q[i + 1]];
      if (k.dataset.tat === 'kopie') q.splice(i + 1, 0, { ...structuredClone(f), id: '' });
      if (k.dataset.tat === 'weg') q.splice(i, 1);
      zeichne();
    }));
    return li;
  };
  zeichne();
  form.querySelector('.uf-plus').addEventListener('click', () => { daten.questions.push(neueFrage()); zeichne(); listeEl.lastElementChild.querySelector('textarea').focus(); });
  form.querySelector('.uf-abbrechen').addEventListener('click', () => W.startseite());
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ziel = form.querySelector('.uf-editor-meldung');
    // Leere Antwortfelder am Ende einer Frage weglassen
    const questions = daten.questions.map((f) => {
      const behalten = f.options.map((o, j) => [o.trim(), j]).filter(([o]) => o !== '');
      return { ...f, options: behalten.map(([o]) => o), correct: f.correct.map((c) => behalten.findIndex(([, j]) => j === c)).filter((c) => c >= 0) };
    });
    const body = { kind: 'quiz', title: form.titel.value.trim(), questions };
    if (!body.title) { meldung(ziel, 'Bitte gib dem Quiz einen Titel.'); form.titel.focus(); return; }
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
  const ansicht = buehnenRahmen(run, {
    nurLesen,
    intervall: 1500,
    schliessen: () => { clearInterval(uhr); W.liste(); },
    zugangZeigen: (r) => r.phase === 'lobby',
    status: (r) => `<strong class="uf-teilnehmende">${r.participants}</strong> ${r.participants === 1 ? 'Spieler/in' : 'Spieler/innen'}${r.code && r.phase !== 'lobby' && !r.endedAt ? ` · Code <strong>${r.code}</strong>` : ''}`,
    zeichne(inhalt, r, steuern, a) {
      const live = !nurLesen && !r.endedAt;
      const phase = nurLesen || r.endedAt ? 'end' : r.phase;
      const f = r.questions[r.current];
      const letzte = r.current === r.questions.length - 1;
      a.endeMs = phase === 'question' && r.remainingMs !== null ? Date.now() + r.remainingMs : null;
      const signatur = JSON.stringify([phase, r.current, r.ranking.map((x) => [x.nickname, x.score, x.answered]), r.answers]);
      if (a.signatur === signatur) return;
      a.signatur = signatur;
      if (phase === 'lobby') {
        inhalt.innerHTML = `<h3 class="uf-frage-text">Gleich geht's los!</h3>
<p>Scannt den QR-Code oder gebt den Code ein und wählt einen Spielnamen. ${r.questions.length} Fragen warten.</p>
<div class="qz-namen">${r.ranking.length ? r.ranking.map((x) => `<button type="button" class="qz-name" data-kick="${esc(x.participant)}" title="Klicken, um ${esc(x.nickname)} zu entfernen">${esc(x.nickname)}</button>`).join('') : '<p class="uf-leer">Noch niemand da.</p>'}</div>
<div class="uf-leiste uf-navigation"><button type="button" class="knopf primaer qz-los"${r.ranking.length ? '' : ' disabled'}>Quiz starten ▶</button>
<span class="klein">Unpassenden Namen anklicken (zweimal), um ihn zu entfernen.</span></div>`;
        inhalt.querySelector('.qz-los').addEventListener('click', () => steuern({ start: 0 }));
        inhalt.querySelectorAll('[data-kick]').forEach((k) => zweiSchritte(k, `${k.textContent} entfernen?`, () => steuern({ kick: k.dataset.kick })));
        return;
      }
      if (phase === 'question' || phase === 'reveal') {
        const verteilung = f.options.map((_, j) => (r.answers ?? []).filter((x) => x === j).length);
        const maxV = Math.max(1, ...verteilung);
        const aufgeloest = phase === 'reveal';
        inhalt.innerHTML = `<div class="uf-frage-leiste"><span class="uf-frage-nr">Frage ${r.current + 1} von ${r.questions.length}</span>
${aufgeloest ? '' : '<span class="qz-uhr" aria-live="off"></span>'}
<span class="qz-zaehler">${r.answeredCount} von ${r.participants} haben geantwortet</span></div>
<h3 class="uf-frage-text qz-frage">${esc(f.text)}</h3>
<div class="qz-felder${aufgeloest ? ' aufgeloest' : ''}">${f.options.map((o, j) => `<div class="qz-feld qz-farbe-${j}${aufgeloest && f.correct.includes(j) ? ' richtig' : ''}">
<span class="qz-form" aria-hidden="true">${FORMEN[j]}</span><span class="qz-text">${esc(o)}</span>
${aufgeloest ? `<span class="qz-anzahl">${f.correct.includes(j) ? '✓ ' : ''}${verteilung[j]}</span><span class="qz-balken" style="width:${(verteilung[j] / maxV) * 100}%"></span>` : ''}</div>`).join('')}</div>
${live ? `<div class="uf-leiste uf-navigation">${aufgeloest
    ? `<button type="button" class="knopf qz-zur-rangliste">Rangliste</button><button type="button" class="knopf primaer qz-weiter">${letzte ? 'Siegerehrung 🏆' : 'Nächste Frage ▶'}</button>`
    : '<button type="button" class="knopf qz-aufloesen">Jetzt auflösen</button>'}</div>` : ''}`;
        inhalt.querySelector('.qz-aufloesen')?.addEventListener('click', () => steuern({ phase: 'reveal' }));
        inhalt.querySelector('.qz-zur-rangliste')?.addEventListener('click', () => steuern({ phase: 'leaderboard' }));
        inhalt.querySelector('.qz-weiter')?.addEventListener('click', () => steuern(letzte ? { phase: 'end' } : { start: r.current + 1 }));
        tick(a);
        return;
      }
      if (phase === 'leaderboard') {
        inhalt.innerHTML = `<h3 class="uf-frage-text">Rangliste nach Frage ${r.current + 1}</h3>${rangliste(r.ranking.slice(0, 5))}
<div class="uf-leiste uf-navigation"><button type="button" class="knopf primaer qz-weiter">${letzte ? 'Siegerehrung 🏆' : 'Nächste Frage ▶'}</button></div>`;
        inhalt.querySelector('.qz-weiter').addEventListener('click', () => steuern(letzte ? { phase: 'end' } : { start: r.current + 1 }));
        return;
      }
      // Ende: Siegerpodest und vollständige Rangliste
      const [p1, p2, p3] = r.ranking;
      const stufe = (x, platz) => (x ? `<div class="qz-stufe qz-platz-${platz}"><span class="qz-podest-name">${esc(x.nickname)}</span><span class="qz-podest-punkte">${punkte(x.score)}</span><span class="qz-podest-sockel">${platz}</span></div>` : '<div class="qz-stufe leer"></div>');
      inhalt.innerHTML = `<h3 class="uf-frage-text">${live ? 'Siegerehrung' : 'Ergebnis'}</h3>
${r.ranking.length ? `<div class="qz-podest">${stufe(p2, 2)}${stufe(p1, 1)}${stufe(p3, 3)}</div>` : '<p class="uf-leer">Niemand hat mitgespielt.</p>'}
${r.ranking.length > 3 ? `<details class="qz-alle"><summary>Alle Ergebnisse (${r.ranking.length})</summary>${rangliste(r.ranking)}</details>` : ''}
${live ? '<p class="klein">Mit „Beenden“ oben schließt du das Quiz; die Ergebnisse bleiben gespeichert.</p>' : ''}`;
    },
  });
  // Restzeit flüssig herunterzählen (der Stand kommt nur alle 1,5 s)
  function tick(a) {
    const el = a.el?.querySelector('.qz-uhr');
    if (!el || a.endeMs == null) return;
    const rest = Math.max(0, Math.ceil((a.endeMs - Date.now()) / 1000));
    el.textContent = rest;
    el.classList.toggle('knapp', rest <= 5);
  }
  const uhr = setInterval(() => { if (!ansicht.el.isConnected) clearInterval(uhr); else tick(ansicht); }, 200);
}

function rangliste(liste) {
  return `<ol class="qz-rangliste">${liste.map((x) => `<li><span class="qz-rang-name">${esc(x.nickname)}</span><span class="qz-rang-punkte">${punkte(x.score)} Punkte · ${x.correct} richtig</span></li>`).join('')}</ol>`;
}

// ------------------------------------------------------------------ Teilnahme (Gerät)

function teilnehmen(code, stand) {
  let angezeigt = null;
  let endeMs = null;
  const rahmen = teilnahmeRahmen(wurzel, code, stand, {
    intervall: (s) => (s.phase === 'lobby' ? 3000 : 2000),
    zeichne(t) {
      const s = t.stand;
      endeMs = s.phase === 'question' && s.remainingMs ? Date.now() + s.remainingMs : null;
      const signatur = JSON.stringify([s.nickname, s.phase, s.current, s.answer, s.score]);
      if (signatur === angezeigt) return;
      angezeigt = signatur;
      if (!s.nickname) {
        const form = html(`<form class="qz-anmelden"><p>Wähle einen Spielnamen für die Rangliste – bitte keinen vollen Namen, ein Spitzname genügt.</p>
<label class="sr" for="qz-name">Spielname</label><input id="qz-name" maxlength="20" autocomplete="off" placeholder="Spielname" required>
<button type="submit" class="knopf primaer">Los geht's</button></form>`);
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          try {
            const antwort = await t.senden('name', { nickname: form.querySelector('input').value });
            if (antwort) t.abfragen();
          } catch { /* Meldung steht schon da */ }
        });
        t.inhalt.replaceChildren(form);
        form.querySelector('input').focus();
        return;
      }
      const kopf = `<p class="qz-ich">Du spielst als <strong>${esc(s.nickname)}</strong>${s.score != null ? ` · ${punkte(s.score)} Punkte · Platz ${s.rank}` : ''}</p>`;
      if (s.phase === 'lobby') {
        t.inhalt.innerHTML = `${kopf}<p class="uf-ende">Du bist dabei! Gleich geht es los – schau nach vorn.</p>`;
        return;
      }
      if (s.phase === 'question') {
        if (s.answer !== null && s.answer !== undefined) {
          t.inhalt.innerHTML = `${kopf}<div class="qz-gewaehlt qz-farbe-${s.answer}"><span class="qz-form">${FORMEN[s.answer]}</span> ${esc(s.question.options[s.answer])}</div><p class="uf-ende">Antwort gespeichert. Warte auf die Auflösung …</p>`;
          return;
        }
        t.inhalt.innerHTML = `${kopf}<p class="uf-frage-nr">Frage ${s.current + 1} von ${s.total} · <span class="qz-uhr-klein"></span></p>
<p class="qz-frage-klein">${esc(s.question.text)}</p>
<div class="qz-knoepfe">${s.question.options.map((o, j) => `<button type="button" class="qz-knopf qz-farbe-${j}" data-j="${j}"><span class="qz-form" aria-hidden="true">${FORMEN[j]}</span><span>${esc(o)}</span></button>`).join('')}</div>`;
        t.inhalt.querySelectorAll('[data-j]').forEach((k) => k.addEventListener('click', async () => {
          t.inhalt.querySelectorAll('[data-j]').forEach((x) => { x.disabled = true; });
          try {
            const antwort = await t.senden('answers', { answers: { [s.question.id]: Number(k.dataset.j) } });
            if (antwort) { t.stand.answer = antwort.answer; this.zeichne(t); }
          } catch { t.abfragen(); }
        }));
        return;
      }
      if (s.phase === 'reveal') {
        const richtig = s.answer != null && s.question.correct.includes(s.answer);
        t.inhalt.innerHTML = `<div class="qz-ergebnis ${s.answer == null ? 'keine' : richtig ? 'richtig' : 'falsch'}">
<p class="qz-ergebnis-titel">${s.answer == null ? 'Keine Antwort' : richtig ? 'Richtig!' : 'Leider falsch'}</p>
${richtig ? `<p>+ ${punkte(s.points)} Punkte</p>` : `<p>Richtig: ${s.question.correct.map((j) => esc(s.question.options[j])).join(' / ')}</p>`}
</div>${kopf}`;
        return;
      }
      t.inhalt.innerHTML = `${kopf}<p class="uf-ende">${s.phase === 'end' ? `Geschafft! Du bist auf Platz ${s.rank ?? '–'}.` : 'Schau nach vorn zur Rangliste.'}</p>`;
    },
  });
  const uhr = setInterval(() => {
    if (!rahmen.el.isConnected) { clearInterval(uhr); return; }
    const el = rahmen.inhalt.querySelector('.qz-uhr-klein');
    if (el && endeMs) el.textContent = `noch ${Math.max(0, Math.ceil((endeMs - Date.now()) / 1000))} s`;
  }, 250);
}

W.start();
