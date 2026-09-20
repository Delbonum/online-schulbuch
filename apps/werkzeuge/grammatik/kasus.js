// Übung: den Kasus einer Wortgruppe bestimmen.

import { uebung } from './uebung.js';

const FAELLE = ['Nominativ', 'Genitiv', 'Dativ', 'Akkusativ'];

const fall = (satz, richtig, erklaerung) => ({
  anweisung: 'In welchem Fall steht die fett gedruckte Wortgruppe?',
  satz,
  optionen: FAELLE,
  richtig,
  erklaerung,
});

uebung('#uebung', {
  aufgaben: [
    fall('<b>Der Postbote</b> klingelt an der Tür.', 'Nominativ', 'Probe: „Wer oder was klingelt?“ Das Subjekt steht immer im Nominativ.'),
    fall('Sie repariert <b>den alten Rasenmäher</b>.', 'Akkusativ', 'Probe: „Wen oder was repariert sie?“ – „den“ zeigt den Akkusativ maskulin.'),
    fall('Wir danken <b>dem Team</b> für die Hilfe.', 'Dativ', '„Danken“ fordert den Dativ, auch wenn man spontan einen Akkusativ erwartet.'),
    fall('Das Dach <b>des Hauses</b> ist undicht.', 'Genitiv', 'Probe: „Wessen Dach?“ Die Endung -es und der Artikel „des“ zeigen den Genitiv.'),
    fall('Trotz <b>des starken Windes</b> segelten sie weiter.', 'Genitiv', '„Trotz“ ist eine Präposition mit Genitiv.'),
    fall('Er fährt mit <b>dem Zug</b> nach Luzern.', 'Dativ', '„Mit“ fordert immer den Dativ.'),
    fall('Ohne <b>ihren Ausweis</b> kommt sie nicht hinein.', 'Akkusativ', '„Ohne“ fordert immer den Akkusativ.'),
    fall('Die Katze schläft auf <b>dem Sofa</b>.', 'Dativ', 'Wechselpräposition „auf“ mit der Frage „Wo?“ – also Dativ.'),
    fall('Die Katze springt auf <b>das Sofa</b>.', 'Akkusativ', 'Dieselbe Präposition, aber die Frage „Wohin?“ – also Akkusativ.'),
    fall('Meine Schwester ist <b>eine gute Schwimmerin</b>.', 'Nominativ', 'Nach „sein“ steht das Prädikativ im Nominativ – nicht im Akkusativ.'),
    fall('Der Trainer gratuliert <b>der Mannschaft</b>.', 'Dativ', '„Gratulieren“ gehört zu den Verben mit Dativ.'),
    fall('Sie erinnert sich <b>des Tages</b> noch genau.', 'Genitiv', 'Ein Genitivobjekt – heute selten und gehoben.'),
    fall('Der Kellner bringt <b>dem Gast</b> die Rechnung.', 'Dativ', 'Probe: „Wem bringt er die Rechnung?“'),
    fall('Der Kellner bringt dem Gast <b>die Rechnung</b>.', 'Akkusativ', 'Probe: „Wen oder was bringt er?“ Bei femininen Nomen sehen Nominativ und Akkusativ gleich aus – hier entscheidet die Frage.'),
    fall('Während <b>der Ferien</b> war die Schule geschlossen.', 'Genitiv', '„Während“ ist eine Präposition mit Genitiv.'),
    fall('<b>Dieser Vorschlag</b> gefällt mir.', 'Nominativ', 'Probe: „Wer oder was gefällt?“ Das Subjekt steht im Nominativ – auch wenn es nicht handelt.'),
    fall('Dieser Vorschlag gefällt <b>mir</b>.', 'Dativ', '„Gefallen“ fordert den Dativ: mir, dir, ihm.'),
    fall('Sie stellt die Vase zwischen <b>die beiden Bücher</b>.', 'Akkusativ', 'Wechselpräposition mit Richtung („Wohin?“) – Akkusativ.'),
    fall('Für <b>einen Moment</b> war es ganz still.', 'Akkusativ', '„Für“ fordert immer den Akkusativ.'),
    fall('Seit <b>dem letzten Winter</b> fährt sie nicht mehr Ski.', 'Dativ', '„Seit“ fordert immer den Dativ.'),

    {
      anweisung: 'Setze die richtige Form ein.',
      typ: 'eingabe',
      satz: 'Sie hilft ___ Nachbarn. (der Nachbar)',
      loesungen: ['dem'],
      erklaerung: '„Helfen“ fordert den Dativ: dem Nachbarn.',
    },
    {
      anweisung: 'Setze die richtige Form ein.',
      typ: 'eingabe',
      satz: 'Wegen ___ Sturms fiel der Unterricht aus. (der Sturm)',
      loesungen: ['des'],
      erklaerung: '„Wegen“ fordert den Genitiv: des Sturms.',
    },
    {
      anweisung: 'Setze die richtige Form ein.',
      typ: 'eingabe',
      satz: 'Er hängt das Bild an ___ Wand. (die Wand)',
      loesungen: ['die'],
      erklaerung: 'Frage „Wohin?“ – also Akkusativ: an die Wand.',
    },
    {
      anweisung: 'Setze die richtige Form ein.',
      typ: 'eingabe',
      satz: 'Das Bild hängt an ___ Wand. (die Wand)',
      loesungen: ['der'],
      erklaerung: 'Frage „Wo?“ – also Dativ: an der Wand.',
    },
  ],
});
