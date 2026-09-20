// Die Wortmurmelbahn: Wort oben einwerfen, sieben Weichen – unten fällt die Wortart heraus.
//
// Aufruf:  murmelbahn('#id', WOERTER)   mit WOERTER = [{ wort, art, hinweise?, beispiel? }, …]

import { mische } from './uebung.js';

// Jede Weiche hat eine Frage und zwei Ausgänge. Ein Ausgang führt entweder zur nächsten
// Weiche oder direkt zu einer Wortart.
export const BAUM = {
  id: 'flektierbar',
  frage: 'Lässt sich das Wort flektieren, also beugen (in seiner Form verändern)?',
  hilfe: 'Probe: gehen – ich gehe – ging; Tisch – des Tisches – Tische; schön – schöner. Wörter wie „und“, „sehr“ oder „in“ verändern sich nie.',
  ja: {
    kurz: 'flektierbar',
    standard: '„{w}“ lässt sich beugen.',
    weiter: {
      id: 'konjugierbar',
      frage: 'Lässt sich das Wort konjugieren, also nach Person, Numerus und Tempus beugen?',
      hilfe: 'Probe: ich …, du …, sie … / gestern …. Wenn das geht, ist es ein Verb. Sonst lässt es sich nur deklinieren (nach Kasus, Numerus und Genus beugen).',
      ja: { kurz: 'konjugierbar', standard: '„{w}“ lässt sich konjugieren: ich …, du …, sie ….', wortart: 'Verb' },
      nein: {
        kurz: 'nur deklinierbar',
        standard: '„{w}“ lässt sich nicht konjugieren, sondern nur deklinieren.',
        weiter: {
          id: 'komparierbar',
          frage: 'Ist das Wort komparierbar (steigerbar) und kann es zwischen Artikel und Nomen stehen?',
          hilfe: 'Probe: schnell – schneller – am schnellsten; der schnelle Zug. Beides muss passen.',
          ja: { kurz: 'komparierbar, steht zwischen Artikel und Nomen', standard: '„{w}“ lässt sich steigern und passt zwischen Artikel und Nomen.', wortart: 'Adjektiv' },
          nein: {
            kurz: 'nicht komparierbar',
            standard: '„{w}“ lässt sich nicht steigern.',
            weiter: {
              id: 'artikelfaehig',
              frage: 'Ist das Wort artikelfähig – kann also ein Artikel davorstehen?',
              hilfe: 'Probe: der/die/das …? Nomen sind artikelfähig. Artikel und Pronomen sind es nicht, sie stehen ja selbst an dieser Stelle.',
              ja: { kurz: 'artikelfähig', standard: 'Vor „{w}“ kann ein Artikel stehen: der/die/das {w}.', wortart: 'Nomen' },
              nein: { kurz: 'nicht artikelfähig', standard: 'Vor „{w}“ kann kein Artikel stehen – das Wort begleitet oder vertritt selbst ein Nomen.', wortart: 'Artikel/Pronomen' },
            },
          },
        },
      },
    },
  },
  nein: {
    kurz: 'nicht flektierbar',
    standard: '„{w}“ verändert seine Form nie.',
    weiter: {
      id: 'vorfeldfaehig',
      frage: 'Ist das Wort vorfeldfähig – kann es also allein vor dem finiten Verb stehen?',
      hilfe: 'Probe: Stell das Wort allein an den Satzanfang, direkt vor die gebeugte Verbform: „Heute kommt sie.“ Das geht mit Adverbien, aber nicht mit „und“, „sehr“ oder „auf“.',
      ja: { kurz: 'vorfeldfähig', standard: '„{w}“ kann allein im Vorfeld stehen: „{w} kommt sie.“', wortart: 'Adverb' },
      nein: {
        kurz: 'nicht vorfeldfähig',
        standard: '„{w}“ kann nicht allein vor dem finiten Verb stehen.',
        weiter: {
          id: 'kasusforderung',
          frage: 'Fordert das Wort einen bestimmten Kasus?',
          hilfe: 'Probe: Steht nach dem Wort zwingend ein bestimmter Fall? „mit dem Auto“ (Dativ), „ohne den Schlüssel“ (Akkusativ), „wegen des Regens“ (Genitiv).',
          ja: { kurz: 'fordert einen Kasus', standard: 'Nach „{w}“ steht ein bestimmter Fall.', wortart: 'Präposition' },
          nein: {
            kurz: 'keine Kasusforderung',
            standard: '„{w}“ verlangt keinen bestimmten Fall.',
            weiter: {
              id: 'verknuepfung',
              frage: 'Verknüpft das Wort Sätze oder Satzteile miteinander?',
              hilfe: 'Probe: Verbindet es zwei Teile („Brot und Butter“) oder leitet es einen Nebensatz ein („…, weil …“)? Dann ist es eine Konjunktion. Sonst färbt es die Aussage nur – das ist eine Partikel.',
              ja: { kurz: 'verknüpft', standard: '„{w}“ verbindet Satzteile oder Sätze.', wortart: 'Konjunktion' },
              nein: { kurz: 'verknüpft nichts', standard: '„{w}“ verbindet nichts – es verstärkt, schwächt ab oder färbt die Aussage.', wortart: 'Partikel' },
            },
          },
        },
      },
    },
  },
};

// Welche Wortarten liegen hinter einem Ausgang?
function wortarten(ausgang) {
  if (ausgang.wortart) return [ausgang.wortart];
  return [...wortarten(ausgang.weiter.ja), ...wortarten(ausgang.weiter.nein)];
}

export function murmelbahn(ziel, woerter) {
  const wurzel = typeof ziel === 'string' ? document.querySelector(ziel) : ziel;
  if (!wurzel) return;

  let vorrat = [];
  let aktuell = null;
  let knoten = BAUM;
  let schritt = 0;
  let patzer = 0;
  let geloest = 0;
  let gespielt = 0;

  wurzel.innerHTML = `<div class="gr-uebung">
<div class="gr-kopf"><p class="gr-fortschritt"></p><p class="gr-punkte"></p></div>
<div class="wm-wort"></div>
<div class="gr-frage"></div>
<div class="gr-antwort"></div>
<div class="gr-rueckmeldung" aria-live="polite"></div>
<ol class="wm-weg"></ol>
<div class="gr-leiste"></div>
</div>`;

  const kopfLinks = wurzel.querySelector('.gr-fortschritt');
  const kopfRechts = wurzel.querySelector('.gr-punkte');
  const wortEl = wurzel.querySelector('.wm-wort');
  const frageEl = wurzel.querySelector('.gr-frage');
  const antwortEl = wurzel.querySelector('.gr-antwort');
  const rueck = wurzel.querySelector('.gr-rueckmeldung');
  const wegEl = wurzel.querySelector('.wm-weg');
  const leiste = wurzel.querySelector('.gr-leiste');

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function knopf(beschriftung, art, klick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = art === 'primaer' ? 'knopf primaer' : 'knopf';
    b.textContent = beschriftung;
    b.addEventListener('click', klick);
    leiste.append(b);
    return b;
  }

  function neuesWort() {
    if (!vorrat.length) vorrat = mische(woerter);
    aktuell = vorrat.pop();
    knoten = BAUM;
    schritt = 0;
    patzer = 0;
    wegEl.innerHTML = '';
    rueck.className = 'gr-rueckmeldung';
    rueck.innerHTML = '';
    leiste.innerHTML = '';
    wortEl.innerHTML = `<span class="gr-wort">${esc(aktuell.wort)}</span><p>Wirf dieses Wort oben in die Bahn.</p>`;
    
    kopfRechts.textContent = gespielt ? `${geloest} von ${gespielt} Wörtern ohne Fehler` : '';
    frage();
  }

  function frage() {
    kopfLinks.textContent = `Weiche ${schritt + 1}`;
    frageEl.innerHTML = `<p class="wm-frage">${esc(knoten.frage)}</p><p class="wm-hilfe">${esc(knoten.hilfe)}</p>`;
    antwortEl.innerHTML = '<div class="wm-knoepfe"></div>';
    const box = antwortEl.firstElementChild;
    for (const [wert, beschriftung] of [['ja', 'Ja'], ['nein', 'Nein']]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'knopf';
      b.textContent = beschriftung;
      b.addEventListener('click', () => antworte(wert));
      box.append(b);
    }
    box.firstElementChild.focus();
  }

  function antworte(wahl) {
    const richtigerWeg = wortarten(knoten.ja).includes(aktuell.art) ? 'ja' : 'nein';
    const ok = wahl === richtigerWeg;
    const ausgang = knoten[richtigerWeg];
    const hinweis = (aktuell.hinweise?.[schritt] ?? ausgang.standard).replace(/\{w\}/g, aktuell.wort);
    if (!ok) patzer++;
    wegEl.insertAdjacentHTML('beforeend',
      `<li>${ok ? '' : '<b>Nicht ganz:</b> '}<b>${esc(ausgang.kurz)}</b> – ${esc(hinweis)}</li>`);
    if (ausgang.wortart) return ziel_(ausgang.wortart);
    knoten = ausgang.weiter;
    schritt++;
    frage();
  }

  function ziel_(wortart) {
    gespielt++;
    if (!patzer) geloest++;
    frageEl.innerHTML = '';
    antwortEl.innerHTML = '';
    rueck.className = `gr-rueckmeldung ${patzer ? 'falsch' : 'richtig'}`;
    rueck.innerHTML = `<p class="wm-ziel">Die Murmel landet bei: ${esc(wortart)}</p>`
      + `<p class="gr-urteil">${patzer ? `Du hast ${patzer} Weiche${patzer === 1 ? '' : 'n'} falsch gestellt – der Weg oben zeigt, wie es richtig läuft.` : 'Alle Weichen richtig gestellt.'}</p>`
      + (aktuell.beispiel ? `<p class="gr-erklaerung">${esc(aktuell.beispiel)}</p>` : '');
    kopfRechts.textContent = `${geloest} von ${gespielt} Wörtern ohne Fehler`;
    leiste.innerHTML = '';
    knopf('Nächstes Wort', 'primaer', neuesWort).focus();
  }

  neuesWort();
}
