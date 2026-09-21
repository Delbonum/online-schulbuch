// Übung: Wortart, Satzglied und semantische Rolle auseinanderhalten.

import { uebung } from './uebung.js';

const EBENEN = ['Wortart', 'Satzglied', 'semantische Rolle'];

const begriff = (wort, richtig, erklaerung) => ({
  anweisung: 'Auf welcher Ebene liegt dieser Fachbegriff?',
  wort,
  optionen: EBENEN,
  richtig,
  erklaerung,
});

uebung('#uebung', {
  aufgaben: [
    begriff('Akkusativobjekt', 'Satzglied', 'Objekte sind Satzglieder: Sie beschreiben die Funktion eines Elements im Satz.'),
    begriff('Adverb', 'Wortart', 'Adverbien sind eine Wortart. Verwechsle sie nicht mit dem Satzglied „Adverbial“.'),
    begriff('Agens', 'semantische Rolle', 'Das Agens ist der Handelnde in der beschriebenen Situation – reine Bedeutungsebene.'),
    begriff('Temporaladverbial', 'Satzglied', 'Adverbiale Bestimmungen sind Satzglieder. Sie können aus Adverbien bestehen, müssen es aber nicht.'),
    begriff('Präposition', 'Wortart', 'Präpositionen wie „mit“, „ohne“, „wegen“ sind eine Wortart.'),
    begriff('Patiens', 'semantische Rolle', 'Das Patiens ist der Betroffene: mit ihm geschieht etwas.'),
    begriff('Subjekt', 'Satzglied', 'Das Subjekt ist das Satzglied, mit dem das finite Verb kongruiert (übereinstimmt).'),
    begriff('Pronomen', 'Wortart', 'Pronomen sind eine Wortart. Als Satzglied können sie Subjekt, Objekt und anderes sein.'),
    begriff('Instrument', 'semantische Rolle', 'Das Instrument ist das Mittel, mit dem etwas getan wird.'),
    begriff('Prädikat', 'Satzglied', 'Das Prädikat ist der verbale Kern des Satzes – ein Satzglied.'),
    begriff('Konjunktion', 'Wortart', 'Konjunktionen wie „und“, „weil“, „obwohl“ sind eine Wortart.'),
    begriff('Experiencer', 'semantische Rolle', 'Der Experiencer nimmt etwas wahr oder empfindet etwas, ohne zu handeln.'),
    begriff('Genitivobjekt', 'Satzglied', 'Auch das selten gewordene Genitivobjekt ist ein Satzglied.'),
    begriff('Partikel', 'Wortart', 'Partikeln wie „sehr“, „nur“, „ja“ bilden eine eigene Wortart.'),
    begriff('Rezipient', 'semantische Rolle', 'Der Rezipient ist der Empfänger: Er bekommt etwas.'),
    begriff('Prädikativ', 'Satzglied', 'Das Prädikativ ist ein Satzglied, das dem Subjekt oder Objekt eine Eigenschaft zuschreibt.'),
    begriff('Adjektiv', 'Wortart', 'Adjektive sind eine Wortart. Als Satzglied können sie zum Beispiel Prädikativ sein.'),
    begriff('Stimulus', 'semantische Rolle', 'Der Stimulus ist das, was eine Wahrnehmung oder ein Gefühl auslöst.'),
    begriff('Kausaladverbial', 'Satzglied', 'Die adverbiale Bestimmung des Grundes ist ein Satzglied.'),
    begriff('Nomen', 'Wortart', 'Nomen (Substantive) sind eine Wortart. Ihr Satzglied hängt vom Satz ab.'),

    {
      anweisung: 'Achte genau darauf, nach welcher Ebene gefragt wird.',
      frage: 'Welche semantische Rolle hat „Der Sturm“?',
      satz: '<b>Der Sturm</b> deckte das Dach ab.',
      optionen: ['Kraft (Force)', 'Agens', 'Patiens', 'Instrument'],
      richtig: 'Kraft (Force)',
      erklaerung: 'Als Satzglied ist „Der Sturm“ Subjekt. Semantisch handelt er aber nicht absichtlich – eine Naturgewalt ist eine Kraft, kein Agens.',
    },
    {
      anweisung: 'Achte genau darauf, nach welcher Ebene gefragt wird.',
      frage: 'Welches Satzglied ist „Der Sturm“?',
      satz: '<b>Der Sturm</b> deckte das Dach ab.',
      optionen: ['Subjekt', 'Akkusativobjekt', 'Prädikat', 'Adverbial'],
      richtig: 'Subjekt',
      erklaerung: 'Probe: „Wer oder was deckte das Dach ab?“ Außerdem richtet sich die Verbform nach diesem Element.',
    },
    {
      anweisung: 'Achte genau darauf, nach welcher Ebene gefragt wird.',
      frage: 'Welche semantische Rolle hat „Das Paket“?',
      satz: '<b>Das Paket</b> wurde heute Morgen abgeholt.',
      optionen: ['Patiens', 'Agens', 'Experiencer', 'Rezipient'],
      richtig: 'Patiens',
      erklaerung: 'Klassische Falle: Im Passiv ist der Betroffene das Subjekt. Semantisch bleibt das Paket der Betroffene, also Patiens.',
    },
    {
      anweisung: 'Achte genau darauf, nach welcher Ebene gefragt wird.',
      frage: 'Welche Wortart hat „heute“?',
      satz: 'Das Paket wurde <b>heute</b> Morgen abgeholt.',
      optionen: ['Adverb', 'Adjektiv', 'Partikel', 'Präposition'],
      richtig: 'Adverb',
      erklaerung: '„Heute“ ist nicht flektierbar, kann aber allein im Vorfeld stehen: „Heute wurde das Paket abgeholt.“ Also ein Adverb.',
    },
    {
      anweisung: 'Achte genau darauf, nach welcher Ebene gefragt wird.',
      frage: 'Welche semantische Rolle hat „Die Bibliothekarin“?',
      satz: '<b>Die Bibliothekarin</b> bemerkte den Fehler im Katalog.',
      optionen: ['Experiencer', 'Agens', 'Patiens', 'Kraft (Force)'],
      richtig: 'Experiencer',
      erklaerung: '„Bemerken“ ist ein Wahrnehmungsverb. Wer wahrnimmt, handelt nicht – er ist Experiencer.',
    },
    {
      anweisung: 'Achte genau darauf, nach welcher Ebene gefragt wird.',
      frage: 'Welches Satzglied ist „den Fehler im Katalog“?',
      satz: 'Die Bibliothekarin bemerkte <b>den Fehler im Katalog</b>.',
      optionen: ['Akkusativobjekt', 'Dativobjekt', 'Lokaladverbial', 'Subjekt'],
      richtig: 'Akkusativobjekt',
      erklaerung: 'Probe: „Wen oder was bemerkte sie?“ – Die Präpositionalgruppe „im Katalog“ gehört als Attribut zu „Fehler“ und bildet kein eigenes Satzglied.',
    },
    {
      anweisung: 'Achte genau darauf, nach welcher Ebene gefragt wird.',
      frage: 'Welche semantische Rolle hat „mit dem Zweitschlüssel“?',
      satz: 'Der Hausmeister öffnete die Tür <b>mit dem Zweitschlüssel</b>.',
      optionen: ['Instrument', 'Agens', 'Ort', 'Rezipient'],
      richtig: 'Instrument',
      erklaerung: 'Das Mittel, mit dem gehandelt wird, ist das Instrument. Als Satzglied ist es ein Modaladverbial (instrumental).',
    },
    {
      anweisung: 'Achte genau darauf, nach welcher Ebene gefragt wird.',
      frage: 'Welche semantische Rolle hat „ihrem Neffen“?',
      satz: 'Die Tante schenkt <b>ihrem Neffen</b> ein Fahrrad.',
      optionen: ['Rezipient', 'Patiens', 'Agens', 'Experiencer'],
      richtig: 'Rezipient',
      erklaerung: 'Der Neffe bekommt etwas – er ist Empfänger. Als Satzglied ist „ihrem Neffen“ ein Dativobjekt.',
    },
    {
      anweisung: 'Achte genau darauf, nach welcher Ebene gefragt wird.',
      frage: 'Welches Satzglied ist „ihrem Neffen“?',
      satz: 'Die Tante schenkt <b>ihrem Neffen</b> ein Fahrrad.',
      optionen: ['Dativobjekt', 'Akkusativobjekt', 'Genitivobjekt', 'Adverbial'],
      richtig: 'Dativobjekt',
      erklaerung: 'Probe: „Wem schenkt sie das Fahrrad?“ – Dativ, also Dativobjekt.',
    },
    {
      anweisung: 'Achte genau darauf, nach welcher Ebene gefragt wird.',
      frage: 'Welche Wortart hat „ihrem“?',
      satz: 'Die Tante schenkt <b>ihrem</b> Neffen ein Fahrrad.',
      optionen: ['Pronomen', 'Adjektiv', 'Nomen', 'Adverb'],
      richtig: 'Pronomen',
      erklaerung: '„Ihrem“ ist ein Possessivpronomen: Es begleitet das Nomen an der Stelle, an der sonst ein Artikel stünde.',
    },
  ],
});
