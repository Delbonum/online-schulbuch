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
//   <ul class="abhaken" data-id="id"> <li>…</li> … </ul>
//       Liste zum Abhaken (z. B. Leseplan). Gespeichert wird, welche Einträge erledigt sind.
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

// Unveränderte Fassung des Inhalts, bevor die Bausteine interaktiv werden – Grundlage für das
// Arbeitsblatt zum Ausdrucken (siehe unten „Arbeitsblatt für Lehrkräfte“).
const inhaltsBereich = document.querySelector('.haupt .text, .haupt .breit-inhalt');
const urfassung = inhaltsBereich?.cloneNode(true);

// ---------------------------------------------------------------- Antwortfelder

function hoehe(feld) {
  // Unsichtbare Felder (z. B. in zugeklappten Kästen) haben noch keine Höhe – dort gelten die rows.
  if (feld.tagName !== 'TEXTAREA' || !feld.getClientRects().length) return;
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
document.addEventListener('toggle', (e) => e.target.querySelectorAll?.('.notiz').forEach(hoehe), true);

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

// Name für gesicherte Dateien und PDFs: Nummer der Seite in ihrem Kapitel (letzte Stelle des Kurzlinks)
// vor dem Fenstertitel, z. B. „06 - Szenenwerkstatt – Deutsch – Online-Schulbuch“.
function dateiname() {
  const nr = document.querySelector('.kurzlink a')?.textContent.match(/(\d+)\s*$/)?.[1];
  return nr ? `${nr.padStart(2, '0')} - ${document.title}` : document.title;
}

// Leiste unter dem Inhalt: Antworten sichern (nur mit Antwortfeldern) und – nach der Anmeldung als
// Lehrkraft – das Arbeitsblatt zum Ausdrucken. Ohne Antwortfelder sehen Schüler:innen die Leiste nicht.
{
  const leiste = document.querySelector('.ab-leiste') ?? (() => {
    const neu = document.createElement('div');
    neu.className = 'ab-leiste';
    (inhaltsBereich ?? document.querySelector('main')).append(neu);
    return neu;
  })();
  leiste.classList.toggle('nur-lehrkraft', !notizen.length);
  leiste.innerHTML = `${notizen.length ? `<div class="ab-schueler"><p class="ab-leiste-titel">Deine Antworten auf dieser Seite</p>
<p>Alles, was du in die Felder schreibst, bleibt nur in diesem Browser auf diesem Gerät gespeichert – niemand sonst kann es sehen.
Sichere deine Antworten als Datei, wenn du sie abgeben oder auf einem anderen Gerät weiterarbeiten willst.</p>
<p class="ab-knoepfe"><button type="button" class="knopf primaer" data-ab="datei">Als Textdatei sichern</button>
<button type="button" class="knopf" data-ab="drucken">Drucken / als PDF</button>
<button type="button" class="knopf" data-ab="loeschen">Antworten dieser Seite löschen</button></p>
<p class="ab-tipp">Tipp: Wähle im Druckfenster als Ziel <strong>„Als PDF speichern“</strong>. Bei anderen PDF-Druckern (z. B. „Adobe PDF“) lässt sich der Text im PDF oft nicht mehr markieren und kopieren.</p></div>` : ''}
<div class="ab-lehrkraft"><p class="ab-leiste-titel">Für Lehrkräfte: Arbeitsblatt zum Ausdrucken</p>
<p>Die Seite als Arbeitsblatt für die analoge Bearbeitung: Antwortfelder als Schreiblinien, Übungen als Papierfassung, ohne eingetragene Antworten.</p>
<p class="ab-knoepfe"><button type="button" class="knopf primaer" data-ab="blatt">Arbeitsblatt drucken / als PDF</button>
<button type="button" class="knopf" data-ab="blatt-loesung">mit Lösungen</button></p></div>`;

  leiste.addEventListener('click', (e) => {
    const art = e.target.closest('[data-ab]')?.dataset.ab;
    if (art === 'drucken') drucke('ab-druck', antwortblatt());
    if (art === 'blatt' || art === 'blatt-loesung') drucke('ab-blatt', analogesBlatt(art === 'blatt-loesung'));
    if (art === 'loeschen' && confirm('Alle Antworten auf dieser Seite löschen? Das lässt sich nicht rückgängig machen.')) {
      for (const feld of notizen) { feld.value = ''; speicher.schreib(feld.dataset.notiz, ''); hoehe(feld); }
      abhakenLeeren();
    }
    if (art === 'datei') {
      const titel = document.querySelector('.seitenkopf h1')?.textContent.trim() ?? document.title;
      const datum = new Date().toLocaleDateString('de-DE');
      const teile = [`${titel}`, `Online-Schulbuch · ${location.href} · ${datum}`, ''];
      for (const feld of notizen) teile.push(`## ${beschriftung(feld)}`, feld.value.trim() || '(noch nichts eingetragen)', '');
      const blob = new Blob([teile.join('\n')], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${dateiname().replace(/[\\/:*?"<>|]+/g, '').trim()}.txt`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
  });
}

// ---------------------------------------------------------------- Antworten drucken
// „Drucken / als PDF“ druckt nicht die ganze Seite, sondern ein kurzes Antwortblatt:
// Aufgaben (mit Abschnittsüberschrift) und darunter die eigenen Antworten. Strg+P druckt weiter die Seite.

const ohneFelder = (el) => {
  const kopie = el.cloneNode(true);
  kopie.querySelectorAll('.notiz, textarea, input, select, button, .abhaken-stand').forEach((x) => x.remove());
  return kopie.innerHTML.trim();
};

// Aufgabentext zu einem Feld: der Listenpunkt der Aufgabe, die Tabellenzeile oder der Absatz davor
function aufgabeZu(feld) {
  const li = feld.closest('li');
  if (li && li.parentElement?.tagName === 'OL') {
    const nr = Number(li.parentElement.getAttribute('start') ?? 1) + [...li.parentElement.children].indexOf(li);
    return { titel: '', text: `<span class="ab-nr">${nr}.</span> ${ohneFelder(li)}` };
  }
  const zeile = feld.closest('tr');
  if (zeile) {
    const zellen = [...zeile.cells].filter((z) => !z.contains(feld)).map((z) => z.textContent.trim()).filter(Boolean);
    return { titel: beschriftung(feld), text: esc(zellen.join(' · ')) };
  }
  const davor = feld.previousElementSibling;
  const text = davor?.tagName === 'P' && !davor.querySelector('label') ? ohneFelder(davor) : '';
  return { titel: beschriftung(feld), text };
}

function antwortblatt() {
  const inhalt = document.querySelector('.haupt .text, .haupt .breit-inhalt') ?? document.querySelector('main');
  const ueberschriften = [...inhalt.querySelectorAll('h2')];
  const abschnitt = (el) => ueberschriften.filter((h) => h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).pop();
  const titel = document.querySelector('.seitenkopf h1')?.textContent.trim() ?? document.title;
  const ort = [...document.querySelectorAll('.brotkrumen li')].map((li) => li.textContent.trim()).slice(1, -1).join(' › ');
  const teile = [`<h1>${esc(titel)}</h1>`,
    `<p class="ab-druck-meta">${ort ? `${esc(ort)} · ` : ''}Online-Schulbuch · ${new Date().toLocaleDateString('de-DE')}</p>`,
    '<p class="ab-druck-name">Name: <span></span></p>'];
  let letzter = null;
  for (const el of inhalt.querySelectorAll('.notiz[data-notiz], .position[data-id], ul.abhaken[data-id]')) {
    const h2 = abschnitt(el);
    if (h2 && h2 !== letzter) { teile.push(`<h2>${esc(h2.textContent.trim())}</h2>`); letzter = h2; }
    if (el.matches('.notiz')) {
      const { titel: t, text } = aufgabeZu(el);
      const wert = el.value.trim();
      // Kurze Eingabefelder (Termine, Rollen …) passen in eine Zeile
      if (el.tagName === 'INPUT') {
        teile.push(`<p class="ab-druck-kurz">${text || `<b>${esc(t.replace(/:\s*$/, ''))}</b>`}: ${wert ? `<span class="ab-druck-wert">${esc(wert)}</span>` : '<span class="leer">—</span>'}</p>`);
        continue;
      }
      const zeigeTitel = t && !text.includes(esc(t)) && t !== h2?.textContent.trim();
      teile.push(`<div class="ab-druck-aufgabe">${zeigeTitel ? `<p class="ab-druck-titel">${esc(t)}</p>` : ''}${text ? `<div class="ab-druck-text">${text}</div>` : ''}
<div class="ab-druck-antwort${wert ? '' : ' leer'}">${wert ? esc(wert) : '(noch nichts eingetragen)'}</div></div>`);
    } else if (el.matches('.position')) {
      const wert = speicher.lies(`position:${el.dataset.id}`);
      teile.push(`<div class="ab-druck-aufgabe"><p class="ab-druck-titel">Meinungslinie</p><div class="ab-druck-text">${ohneFelder(el.querySelector('.position-aussage') ?? el)}</div>
<div class="ab-druck-antwort${wert ? '' : ' leer'}">${wert ? `Meine Position: ${esc(wert)} von 10 (0 = ${esc(el.dataset.links ?? 'stimme gar nicht zu')}, 10 = ${esc(el.dataset.rechts ?? 'stimme voll zu')})` : '(noch keine Position gewählt)'}</div></div>`);
    } else {
      teile.push(`<ul class="ab-druck-liste">${[...el.children].map((li) => `<li>${li.classList.contains('erledigt') ? '☑' : '☐'} ${ohneFelder(li.querySelector('span') ?? li)}</li>`).join('')}</ul>`);
    }
  }
  return teile.join('\n');
}

// Druckt nur das übergebene Blatt; der Rest der Seite ist beim Drucken ausgeblendet.
function drucke(klasse, html) {
  const blatt = document.createElement('div');
  blatt.className = `${klasse} ab-druckziel`;
  blatt.innerHTML = html;
  document.body.append(blatt);
  document.documentElement.classList.add('ab-drucken');
  // Der Fenstertitel ist im Druckfenster der vorgeschlagene Dateiname für das PDF.
  const fenstertitel = document.title;
  document.title = dateiname();
  const weg = () => { blatt.remove(); document.documentElement.classList.remove('ab-drucken'); document.title = fenstertitel; };
  window.addEventListener('afterprint', weg, { once: true });
  window.print();
}

// ---------------------------------------------------------------- Arbeitsblatt für Lehrkräfte
// Papierfassung der Seite aus der unveränderten Urfassung: Antwortfelder werden Schreiblinien,
// Quiz/Sortieren/Reihenfolge/Meinungslinie werden zu Aufgaben auf Papier. „Mit Lösungen“ setzt die
// Lösungen ein und übernimmt die (bereits entschlüsselten) Kästen für Lehrkräfte.

const el = (tag, klasse, html = '') => {
  const e = document.createElement(tag);
  if (klasse) e.className = klasse;
  e.innerHTML = html;
  return e;
};
const linien = (n) => el('div', 'ab-linien', '<span></span>'.repeat(n));
const buchstabe = (i) => String.fromCharCode(97 + i);

// Immer gleich gemischt (Startwert aus dem Text), damit Blatt und Lösungsfassung zusammenpassen
function festGemischt(liste, text) {
  let z = [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) {
    z = (z * 1664525 + 1013904223) >>> 0;
    const j = z % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function analogesBlatt(mitLoesung) {
  const k = urfassung.cloneNode(true);
  k.querySelectorAll('.ab-leiste, .einbettung, script').forEach((x) => x.remove());

  const live = [...inhaltsBereich.querySelectorAll('.box.lehrkraft')];
  k.querySelectorAll('.box.lehrkraft').forEach((box, i) => {
    if (mitLoesung && live[i] && !live[i].classList.contains('gesperrt')) box.replaceWith(live[i].cloneNode(true));
    else box.remove();
  });

  // Aufklappbare Kästen: mit Antwortfeldern (z. B. Tagebucheinträge) oder mit Lösungen offen, sonst weg
  k.querySelectorAll('details').forEach((d) => {
    if (!mitLoesung && !d.querySelector('.notiz')) { d.remove(); return; }
    const div = el('div', 'ab-blatt-aufklapp');
    const s = d.querySelector(':scope > summary');
    if (s) { div.append(el('p', 'ab-blatt-summary', s.innerHTML)); s.remove(); }
    div.append(...d.childNodes);
    d.replaceWith(div);
  });

  k.querySelectorAll('textarea.notiz').forEach((f) => f.replaceWith(linien(Math.max(Number(f.getAttribute('rows')) || 3, 3))));
  k.querySelectorAll('input.notiz').forEach((f) => f.replaceWith(el('span', 'ab-linie-kurz')));
  k.querySelectorAll('.notiz-rueckblick').forEach((f) => f.replaceWith(linien(2)));

  k.querySelectorAll('.quiz').forEach((q) => {
    const fragen = [...q.querySelectorAll('.frage')].map((f) => {
      const optionen = festGemischt([...f.querySelectorAll('li')], f.textContent).map((o) => {
        const richtig = mitLoesung && o.hasAttribute('data-richtig');
        return `<li${richtig ? ' class="richtig"' : ''}><span class="ab-kreuz">${richtig ? '✕' : ''}</span>${o.innerHTML}</li>`;
      }).join('');
      const erkl = mitLoesung && f.dataset.erklaerung ? `<p class="ab-blatt-erklaerung">${esc(f.dataset.erklaerung)}</p>` : '';
      return `<li><p>${(f.querySelector('p') ?? f).innerHTML}</p><ul class="ab-optionen">${optionen}</ul>${erkl}</li>`;
    });
    const anw = q.dataset.anweisung ? `<p><strong>${esc(q.dataset.anweisung)}</strong></p>` : '<p><strong>Kreuze die richtige Antwort an.</strong></p>';
    q.replaceWith(el('div', 'ab-blatt-quiz', `${anw}<ol>${fragen.join('')}</ol>`));
  });

  k.querySelectorAll('.sortieren[data-kategorien]').forEach((box) => {
    const kategorien = box.dataset.kategorien.split('|').map((x) => x.trim());
    const karten = festGemischt([...box.querySelectorAll('ul > li')], box.textContent);
    const kopf = `<tr>${kategorien.map((x) => `<th>${esc(x)}</th>`).join('')}</tr>`;
    let html;
    if (mitLoesung) {
      html = `<table class="ab-blatt-tabelle">${kopf}<tr>${kategorien.map((x) => `<td><ul>${karten.map((c, i) => (c.dataset.gehoert === x ? `<li><b>${buchstabe(i)})</b> ${c.innerHTML}</li>` : '')).join('')}</ul></td>`).join('')}</tr></table>`;
    } else {
      html = `<p><strong>Ordne zu:</strong> Schreibe die Buchstaben in die passende Spalte.</p>
<ol class="ab-karten">${karten.map((c, i) => `<li><b>${buchstabe(i)})</b> ${c.innerHTML}</li>`).join('')}</ol>
<table class="ab-blatt-tabelle">${kopf}<tr>${kategorien.map(() => '<td class="leer"></td>').join('')}</tr></table>`;
    }
    box.querySelector('ul')?.replaceWith(el('div', 'ab-blatt-sortieren', html));
    if (!mitLoesung) box.querySelector('.sortieren-erklaerung')?.remove();
  });

  k.querySelectorAll('ol.reihenfolge').forEach((ol) => {
    const eintraege = [...ol.children].map((li, i) => ({ i, html: li.innerHTML }));
    const liste = festGemischt(eintraege, ol.textContent);
    ol.replaceWith(el('div', 'ab-blatt-reihe', `<p><strong>Bringe in die richtige Reihenfolge:</strong> Nummeriere die Kästchen.</p>
<ul>${liste.map((x) => `<li><span class="ab-kasten">${mitLoesung ? x.i + 1 : ''}</span>${x.html}</li>`).join('')}</ul>`));
  });

  k.querySelectorAll('.position').forEach((p) => {
    const skala = Array.from({ length: 11 }, (_, i) => `<li><span class="ab-kreis"></span>${i}</li>`).join('');
    p.replaceWith(el('div', 'ab-blatt-position', `<div class="ab-blatt-aussage">${p.innerHTML}</div>
<p class="klein">Kreuze an, wie sehr du zustimmst.</p><ol class="ab-skala">${skala}</ol>
<div class="ab-pole"><span>${esc(p.dataset.links ?? 'stimme gar nicht zu')}</span><span>${esc(p.dataset.rechts ?? 'stimme voll zu')}</span></div>`));
  });

  k.querySelectorAll('ul.abhaken').forEach((ul) => {
    ul.className = 'ab-blatt-abhaken';
    ul.querySelectorAll(':scope > li').forEach((li) => li.prepend(el('span', 'ab-kasten')));
  });

  // ids eindeutig machen (die Originale stehen ja noch auf der Seite), sonst finden SVG-Pfeilspitzen
  // ihre Marker nicht
  const inhalt = k.innerHTML
    .replace(/\bid="([^"]+)"/g, 'id="blatt-$1"')
    .replace(/url\(#([^)]+)\)/g, 'url(#blatt-$1)')
    .replace(/(aria-labelledby|aria-describedby|for)="([^"]+)"/g, (m, a, v) => `${a}="${v.split(/\s+/).map((x) => `blatt-${x}`).join(' ')}"`);
  const kopf = document.querySelector('.seitenkopf')?.outerHTML ?? '';
  const titel = mitLoesung ? '<p class="ab-blatt-loesung">Lösungsfassung für Lehrkräfte</p>' : '';
  return `${titel}${kopf}
<p class="ab-blatt-name"><span>Name:</span><span>Klasse:</span><span>Datum:</span></p>
<div class="text">${inhalt}</div>
<p class="ab-blatt-fuss">Online-Schulbuch · online-schulbuch.de · CC BY-NC-SA 4.0</p>`;
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
  box.innerHTML = `<p class="sort-hilfe">Bring die Karten in die richtige Reihenfolge: mit den Pfeilen oder durch Ziehen (auf dem Handy: Karte kurz gedrückt halten, dann schieben).</p><ol class="reihe-liste"></ol>
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

  // Ziehen und Ablegen mit Zeigerereignissen, damit es auch auf Touch-Geräten geht: Die Maus zieht sofort,
  // der Finger erst nach kurzem Gedrückthalten (sonst würde man beim Wischen die Seite nicht mehr scrollen
  // können). Die Karte wandert schon beim Ziehen an ihren neuen Platz und rastet beim Loslassen ein.
  let gezogen = null;
  let start = null;
  let warte = null;
  const beende = () => {
    clearTimeout(warte);
    gezogen?.classList.remove('zieht');
    liste.classList.remove('beim-ziehen');
    gezogen = null;
    start = null;
  };
  const greife = () => {
    gezogen = start.li;
    gezogen.classList.add('zieht');
    liste.classList.add('beim-ziehen');
    liste.querySelectorAll('li').forEach((x) => x.classList.remove('richtig', 'falsch'));
    navigator.vibrate?.(15);
  };
  liste.addEventListener('pointerdown', (e) => {
    const li = e.target.closest('li');
    if (!li || e.button !== 0 || e.target.closest('button')) return;
    start = { li, x: e.clientX, y: e.clientY, maus: e.pointerType === 'mouse' };
    if (!start.maus) warte = setTimeout(greife, 350);
  });
  liste.addEventListener('pointermove', (e) => {
    if (!start) return;
    if (!gezogen) {
      const weit = Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6;
      if (weit && start.maus) { greife(); liste.setPointerCapture(e.pointerId); }
      else if (weit) { beende(); return; } // Finger hat sich vor dem Gedrückthalten bewegt: Scrollen
      else return;
    }
    e.preventDefault();
    const ziel = [...liste.children].find((x) => x !== gezogen && e.clientY < x.getBoundingClientRect().top + x.offsetHeight / 2);
    if (ziel) { if (ziel.previousElementSibling !== gezogen) ziel.before(gezogen); }
    else if (liste.lastElementChild !== gezogen) liste.append(gezogen);
  });
  liste.addEventListener('pointerup', beende);
  liste.addEventListener('pointercancel', beende);
  // Während des Ziehens darf der Finger die Seite nicht scrollen; das Kontextmenü beim Gedrückthalten bleibt aus.
  liste.addEventListener('touchmove', (e) => { if (gezogen) e.preventDefault(); }, { passive: false });
  liste.addEventListener('contextmenu', (e) => { if (start) e.preventDefault(); });

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

// ---------------------------------------------------------------- Abhaken (Leseplan o. Ä.)

function abhakenLeeren() {
  document.querySelectorAll('ul.abhaken[data-id] input[type="checkbox"]').forEach((box) => {
    if (box.checked) { box.checked = false; box.dispatchEvent(new Event('change')); }
  });
}

document.querySelectorAll('ul.abhaken[data-id]').forEach((liste) => {
  const id = `abhaken:${liste.dataset.id}`;
  const erledigt = new Set(speicher.lies(id).split(',').filter(Boolean));
  const eintraege = [...liste.children];
  const stand = document.createElement('p');
  stand.className = 'abhaken-stand';
  liste.after(stand);
  const zeige = () => {
    const n = eintraege.filter((li) => li.classList.contains('erledigt')).length;
    stand.textContent = `${n} von ${eintraege.length} erledigt`;
  };
  eintraege.forEach((li, i) => {
    li.innerHTML = `<label><input type="checkbox"${erledigt.has(String(i)) ? ' checked' : ''}><span>${li.innerHTML}</span></label>`;
    li.classList.toggle('erledigt', erledigt.has(String(i)));
    li.querySelector('input').addEventListener('change', (e) => {
      li.classList.toggle('erledigt', e.target.checked);
      if (e.target.checked) erledigt.add(String(i)); else erledigt.delete(String(i));
      speicher.schreib(id, [...erledigt].sort((a, b) => a - b).join(','));
      zeige();
    });
  });
  zeige();
});
