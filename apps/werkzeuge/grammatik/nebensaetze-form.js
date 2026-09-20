// Übung: Nebensätze nach Form bestimmen.

import { uebung } from './uebung.js';

const FORM = ['Konjunktionalsatz', 'Relativsatz', 'indirekter Fragesatz', 'Infinitivsatz', 'Partizipialsatz', 'uneingeleiteter Nebensatz'];

const f = (satz, richtig, erklaerung) => ({ satz, richtig, erklaerung });

uebung('#uebung', {
  anweisung: 'Bestimme den fett gedruckten Nebensatz nach seiner Form.',
  optionen: FORM,
  aufgaben: [
    f('Wir blieben drinnen, <b>weil das Gewitter näher kam</b>.', 'Konjunktionalsatz', 'Eingeleitet durch die unterordnende Konjunktion „weil“.'),
    f('Der Koffer, <b>den du gesucht hast</b>, steht im Flur.', 'Relativsatz', 'Eingeleitet durch das Relativpronomen „den“.'),
    f('Sie fragte, <b>ob noch jemand mitkommt</b>.', 'indirekter Fragesatz', 'Eingeleitet durch „ob“ – eine Entscheidungsfrage in indirekter Form.'),
    f('Er versprach, <b>pünktlich zu sein</b>.', 'Infinitivsatz', 'Infinitiv mit „zu“, ohne eigenes Subjekt.'),
    f('<b>Vom Regen überrascht</b>, suchten wir einen Unterstand.', 'Partizipialsatz', 'Eine Partizipgruppe mit Partizip II, ohne finites Verb.'),
    f('<b>Hätte ich das gewusst</b>, wäre ich früher gekommen.', 'uneingeleiteter Nebensatz', 'Kein Einleitungswort; das finite Verb „hätte“ steht ganz vorn. Umformung: „Wenn ich das gewusst hätte …“'),
    f('Niemand wusste, <b>wann der nächste Bus fährt</b>.', 'indirekter Fragesatz', 'Eingeleitet durch das Fragewort „wann“.'),
    f('Sie kam näher, <b>um den Text besser lesen zu können</b>.', 'Infinitivsatz', '„um … zu“ + Infinitiv.'),
    f('Das Dorf, <b>wo sie aufgewachsen ist</b>, liegt im Jura.', 'Relativsatz', 'Eingeleitet durch das Relativadverb „wo“.'),
    f('Er behauptet, <b>er habe nichts bemerkt</b>.', 'uneingeleiteter Nebensatz', 'Kein „dass“, das Verb steht an zweiter Stelle. Umformung: „…, dass er nichts bemerkt habe.“'),
    f('<b>Leise vor sich hin summend</b>, räumte sie die Küche auf.', 'Partizipialsatz', 'Partizip I mit Ergänzungen.'),
    f('Wir warteten, <b>bis der Regen nachließ</b>.', 'Konjunktionalsatz', 'Eingeleitet durch „bis“.'),
    f('<b>Wer zuletzt geht</b>, macht das Licht aus.', 'Relativsatz', 'Ein Relativsatz ohne Bezugswort, eingeleitet durch „wer“. Nach der Funktion ist es ein Subjektsatz.'),
    f('Es ist schwierig, <b>alle Termine im Blick zu behalten</b>.', 'Infinitivsatz', 'Infinitiv mit „zu“, angekündigt durch „es“.'),
    f('Sie wollte wissen, <b>wem das Fahrrad gehört</b>.', 'indirekter Fragesatz', 'Eingeleitet durch das Fragewort „wem“.'),
    f('<b>Obwohl alle müde waren</b>, arbeiteten sie weiter.', 'Konjunktionalsatz', 'Eingeleitet durch „obwohl“.'),
    f('Der Läufer, <b>dessen Schuh gerissen war</b>, gab auf.', 'Relativsatz', 'Relativpronomen im Genitiv: „dessen“.'),
    f('<b>Kommst du mit</b>, freut mich das sehr.', 'uneingeleiteter Nebensatz', 'Das Verb steht vorn; gemeint ist „Wenn du mitkommst …“'),

    {
      anweisung: 'Bestimme denselben Nebensatz zweimal: einmal nach Form, einmal nach Funktion.',
      satz: 'Ich weiß nicht, <b>ob sich der Umweg lohnt</b>.',
      frage: 'Welche Form hat der Nebensatz?',
      optionen: FORM,
      richtig: 'indirekter Fragesatz',
      erklaerung: 'Eingeleitet durch „ob“.',
    },
    {
      anweisung: 'Bestimme denselben Nebensatz zweimal: einmal nach Form, einmal nach Funktion.',
      satz: 'Ich weiß nicht, <b>ob sich der Umweg lohnt</b>.',
      frage: 'Welche Funktion hat der Nebensatz?',
      optionen: ['Objektsatz', 'Subjektsatz', 'Attributsatz', 'Adverbialsatz'],
      richtig: 'Objektsatz',
      erklaerung: 'Probe: „Was weiß ich nicht?“ Der Nebensatz steht an der Objektstelle.',
    },
    {
      anweisung: 'Bestimme denselben Nebensatz zweimal: einmal nach Form, einmal nach Funktion.',
      satz: 'Das Zimmer, <b>das nach Süden liegt</b>, ist das hellste.',
      frage: 'Welche Funktion hat der Nebensatz?',
      optionen: ['Attributsatz', 'Subjektsatz', 'Objektsatz', 'Adverbialsatz'],
      richtig: 'Attributsatz',
      erklaerung: 'Der Relativsatz hängt am Nomen „Zimmer“. Nach der Form ist er ein Relativsatz, nach der Funktion ein Attributsatz.',
    },
  ],
});
