// Übung: Subjekt finden, Prädikat vollständig erfassen.

import { uebung } from './uebung.js';

const subj = (satz, loesungen, erklaerung) => ({
  anweisung: 'Nenne das Subjekt des Satzes (mit Artikel, so wie es im Satz steht).',
  typ: 'eingabe',
  satz,
  loesungen,
  erklaerung,
});

const praed = (satz, loesungen, erklaerung) => ({
  anweisung: 'Nenne alle Teile des Prädikats – in der Reihenfolge, in der sie im Satz stehen.',
  typ: 'eingabe',
  satz,
  loesungen,
  erklaerung,
});

uebung('#uebung', {
  aufgaben: [
    subj('Auf dem Dach sitzen zwei Tauben.', ['zwei Tauben'], 'Kongruenzprobe: „sitzen“ steht im Plural – also gehört es zu „zwei Tauben“.'),
    subj('Dem Kind gefallen die bunten Bilder.', ['die bunten Bilder'], '„Gefallen“ steht im Plural. „Dem Kind“ ist ein Dativobjekt.'),
    subj('Gestern wurde das Fenster repariert.', ['das Fenster'], 'Im Passiv wird der Betroffene zum Subjekt.'),
    subj('Es kamen nur wenige Gäste.', ['wenige Gäste', 'nur wenige Gäste'], '„Es“ ist hier nur ein Platzhalter im Vorfeld. Probe: „Wenige Gäste kamen.“'),
    subj('Mich stört der Lärm aus dem Hinterhof.', ['der Lärm aus dem Hinterhof', 'der Lärm'], '„Mich“ ist Akkusativobjekt. Kongruenzprobe: „Mich stören die Geräusche.“'),
    subj('Nach dem Regen roch die Wiese frisch.', ['die Wiese'], 'Probe: „Nach dem Regen rochen die Wiesen frisch.“'),

    praed('Der Zug fährt in zwei Minuten ab.', ['fährt ab', 'fährt … ab', 'fährt ab.'], 'Die abgetrennte Partikel „ab“ gehört zum Prädikat: abfahren.'),
    praed('Sie hat den Aufsatz gestern abgegeben.', ['hat abgegeben', 'hat … abgegeben'], 'Hilfsverb + Partizip II bilden zusammen das Prädikat.'),
    praed('Wir müssen jetzt leider gehen.', ['müssen gehen', 'müssen … gehen'], 'Modalverb + Infinitiv.'),
    praed('Das Paket wird morgen zugestellt.', ['wird zugestellt', 'wird … zugestellt'], 'Passiv: werden + Partizip II.'),

    {
      anweisung: 'Welches Satzglied ist fett gedruckt?',
      satz: '<b>Es</b> regnet seit Stunden.',
      optionen: ['Subjekt (Scheinsubjekt)', 'kein Satzglied', 'Akkusativobjekt', 'Prädikat'],
      richtig: 'Subjekt (Scheinsubjekt)',
      erklaerung: 'Bei unpersönlichen Verben wie „regnen“ ist „es“ formal das Subjekt, bezeichnet aber nichts.',
    },
    {
      anweisung: 'Welches Satzglied ist fett gedruckt?',
      satz: '<b>Früh aufzustehen</b> fällt ihm schwer.',
      optionen: ['Subjekt', 'Akkusativobjekt', 'Modaladverbial', 'Prädikativ'],
      richtig: 'Subjekt',
      erklaerung: 'Eine Infinitivgruppe als Subjekt. Ersatzprobe: „Das fällt ihm schwer.“',
    },
    {
      anweisung: 'Welches Satzglied ist fett gedruckt?',
      satz: 'Meine Kusine <b>ist</b> Tierärztin.',
      optionen: ['Prädikat', 'Prädikativ', 'Subjekt', 'Akkusativobjekt'],
      richtig: 'Prädikat',
      erklaerung: '„Ist“ ist die finite Verbform. „Tierärztin“ dagegen ist das Prädikativ.',
    },
    {
      anweisung: 'Welches Satzglied ist fett gedruckt?',
      satz: 'Meine Kusine ist <b>Tierärztin</b>.',
      optionen: ['Prädikativ', 'Prädikat', 'Akkusativobjekt', 'Subjekt'],
      richtig: 'Prädikativ',
      erklaerung: 'Nach dem Kopulaverb „sein“ steht kein Objekt, sondern ein Prädikativ im Nominativ.',
    },

    {
      anweisung: 'Welche Verbform passt? Achte auf die Kongruenz mit dem Subjekt.',
      frage: 'Die Mehrzahl der Zuschauer ___ zufrieden.',
      optionen: ['war', 'waren'],
      richtig: 'war',
      erklaerung: 'Das Subjekt ist „die Mehrzahl“ (Singular). „Der Zuschauer“ ist nur ein Genitivattribut.',
    },
    {
      anweisung: 'Welche Verbform passt? Achte auf die Kongruenz mit dem Subjekt.',
      frage: 'Auf dem Tisch ___ drei Teller.',
      optionen: ['stehen', 'steht'],
      richtig: 'stehen',
      erklaerung: 'Subjekt ist „drei Teller“ (Plural) – auch wenn es hinten im Satz steht.',
    },
    {
      anweisung: 'Welche Verbform passt? Achte auf die Kongruenz mit dem Subjekt.',
      frage: 'Weder die Lehrerin noch die Schüler ___ etwas bemerkt.',
      optionen: ['hatten', 'hatte'],
      richtig: 'hatten',
      erklaerung: 'Bei „weder … noch“ richtet sich das Verb nach dem näherstehenden Teil – hier „die Schüler“ im Plural.',
    },
  ],
});
