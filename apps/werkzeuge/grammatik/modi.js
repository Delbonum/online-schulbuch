// Übung: Indikativ, Imperativ oder Konjunktiv?

import { uebung } from './uebung.js';

const MODI = ['Indikativ', 'Imperativ', 'Konjunktiv I', 'Konjunktiv II'];

const modus = (satz, richtig, erklaerung) => ({
  anweisung: 'In welchem Modus steht die fett gedruckte Verbform?',
  satz,
  optionen: MODI,
  richtig,
  erklaerung,
});

uebung('#uebung', {
  aufgaben: [
    modus('Der Bus <b>fährt</b> um sieben Uhr ab.', 'Indikativ', 'Eine ganz normale Aussage über die Wirklichkeit.'),
    modus('<b>Schließ</b> bitte das Fenster!', 'Imperativ', 'Aufforderung an „du“: Verbstamm ohne Endung, Verb ganz vorn.'),
    modus('Er behauptet, er <b>habe</b> nichts davon gewusst.', 'Konjunktiv I', 'Indirekte Rede. Im Indikativ hieße es „er hat“.'),
    modus('Wenn ich mehr Zeit <b>hätte</b>, würde ich mitkommen.', 'Konjunktiv II', 'Eine irreale Bedingung – die Zeit fehlt ja gerade.'),
    modus('<b>Nehmen Sie</b> bitte Platz.', 'Imperativ', 'Höflichkeitsform des Imperativs: Infinitiv + „Sie“.'),
    modus('Sie <b>wusste</b> die Antwort nicht.', 'Indikativ', 'Präteritum im Indikativ.'),
    modus('Die Zeitung meldet, der Verkehr <b>sei</b> zusammengebrochen.', 'Konjunktiv I', 'Typische indirekte Rede in einem Bericht.'),
    modus('An deiner Stelle <b>würde</b> ich noch warten.', 'Konjunktiv II', 'Die würde-Form ersetzt hier den Konjunktiv II von „warten“.'),
    modus('<b>Geht</b> jetzt nach Hause!', 'Imperativ', 'Aufforderung an „ihr“ – erkennbar daran, dass kein Subjekt dasteht.'),
    modus('Ihr <b>geht</b> jetzt nach Hause.', 'Indikativ', 'Mit Subjekt „ihr“ ist es eine normale Aussage.'),
    modus('Er tut so, als <b>wäre</b> nichts geschehen.', 'Konjunktiv II', 'Irrealer Vergleich mit „als ob“ – immer Konjunktiv II.'),
    modus('Man <b>nehme</b> zwei Eier und etwas Mehl.', 'Konjunktiv I', 'Der alte Rezept- und Anweisungskonjunktiv. Formal ist es Konjunktiv I.'),
    modus('<b>Lies</b> den Text noch einmal genau.', 'Imperativ', 'Starkes Verb mit e→i-Wechsel: „lies“, nicht „lese“.'),
    modus('Ich <b>komme</b> gleich.', 'Indikativ', 'Normale Präsensform.'),
    modus('Er sagte, er <b>komme</b> gleich.', 'Konjunktiv I', 'Dieselbe Form, aber in indirekter Rede – hier ist es Konjunktiv I.'),
    modus('<b>Könnten</b> Sie mir kurz helfen?', 'Konjunktiv II', 'Höfliche Bitte: Dafür nimmt man den Konjunktiv II.'),

    {
      anweisung: 'Bilde die verlangte Imperativform.',
      typ: 'eingabe',
      frage: 'geben (an „du“)',
      loesungen: ['gib'],
      erklaerung: 'Starke Verben mit e→i-Wechsel behalten den Wechsel: gib!',
    },
    {
      anweisung: 'Bilde die verlangte Imperativform.',
      typ: 'eingabe',
      frage: 'laufen (an „du“)',
      loesungen: ['lauf', 'laufe'],
      erklaerung: 'Kein Umlaut im Imperativ: „lauf!“, nicht „läuf!“.',
    },
    {
      anweisung: 'Bilde die verlangte Imperativform.',
      typ: 'eingabe',
      frage: 'warten (an „ihr“)',
      loesungen: ['wartet'],
      erklaerung: 'Wie die Präsensform, nur ohne „ihr“.',
    },
    {
      anweisung: 'Bilde die verlangte Imperativform.',
      typ: 'eingabe',
      frage: 'sein (an „du“)',
      loesungen: ['sei'],
      erklaerung: '„Sein“ ist unregelmäßig: sei! – seid! – seien Sie!',
    },
  ],
});
