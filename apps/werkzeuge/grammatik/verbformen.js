// Übung: finite und infinite Formen, Partizipien, starke/schwache/gemischte Verben.

import { uebung } from './uebung.js';

const finit = (satz, richtig, erklaerung) => ({
  anweisung: 'Ist die fett gedruckte Verbform finit oder infinit?',
  satz,
  optionen: ['finit', 'infinit'],
  richtig,
  erklaerung,
});

const klasse = (w, richtig, erklaerung) => ({
  anweisung: 'Ist dieses Verb stark, schwach oder gemischt?',
  wort: w,
  optionen: ['schwach', 'stark', 'gemischt'],
  richtig,
  erklaerung,
});

uebung('#uebung', {
  aufgaben: [
    finit('Wir <b>warten</b> auf den Bus.', 'finit', '„Warten“ richtet sich hier nach „wir“: ich warte, du wartest. Also finit.'),
    finit('Er hat den Schlüssel <b>verloren</b>.', 'infinit', 'Ein Partizip II. Die finite Form im Satz ist „hat“.'),
    finit('Sie möchte heute früher <b>gehen</b>.', 'infinit', 'Ein Infinitiv. Finit ist „möchte“.'),
    finit('Die Kinder <b>rannten</b> über die Wiese.', 'finit', 'Präteritum, 3. Person Plural – die Form hängt an „die Kinder“.'),
    finit('<b>Singend</b> ging er nach Hause.', 'infinit', 'Ein Partizip I. Es sagt nichts über Person und Zeit aus.'),
    finit('Morgen <b>wird</b> der Brief abgeschickt.', 'finit', '„Wird“ ist die finite Form; „abgeschickt“ ist infinit.'),
    finit('Morgen wird der Brief <b>abgeschickt</b>.', 'infinit', 'Partizip II im Passiv. Finit ist „wird“.'),
    finit('Du <b>musst</b> jetzt nichts sagen.', 'finit', 'Modalverb in der 2. Person Singular – finit.'),
    finit('Ich habe vergessen, den Brief <b>einzuwerfen</b>.', 'infinit', 'Ein Infinitiv mit „zu“ – immer infinit.'),
    finit('Die <b>geschlossene</b> Tür ließ sich nicht öffnen.', 'infinit', 'Ein Partizip II, hier als Adjektiv gebraucht. Finit ist „ließ“.'),

    {
      anweisung: 'Welche Verbform ist das?',
      wort: 'wartend',
      optionen: ['Partizip I', 'Partizip II', 'Infinitiv', 'finite Form'],
      richtig: 'Partizip I',
      erklaerung: 'Infinitiv + d = Partizip I. Es beschreibt etwas Gleichzeitiges.',
    },
    {
      anweisung: 'Welche Verbform ist das?',
      wort: 'gewartet',
      optionen: ['Partizip II', 'Partizip I', 'Infinitiv', 'finite Form'],
      richtig: 'Partizip II',
      erklaerung: 'ge- + Stamm + -t. Damit werden Perfekt, Plusquamperfekt und Passiv gebildet.',
    },
    {
      anweisung: 'Welche Verbform ist das?',
      wort: 'studiert',
      optionen: ['Partizip II', 'Partizip I', 'Infinitiv', 'nur eine finite Form'],
      richtig: 'Partizip II',
      erklaerung: 'Verben auf -ieren bilden das Partizip II ohne ge-. Achtung: „studiert“ kann auch die finite Form „sie studiert“ sein – hier ist die Partizipform gemeint.',
    },
    {
      anweisung: 'Welche Verbform ist das?',
      wort: 'abgefahren',
      optionen: ['Partizip II', 'Partizip I', 'Infinitiv', 'finite Form'],
      richtig: 'Partizip II',
      erklaerung: 'Bei trennbaren Verben steht das ge- in der Mitte: ab-ge-fahren.',
    },

    klasse('tanzen', 'schwach', 'tanzen – tanzte – getanzt. Vokal bleibt, Endungen -te und -t.'),
    klasse('trinken', 'stark', 'trinken – trank – getrunken. Der Vokal wechselt, Partizip II auf -en.'),
    klasse('nennen', 'gemischt', 'nennen – nannte – genannt. Vokalwechsel, aber schwache Endungen.'),
    klasse('kaufen', 'schwach', 'kaufen – kaufte – gekauft.'),
    klasse('fliegen', 'stark', 'fliegen – flog – geflogen.'),
    klasse('wissen', 'gemischt', 'wissen – wusste – gewusst. Vokalwechsel mit -te und -t.'),
    klasse('öffnen', 'schwach', 'öffnen – öffnete – geöffnet.'),
    klasse('helfen', 'stark', 'helfen – half – geholfen.'),
    klasse('bringen', 'gemischt', 'bringen – brachte – gebracht. Der Klassiker unter den gemischten Verben.'),
    klasse('reisen', 'schwach', 'reisen – reiste – gereist. Nicht verwechseln mit „reißen – riss – gerissen“, das ist stark.'),

    {
      anweisung: 'Wie lautet der Infinitiv zu dieser Form?',
      typ: 'eingabe',
      wort: 'sie dachte',
      loesungen: ['denken'],
      erklaerung: 'denken – dachte – gedacht: ein gemischtes Verb.',
    },
    {
      anweisung: 'Wie lautet der Infinitiv zu dieser Form?',
      typ: 'eingabe',
      wort: 'gesungen',
      loesungen: ['singen'],
      erklaerung: 'singen – sang – gesungen: ein starkes Verb.',
    },
    {
      anweisung: 'Wie lautet das Partizip II?',
      typ: 'eingabe',
      wort: 'verstehen',
      loesungen: ['verstanden'],
      erklaerung: 'Kein ge-, weil „ver-“ ein untrennbares Präfix ist.',
    },
    {
      anweisung: 'Wie lautet das Partizip II?',
      typ: 'eingabe',
      wort: 'aufstehen',
      loesungen: ['aufgestanden'],
      erklaerung: 'Trennbares Verb: Das ge- rutscht zwischen Partikel und Stamm.',
    },
    {
      anweisung: 'Wie lautet das Partizip I?',
      typ: 'eingabe',
      wort: 'warten',
      loesungen: ['wartend'],
      erklaerung: 'Partizip I = Infinitiv + d.',
    },

    {
      anweisung: 'Welche Art von Verb ist die fett gedruckte Form?',
      satz: 'Sie <b>hat</b> heute keine Zeit.',
      optionen: ['Vollverb', 'Hilfsverb', 'Modalverb'],
      richtig: 'Vollverb',
      erklaerung: 'Es gibt kein zweites Verb im Satz – „haben“ trägt hier die Bedeutung „besitzen“.',
    },
    {
      anweisung: 'Welche Art von Verb ist die fett gedruckte Form?',
      satz: 'Sie <b>hat</b> den Text überarbeitet.',
      optionen: ['Hilfsverb', 'Vollverb', 'Modalverb'],
      richtig: 'Hilfsverb',
      erklaerung: '„Haben“ bildet zusammen mit dem Partizip II das Perfekt.',
    },
    {
      anweisung: 'Welche Art von Verb ist die fett gedruckte Form?',
      satz: 'Du <b>sollst</b> pünktlich sein.',
      optionen: ['Modalverb', 'Hilfsverb', 'Vollverb'],
      richtig: 'Modalverb',
      erklaerung: 'Modalverben stehen mit einem Infinitiv ohne „zu“.',
    },
    {
      anweisung: 'Welche Art von Verb ist die fett gedruckte Form?',
      satz: 'Das Regal <b>wird</b> morgen geliefert.',
      optionen: ['Hilfsverb', 'Vollverb', 'Modalverb'],
      richtig: 'Hilfsverb',
      erklaerung: '„Werden“ + Partizip II bildet das Vorgangspassiv.',
    },
  ],
});
