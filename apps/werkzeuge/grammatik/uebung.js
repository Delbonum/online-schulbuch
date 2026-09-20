// Übungsmaschine für die Grammatik-Seiten: stellt Aufgaben, prüft die Antwort und erklärt sie.
//
// Aufgabentypen
//   wahl     { frage?, satz?, wort?, optionen?, richtig, erklaerung? }  eine Antwort anklicken
//   eingabe  { frage?, satz?, vor?, nach?, loesungen: [...], erklaerung? }  Antwort eintippen
//   felder   { satz, teile: [[Text, Feld], …], erklaerung? }  Felder des topologischen Modells
//   komma    { woerter: [...], kommas: [Index, …], erklaerung? }  Kommas in den Satz setzen
//   frei     { frage, muster, erklaerung? }  frei formulieren, dann selbst vergleichen
//
// Aufruf:  uebung('#id', { anweisung, optionen, aufgaben: [...] })

export const FELDER = [
  ['vf', 'Vorfeld'],
  ['lsk', 'linke Satzklammer'],
  ['mf', 'Mittelfeld'],
  ['rsk', 'rechte Satzklammer'],
  ['nf', 'Nachfeld'],
];

const FELDNAME = Object.fromEntries(FELDER);

export function mische(liste) {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const normiere = (s) => String(s)
  .toLowerCase()
  .replace(/ß/g, 'ss')
  .replace(/[„“”«»‚‘’'"]/g, '')
  .replace(/[.!?,;:…–-]/g, " ")
  .replace(/\s+/g, ' ')
  .trim();

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// In Aufgabentexten sind nur wenige Auszeichnungen erlaubt: <b>, <i>, <em>, <strong>.
const text = (s) => esc(s).replace(/&lt;(\/?)(b|i|em|strong)&gt;/g, '<$1$2>');

export function uebung(ziel, konfig) {
  const wurzel = typeof ziel === 'string' ? document.querySelector(ziel) : ziel;
  if (!wurzel) return;

  const alle = konfig.aufgaben;
  let reihe = [];
  let nr = 0;
  let richtigZahl = 0;
  let offen = true; // Aufgabe noch nicht beantwortet
  let fehlerListe = [];

  wurzel.innerHTML = `<div class="gr-uebung">
<div class="gr-kopf"><p class="gr-fortschritt"></p><p class="gr-punkte"></p></div>
<div class="gr-balken"><span style="width:0"></span></div>
<div class="gr-frage"></div>
<div class="gr-antwort"></div>
<div class="gr-rueckmeldung" aria-live="polite"></div>
<div class="gr-leiste"></div>
</div>`;

  const fortschritt = wurzel.querySelector('.gr-fortschritt');
  const punkte = wurzel.querySelector('.gr-punkte');
  const balken = wurzel.querySelector('.gr-balken span');
  const frageEl = wurzel.querySelector('.gr-frage');
  const antwortEl = wurzel.querySelector('.gr-antwort');
  const rueck = wurzel.querySelector('.gr-rueckmeldung');
  const leiste = wurzel.querySelector('.gr-leiste');

  function knopf(beschriftung, art, klick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = art === 'primaer' ? 'knopf primaer' : 'knopf';
    b.textContent = beschriftung;
    b.addEventListener('click', klick);
    leiste.append(b);
    return b;
  }

  function melde(ok, kurz, erklaerung) {
    rueck.className = `gr-rueckmeldung ${ok ? 'richtig' : 'falsch'}`;
    rueck.innerHTML = `<p class="gr-urteil">${ok ? '✓ Richtig.' : '✗ Leider nicht.'}${kurz ? ` ${text(kurz)}` : ''}</p>`
      + (erklaerung ? `<p class="gr-erklaerung">${text(erklaerung)}</p>` : '');
  }

  function bewerte(ok, aufgabe) {
    offen = false;
    if (ok) richtigZahl++;
    else fehlerListe.push(aufgabe);
    punkte.textContent = `${richtigZahl} von ${nr + 1} richtig`;
    leiste.innerHTML = '';
    knopf(nr + 1 < reihe.length ? 'Weiter' : 'Auswertung', 'primaer', naechste).focus();
  }

  // ---------------------------------------------------------------- Typen

  function baueWahl(a) {
    const optionen = mische(a.optionen ?? konfig.optionen ?? []);
    const box = document.createElement('div');
    box.className = 'gr-wahl';
    for (const o of optionen) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = o;
      b.addEventListener('click', () => {
        const ok = o === a.richtig;
        for (const andere of box.querySelectorAll('button')) {
          andere.disabled = true;
          if (andere.textContent === a.richtig) andere.classList.add('richtig');
        }
        if (!ok) b.classList.add('falsch');
        melde(ok, ok ? '' : `Richtig ist: ${a.richtig}.`, a.erklaerung);
        bewerte(ok, a);
      });
      box.append(b);
    }
    antwortEl.append(box);
    box.querySelector('button')?.focus();
  }

  function baueEingabe(a) {
    const form = document.createElement('form');
    form.className = 'gr-eingabe';
    form.innerHTML = `${a.vor ? `<span class="gr-vor">${text(a.vor)}</span>` : ''}
<input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Deine Antwort">
${a.nach ? `<span class="gr-nach">${text(a.nach)}</span>` : ''}`;
    const feld = form.querySelector('input');
    if (a.platzhalter) feld.placeholder = a.platzhalter;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!offen) return;
      const eingabe = normiere(feld.value);
      if (!eingabe) return;
      const ok = a.loesungen.some((l) => normiere(l) === eingabe);
      feld.disabled = true;
      pruefKnopf.remove();
      melde(ok, ok ? '' : `Richtig ist: ${a.loesungen[0]}.`,
        [a.loesungen.length > 1 ? `Ebenfalls richtig: ${a.loesungen.slice(1).join(', ')}.` : '', a.erklaerung].filter(Boolean).join(' '));
      bewerte(ok, a);
    });
    antwortEl.append(form);
    const pruefKnopf = knopf('Prüfen', 'primaer', () => form.requestSubmit());
    feld.focus();
  }

  function baueFelder(a) {
    const box = document.createElement('div');
    box.className = 'gr-felder';
    for (const [teil] of a.teile) {
      const zeile = document.createElement('div');
      zeile.className = 'gr-felder-zeile';
      zeile.innerHTML = `<span class="gr-felder-teil">${text(teil)}</span>
<select aria-label="Feld für „${esc(teil)}“"><option value="">… gehört ins …</option>${FELDER.map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select>`;
      box.append(zeile);
    }
    antwortEl.append(box);
    const auswahl = [...box.querySelectorAll('select')];
    const pruefKnopf = knopf('Prüfen', 'primaer', () => {
      if (!offen) return;
      let ok = true;
      auswahl.forEach((s, i) => {
        const soll = a.teile[i][1];
        const gut = s.value === soll;
        s.classList.add(gut ? 'richtig' : 'falsch');
        s.disabled = true;
        if (!gut) { ok = false; s.value = soll; }
      });
      pruefKnopf.remove();
      melde(ok, ok ? '' : 'Die richtige Zuordnung steht jetzt in den Feldern.', a.erklaerung);
      bewerte(ok, a);
    });
    auswahl[0]?.focus();
  }

  function baueKomma(a) {
    const box = document.createElement('div');
    box.className = 'gr-komma';
    const gesetzt = new Set();
    a.woerter.forEach((w, i) => {
      box.append(document.createTextNode(w));
      if (i < a.woerter.length - 1) {
        const l = document.createElement('button');
        l.type = 'button';
        l.className = 'gr-luecke';
        l.setAttribute('aria-label', `Komma nach „${w}“ setzen`);
        l.addEventListener('click', () => {
          if (!offen) return;
          if (gesetzt.has(i)) { gesetzt.delete(i); l.classList.remove('gesetzt'); }
          else { gesetzt.add(i); l.classList.add('gesetzt'); }
        });
        box.append(l);
        box.append(document.createTextNode(' '));
      } else {
        box.append(document.createTextNode(a.schluss ?? '.'));
      }
    });
    antwortEl.append(box);
    const luecken = [...box.querySelectorAll('.gr-luecke')];
    const soll = new Set(a.kommas);
    const pruefKnopf = knopf('Prüfen', 'primaer', () => {
      if (!offen) return;
      let ok = true;
      luecken.forEach((l, i) => {
        l.disabled = true;
        l.classList.remove('gesetzt');
        if (soll.has(i) && gesetzt.has(i)) l.classList.add('richtig');
        else if (soll.has(i)) { l.classList.add('fehlt'); ok = false; }
        else if (gesetzt.has(i)) { l.classList.add('falsch'); ok = false; }
      });
      pruefKnopf.remove();
      melde(ok, ok ? `${soll.size} ${soll.size === 1 ? 'Komma' : 'Kommas'} – alle richtig.`
        : 'Grün = richtig gesetzt, gestrichelt = hier fehlt ein Komma, durchgestrichen = hier gehört keines hin.', a.erklaerung);
      bewerte(ok, a);
    });
    luecken[0]?.focus();
  }

  function baueFrei(a) {
    const box = document.createElement('div');
    box.className = 'gr-frei';
    box.innerHTML = '<textarea aria-label="Deine Antwort" spellcheck="false"></textarea>';
    antwortEl.append(box);
    const feld = box.querySelector('textarea');
    const zeigen = knopf('Lösung vergleichen', 'primaer', () => {
      feld.disabled = true;
      zeigen.remove();
      rueck.className = 'gr-rueckmeldung';
      rueck.innerHTML = `<p><b>Mögliche Lösung:</b> ${text(a.muster)}</p>`
        + (a.erklaerung ? `<p class="gr-erklaerung">${text(a.erklaerung)}</p>` : '')
        + '<p class="gr-erklaerung">Vergleiche selbst und sage ehrlich, ob es gepasst hat.</p>';
      leiste.innerHTML = '';
      knopf('Hat gepasst', 'primaer', () => bewerteFrei(true, a));
      knopf('Noch nicht', '', () => bewerteFrei(false, a));
    });
    feld.focus();
  }

  function bewerteFrei(ok, a) {
    leiste.innerHTML = '';
    bewerte(ok, a);
  }

  // ---------------------------------------------------------------- Ablauf

  function zeige() {
    const a = reihe[nr];
    offen = true;
    fortschritt.textContent = `Aufgabe ${nr + 1} von ${reihe.length}`;
    punkte.textContent = `${richtigZahl} von ${nr} richtig`;
    balken.style.width = `${(nr / reihe.length) * 100}%`;
    rueck.className = 'gr-rueckmeldung';
    rueck.innerHTML = '';
    leiste.innerHTML = '';
    antwortEl.innerHTML = '';

    const anweisung = a.anweisung ?? konfig.anweisung;
    frageEl.innerHTML = [
      anweisung ? `<p class="gr-anweisung">${text(anweisung)}</p>` : '',
      a.frage ? `<p>${text(a.frage)}</p>` : '',
      a.wort ? `<p class="gr-wort">${text(a.wort)}</p>` : '',
      a.satz ? `<p class="gr-satz">${text(a.satz)}</p>` : '',
    ].filter(Boolean).join('');

    ({ wahl: baueWahl, eingabe: baueEingabe, felder: baueFelder, komma: baueKomma, frei: baueFrei }[a.typ ?? 'wahl'])(a);
  }

  function naechste() {
    nr++;
    if (nr < reihe.length) zeige();
    else bilanz();
  }

  function bilanz() {
    balken.style.width = '100%';
    fortschritt.textContent = 'Geschafft!';
    punkte.textContent = `${richtigZahl} von ${reihe.length} richtig`;
    frageEl.innerHTML = '';
    antwortEl.innerHTML = '';
    rueck.className = 'gr-rueckmeldung';
    const anteil = richtigZahl / reihe.length;
    const spruch = anteil === 1 ? 'Alles richtig – das sitzt!'
      : anteil >= 0.8 ? 'Sehr ordentlich. Schau dir die letzten Stolpersteine noch einmal an.'
      : anteil >= 0.5 ? 'Die Hälfte steht schon. Lies den Abschnitt oben noch einmal und übe weiter.'
      : 'Noch wackelig – geh den Text oben noch einmal durch und starte danach neu.';
    rueck.innerHTML = `<div class="gr-bilanz"><p class="gr-note">${richtigZahl} / ${reihe.length}</p><p>${spruch}</p>`
      + (fehlerListe.length ? `<ul>${fehlerListe.slice(0, 8).map((a) => `<li>${text(a.wort ?? a.satz ?? a.frage ?? (a.woerter ? a.woerter.join(' ') : ''))}</li>`).join('')}</ul>` : '')
      + '</div>';
    leiste.innerHTML = '';
    knopf('Noch einmal üben', 'primaer', start).focus();
  }

  function start() {
    reihe = konfig.mischen === false ? [...alle] : mische(alle);
    if (konfig.anzahl && konfig.anzahl < reihe.length) reihe = reihe.slice(0, konfig.anzahl);
    nr = 0;
    richtigZahl = 0;
    fehlerListe = [];
    zeige();
  }

  start();
}

export { FELDNAME };
