// Bausteine für digitale Arbeitsblätter. Sie werden im Inhalt nur mit HTML beschrieben;
// dieses Skript macht sie interaktiv. Der Seitengenerator bindet es automatisch ein,
// sobald einer der Bausteine auf einer Seite vorkommt.
//
//   <textarea class="notiz" data-notiz="id" aria-label="…"></textarea>
//       Antwortfeld. Wird im Browser gespeichert (localStorage, Schlüssel „ab:id“).
//       Die id muss im ganzen Schulbuch eindeutig sein (Präfix der Reihe verwenden).
//   <div class="notiz-rueckblick" data-notiz="id">Ersatztext</div>
//       Zeigt, was früher in das Feld „id“ geschrieben wurde (z. B. eine Vermutung vom Anfang).
//   <div class="quiz" data-anweisung="…"> <div class="frage" data-erklaerung="…">
//       <p>Frage</p> <ul><li>falsch</li><li data-richtig>richtig</li></ul> </div> … </div>
//   <div class="sortieren" data-kategorien="A|B"> <ul><li data-gehoert="A">…</li>…</ul> </div>
//   <ol class="reihenfolge"> <li>…</li> … </ol>          (Einträge in der richtigen Reihenfolge)
//   <div class="position" data-id="id" data-links="…" data-rechts="…" [data-vergleich="andere-id"]>
//       <p>Aussage</p> </div>
//
// Ohne JavaScript bleiben alle Bausteine lesbar (Listen, Textfelder).

import { uebung, mische } from '../grammatik/uebung.js';

const speicher = {
  lies(id) { try { return localStorage.getItem(`ab:${id}`) ?? ''; } catch { return ''; } },
  schreib(id, wert) {
    try {
      if (wert) localStorage.setItem(`ab:${id}`, wert);
      else localStorage.removeItem(`ab:${id}`);
    } catch { /* privates Fenster o. Ä.: dann eben ohne Speichern */ }
  },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------------------------------------------------------------- Antwortfelder

function hoehe(feld) {
  if (feld.tagName !== 'TEXTAREA') return;
  feld.style.height = 'auto';
  feld.style.height = `${feld.scrollHeight + 4}px`;
}

const notizen = [...document.querySelectorAll('.notiz[data-notiz]')];
for (const feld of notizen) {
  feld.value = speicher.lies(feld.dataset.notiz);
  if (feld.tagName === 'TEXTAREA' && !feld.rows) feld.rows = 3;
  hoehe(feld);
  let zeit = null;
  feld.addEventListener('input', () => {
    hoehe(feld);
    clearTimeout(zeit);
    zeit = setTimeout(() => speicher.schreib(feld.dataset.notiz, feld.value.trim() ? feld.value : ''), 300);
  });
}
window.addEventListener('beforeprint', () => notizen.forEach(hoehe));

for (const box of document.querySelectorAll('.notiz-rueckblick[data-notiz]')) {
  const wert = speicher.lies(box.dataset.notiz);
  if (wert) {
    box.classList.add('gefuellt');
    box.textContent = wert;
  }
}

// Beschriftung eines Feldes für die Textdatei: aria-label, sonst die zugehörige Aufgabe
function beschriftung(feld) {
  if (feld.getAttribute('aria-label')) return feld.getAttribute('aria-label');
  if (feld.id) {
    const label = document.querySelector(`label[for="${feld.id}"]`);
    if (label) return label.textContent.trim();
  }
  return feld.dataset.notiz;
}

if (notizen.length) {
  const leiste = document.querySelector('.ab-leiste') ?? (() => {
    const neu = document.createElement('div');
    neu.className = 'ab-leiste';
    (document.querySelector('.haupt .text, .haupt .breit-inhalt') ?? document.querySelector('main')).append(neu);
    return neu;
  })();
  leiste.innerHTML = `<p class="ab-leiste-titel">Deine Antworten auf dieser Seite</p>
<p>Alles, was du in die Felder schreibst, bleibt nur in diesem Browser auf diesem Gerät gespeichert – niemand sonst kann es sehen.
Sichere deine Antworten als Datei, wenn du sie abgeben oder auf einem anderen Gerät weiterarbeiten willst.</p>
<p class="ab-knoepfe"><button type="button" class="knopf primaer" data-ab="datei">Als Textdatei sichern</button>
<button type="button" class="knopf" data-ab="drucken">Drucken / als PDF</button>
<button type="button" class="knopf" data-ab="loeschen">Antworten dieser Seite löschen</button></p>`;

  leiste.addEventListener('click', (e) => {
    const art = e.target.closest('[data-ab]')?.dataset.ab;
    if (art === 'drucken') window.print();
    if (art === 'loeschen' && confirm('Alle Antworten auf dieser Seite löschen? Das lässt sich nicht rückgängig machen.')) {
      for (const feld of notizen) { feld.value = ''; speicher.schreib(feld.dataset.notiz, ''); hoehe(feld); }
    }
    if (art === 'datei') {
      const titel = document.querySelector('.seitenkopf h1')?.textContent.trim() ?? document.title;
      const datum = new Date().toLocaleDateString('de-DE');
      const teile = [`${titel}`, `Online-Schulbuch · ${location.href} · ${datum}`, ''];
      for (const feld of notizen) teile.push(`## ${beschriftung(feld)}`, feld.value.trim() || '(noch nichts eingetragen)', '');
      const blob = new Blob([teile.join('\n')], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${titel.replace(/[^\wäöüÄÖÜß -]+/g, '').trim().replace(/\s+/g, '-')}.txt`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
  });
}

// ---------------------------------------------------------------- Quiz (mit der Übungsmaschine der Grammatik)

// In Aufgabentexten erlaubt die Übungsmaschine nur <b>, <i>, <em>, <strong>.
const quizText = (el) => el.innerHTML.replace(/<(?!\/?(?:b|i|em|strong)>)[^>]+>/g, '').replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

document.querySelectorAll('.quiz').forEach((quiz) => {
  const aufgaben = [...quiz.querySelectorAll('.frage')].map((f) => {
    const optionen = [...f.querySelectorAll('li')];
    const richtig = optionen.find((o) => o.hasAttribute('data-richtig'));
    return {
      frage: quizText(f.querySelector('p') ?? f),
      optionen: optionen.map((o) => o.textContent.trim()),
      richtig: richtig?.textContent.trim(),
      erklaerung: f.dataset.erklaerung,
    };
  });
  quiz.classList.add('werkzeug');
  uebung(quiz, {
    anweisung: quiz.dataset.anweisung,
    aufgaben,
    mischen: quiz.dataset.mischen !== 'nein',
    anzahl: quiz.dataset.anzahl ? Number(quiz.dataset.anzahl) : undefined,
  });
});

// ---------------------------------------------------------------- Sortieren

document.querySelectorAll('.sortieren[data-kategorien]').forEach((box) => {
  const kategorien = box.dataset.kategorien.split('|').map((k) => k.trim());
  const liste = box.querySelector('ul');
  const karten = [...liste.querySelectorAll('li')].map((li, i) => ({
    i,
    html: li.innerHTML,
    soll: li.dataset.gehoert,
    erklaerung: li.dataset.erklaerung,
  }));
  const erklaerungAllgemein = box.querySelector('.sortieren-erklaerung');
  if (erklaerungAllgemein) erklaerungAllgemein.hidden = true;
  let gewaehlt = null;
  let geprueft = false;

  const ablage = document.createElement('div');
  ablage.className = 'sort-brett';
  ablage.innerHTML = `<p class="sort-hilfe">Klicke eine Karte an und dann die passende Spalte – oder ziehe die Karte hinüber.</p>
<div class="sort-stapel" data-ziel="" aria-label="Noch nicht zugeordnet"></div>
<div class="sort-spalten" style="--spalten:${kategorien.length}">${kategorien.map((k) => `<div class="sort-spalte" data-ziel="${esc(k)}"><button type="button" class="sort-kopf">${esc(k)}</button><div class="sort-inhalt"></div></div>`).join('')}</div>
<div class="gr-rueckmeldung" aria-live="polite"></div>
<div class="gr-leiste"><button type="button" class="knopf primaer" data-aktion="pruefen">Prüfen</button><button type="button" class="knopf" data-aktion="loesung">Lösung zeigen</button><button type="button" class="knopf" data-aktion="neu">Neu mischen</button></div>`;
  liste.replaceWith(ablage);
  box.classList.add('werkzeug');
  const stapel = ablage.querySelector('.sort-stapel');
  const rueck = ablage.querySelector('.gr-rueckmeldung');

  const ziel = (name) => (name ? ablage.querySelector(`.sort-spalte[data-ziel="${CSS.escape(name)}"] .sort-inhalt`) : stapel);

  function waehle(karte) {
    if (gewaehlt) gewaehlt.setAttribute('aria-pressed', 'false');
    gewaehlt = karte === gewaehlt ? null : karte;
    if (gewaehlt) gewaehlt.setAttribute('aria-pressed', 'true');
    ablage.classList.toggle('waehlt', Boolean(gewaehlt));
  }

  function lege(karte, name) {
    if (geprueft) zuruecksetzenMarken();
    ziel(name).append(karte);
    karte.dataset.liegt = name;
    if (gewaehlt) waehle(gewaehlt);
  }

  function zuruecksetzenMarken() {
    geprueft = false;
    ablage.querySelectorAll('.sort-karte').forEach((k) => k.classList.remove('richtig', 'falsch'));
    rueck.className = 'gr-rueckmeldung';
    rueck.innerHTML = '';
  }

  function baue() {
    stapel.innerHTML = '';
    ablage.querySelectorAll('.sort-inhalt').forEach((s) => { s.innerHTML = ''; });
    for (const k of mische(karten)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sort-karte';
      b.draggable = true;
      b.innerHTML = k.html;
      b.dataset.nr = k.i;
      b.dataset.liegt = '';
      b.setAttribute('aria-pressed', 'false');
      stapel.append(b);
    }
    zuruecksetzenMarken();
    if (erklaerungAllgemein) erklaerungAllgemein.hidden = true;
  }

  ablage.addEventListener('click', (e) => {
    const karte = e.target.closest('.sort-karte');
    if (karte) { waehle(karte); return; }
    const spalte = e.target.closest('[data-ziel]');
    if (spalte && gewaehlt) { lege(gewaehlt, spalte.dataset.ziel); return; }
    const aktion = e.target.closest('[data-aktion]')?.dataset.aktion;
    if (aktion === 'neu') baue();
    if (aktion === 'pruefen' || aktion === 'loesung') {
      let richtig = 0;
      const falsch = [];
      ablage.querySelectorAll('.sort-karte').forEach((b) => {
        const k = karten[Number(b.dataset.nr)];
        if (aktion === 'loesung' && b.dataset.liegt !== k.soll) lege(b, k.soll);
        const ok = b.dataset.liegt === k.soll;
        b.classList.toggle('richtig', ok);
        b.classList.toggle('falsch', !ok && b.dataset.liegt !== '');
        if (ok) richtig++;
        else if (b.dataset.liegt !== '') falsch.push(k);
      });
      geprueft = true;
      const offen = stapel.children.length;
      const alle = richtig === karten.length;
      rueck.className = `gr-rueckmeldung ${alle ? 'richtig' : 'falsch'}`;
      rueck.innerHTML = `<p class="gr-urteil">${alle ? '✓ Alles richtig zugeordnet.' : `${richtig} von ${karten.length} richtig.${offen ? ` ${offen} noch nicht zugeordnet.` : ''}`}</p>`
        + falsch.filter((k) => k.erklaerung).map((k) => `<p class="gr-erklaerung">${esc(k.erklaerung)}</p>`).join('')
        + (!alle && falsch.length ? '<p class="gr-erklaerung">Rot markierte Karten liegen noch in der falschen Spalte.</p>' : '');
      if (alle && erklaerungAllgemein) erklaerungAllgemein.hidden = false;
    }
  });

  // Ziehen und Ablegen für Maus und Touchpad
  ablage.addEventListener('dragstart', (e) => {
    const karte = e.target.closest('.sort-karte');
    if (!karte) return;
    e.dataTransfer.setData('text/plain', karte.dataset.nr);
    e.dataTransfer.effectAllowed = 'move';
  });
  ablage.addEventListener('dragover', (e) => { if (e.target.closest('[data-ziel]')) e.preventDefault(); });
  ablage.addEventListener('drop', (e) => {
    const spalte = e.target.closest('[data-ziel]');
    if (!spalte) return;
    e.preventDefault();
    const karte = ablage.querySelector(`.sort-karte[data-nr="${e.dataTransfer.getData('text/plain')}"]`);
    if (karte) lege(karte, spalte.dataset.ziel);
  });

  baue();
});

// ---------------------------------------------------------------- Reihenfolge

document.querySelectorAll('ol.reihenfolge').forEach((ol) => {
  const soll = [...ol.children].map((li, i) => ({ i, html: li.innerHTML }));
  const box = document.createElement('div');
  box.className = 'reihe-box werkzeug';
  box.innerHTML = `<p class="sort-hilfe">Bring die Karten mit den Pfeilen in die richtige Reihenfolge.</p><ol class="reihe-liste"></ol>
<div class="gr-rueckmeldung" aria-live="polite"></div>
<div class="gr-leiste"><button type="button" class="knopf primaer" data-aktion="pruefen">Prüfen</button><button type="button" class="knopf" data-aktion="loesung">Lösung zeigen</button><button type="button" class="knopf" data-aktion="neu">Neu mischen</button></div>`;
  ol.replaceWith(box);
  const liste = box.querySelector('.reihe-liste');
  const rueck = box.querySelector('.gr-rueckmeldung');

  function zeichne(reihe) {
    liste.innerHTML = reihe.map((k) => `<li data-nr="${k.i}"><span class="reihe-text">${k.html}</span>
<span class="reihe-pfeile"><button type="button" class="knopf" data-schiebe="-1" aria-label="nach oben">↑</button><button type="button" class="knopf" data-schiebe="1" aria-label="nach unten">↓</button></span></li>`).join('');
    rueck.className = 'gr-rueckmeldung';
    rueck.innerHTML = '';
  }

  box.addEventListener('click', (e) => {
    const schieb = e.target.closest('[data-schiebe]');
    if (schieb) {
      const li = schieb.closest('li');
      const r = Number(schieb.dataset.schiebe);
      const nachbar = r < 0 ? li.previousElementSibling : li.nextElementSibling;
      if (nachbar) {
        if (r < 0) nachbar.before(li); else nachbar.after(li);
        liste.querySelectorAll('li').forEach((x) => x.classList.remove('richtig', 'falsch'));
        schieb.focus();
      }
      return;
    }
    const aktion = e.target.closest('[data-aktion]')?.dataset.aktion;
    if (aktion === 'neu') zeichne(mische(soll));
    if (aktion === 'loesung') zeichne(soll);
    if (aktion === 'pruefen' || aktion === 'loesung') {
      let richtig = 0;
      [...liste.children].forEach((li, pos) => {
        const ok = Number(li.dataset.nr) === pos;
        li.classList.toggle('richtig', ok);
        li.classList.toggle('falsch', !ok);
        if (ok) richtig++;
      });
      const alle = richtig === soll.length;
      rueck.className = `gr-rueckmeldung ${alle ? 'richtig' : 'falsch'}`;
      rueck.innerHTML = `<p class="gr-urteil">${alle ? '✓ Die Reihenfolge stimmt.' : `${richtig} von ${soll.length} Karten stehen schon an der richtigen Stelle.`}</p>`;
    }
  });

  zeichne(mische(soll));
});

// ---------------------------------------------------------------- Meinungslinie

document.querySelectorAll('.position[data-id]').forEach((box) => {
  const id = box.dataset.id;
  const gespeichert = speicher.lies(`position:${id}`);
  const frueher = box.dataset.vergleich ? speicher.lies(`position:${box.dataset.vergleich}`) : '';
  const aussage = box.innerHTML;
  box.classList.add('werkzeug');
  box.innerHTML = `<div class="position-aussage">${aussage}</div>
<div class="position-regler">
<input type="range" min="0" max="10" step="1" value="${gespeichert || 5}" aria-label="Deine Position">
${frueher ? `<span class="position-frueher" style="--wert:${frueher}" title="deine Position am Anfang der Reihe"></span>` : ''}
</div>
<div class="position-pole"><span>${esc(box.dataset.links ?? 'stimme gar nicht zu')}</span><span>${esc(box.dataset.rechts ?? 'stimme voll zu')}</span></div>
<p class="position-stand klein"></p>`;
  const regler = box.querySelector('input');
  const stand = box.querySelector('.position-stand');
  const zeige = (gesetzt) => {
    stand.textContent = (gesetzt ? `Deine Position: ${regler.value} von 10.` : 'Schiebe den Regler auf deine Position.')
      + (frueher ? ` Der Strich zeigt deine Position vom Anfang der Reihe (${frueher}).` : '');
  };
  zeige(Boolean(gespeichert));
  regler.addEventListener('input', () => { speicher.schreib(`position:${id}`, regler.value); zeige(true); });
});
