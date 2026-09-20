// Übung: Pronomenarten, Artikel oder Pronomen, Gebrauch des Adjektivs.

import { uebung } from './uebung.js';

const PRONOMEN = ['Personalpronomen', 'Possessivpronomen', 'Demonstrativpronomen', 'Relativpronomen', 'Interrogativpronomen', 'Reflexivpronomen', 'Indefinitpronomen'];

const pron = (satz, richtig, erklaerung) => ({
  anweisung: 'Welche Art von Pronomen ist fett gedruckt?',
  satz,
  optionen: PRONOMEN,
  richtig,
  erklaerung,
});

uebung('#uebung', {
  aufgaben: [
    pron('<b>Sie</b> hat den Zug verpasst.', 'Personalpronomen', 'Es vertritt eine Person, über die gesprochen wird.'),
    pron('<b>Unser</b> Garten ist völlig verwildert.', 'Possessivpronomen', 'Es gibt an, wem der Garten gehört.'),
    pron('<b>Jener</b> Weg führt zum See.', 'Demonstrativpronomen', 'Es zeigt hin und hebt hervor: dieser – jener.'),
    pron('Das Haus, <b>das</b> am Hang steht, ist alt.', 'Relativpronomen', 'Es leitet einen Relativsatz ein und bezieht sich auf „Haus“.'),
    pron('<b>Wessen</b> Jacke liegt hier?', 'Interrogativpronomen', 'Ein Fragewort im Genitiv.'),
    pron('Er hat <b>sich</b> geärgert.', 'Reflexivpronomen', 'Es weist auf das Subjekt zurück.'),
    pron('<b>Niemand</b> hat etwas bemerkt.', 'Indefinitpronomen', 'Es bezeichnet eine unbestimmte Menge – hier: keine Person.'),
    pron('<b>Man</b> sollte zuerst nachfragen.', 'Indefinitpronomen', '„Man“ steht für eine beliebige, unbestimmte Person.'),
    pron('Ich habe <b>ihm</b> alles erklärt.', 'Personalpronomen', 'Dativform von „er“.'),
    pron('<b>Welche</b> Farbe gefällt dir besser?', 'Interrogativpronomen', 'Fragt nach einer Auswahl.'),
    pron('Sie kämmt <b>sich</b> die Haare.', 'Reflexivpronomen', 'Die Handlung richtet sich auf das Subjekt selbst.'),
    pron('Die Sängerin, <b>deren</b> Stimme alle kannten, trat auf.', 'Relativpronomen', 'Relativpronomen im Genitiv.'),

    {
      anweisung: 'Artikel oder Pronomen?',
      satz: '<b>Der</b> Hund bellt schon wieder.',
      optionen: ['Artikel', 'Pronomen'],
      richtig: 'Artikel',
      erklaerung: 'Es begleitet das Nomen „Hund“.',
    },
    {
      anweisung: 'Artikel oder Pronomen?',
      satz: 'Von allen Vorschlägen gefällt mir <b>der</b> am besten.',
      optionen: ['Pronomen', 'Artikel'],
      richtig: 'Pronomen',
      erklaerung: 'Hier steht „der“ anstelle eines Nomens – ein Demonstrativpronomen.',
    },
    {
      anweisung: 'Artikel oder Pronomen?',
      satz: 'Der Schlüssel, <b>den</b> ich suche, ist klein.',
      optionen: ['Pronomen', 'Artikel'],
      richtig: 'Pronomen',
      erklaerung: 'Es leitet einen Relativsatz ein – ein Relativpronomen.',
    },
    {
      anweisung: 'Artikel oder Pronomen?',
      satz: 'Sie hat <b>ein</b> Paket abgeholt.',
      optionen: ['Artikel', 'Pronomen'],
      richtig: 'Artikel',
      erklaerung: 'Unbestimmter Artikel vor dem Nomen „Paket“.',
    },

    {
      anweisung: 'Wie wird das Adjektiv hier gebraucht?',
      satz: 'Der <b>dunkle</b> Wald wirkte bedrohlich.',
      optionen: ['attributiv', 'prädikativ', 'adverbial'],
      richtig: 'attributiv',
      erklaerung: 'Es steht vor dem Nomen und ist dekliniert.',
    },
    {
      anweisung: 'Wie wird das Adjektiv hier gebraucht?',
      satz: 'Der Wald ist <b>dunkel</b>.',
      optionen: ['prädikativ', 'attributiv', 'adverbial'],
      richtig: 'prädikativ',
      erklaerung: 'Nach „sein“ ohne Endung – das Adjektiv ist hier Prädikativ.',
    },
    {
      anweisung: 'Wie wird das Adjektiv hier gebraucht?',
      satz: 'Sie antwortete <b>freundlich</b>.',
      optionen: ['adverbial', 'attributiv', 'prädikativ'],
      richtig: 'adverbial',
      erklaerung: 'Es beschreibt, wie das Verb ausgeführt wird. Als Satzglied ist es ein Modaladverbial.',
    },
    {
      anweisung: 'Wie wird das Adjektiv hier gebraucht?',
      satz: 'Die Suppe bleibt <b>warm</b>.',
      optionen: ['prädikativ', 'attributiv', 'adverbial'],
      richtig: 'prädikativ',
      erklaerung: 'Nach „bleiben“ steht ein Prädikativ – wie nach „sein“ und „werden“.',
    },

    {
      anweisung: 'Adjektiv oder Adverb? Nimm die beiden Proben: steigern und zwischen Artikel und Nomen setzen.',
      wort: 'gründlich',
      optionen: ['Adjektiv', 'Adverb'],
      richtig: 'Adjektiv',
      erklaerung: 'gründlicher ✓, die gründliche Arbeit ✓.',
    },
    {
      anweisung: 'Adjektiv oder Adverb? Nimm die beiden Proben: steigern und zwischen Artikel und Nomen setzen.',
      wort: 'gestern',
      optionen: ['Adverb', 'Adjektiv'],
      richtig: 'Adverb',
      erklaerung: '„gesterner“ ✗, „die gesterne Arbeit“ ✗ – also Adverb.',
    },
    {
      anweisung: 'Adjektiv oder Adverb? Nimm die beiden Proben: steigern und zwischen Artikel und Nomen setzen.',
      wort: 'leise',
      optionen: ['Adjektiv', 'Adverb'],
      richtig: 'Adjektiv',
      erklaerung: 'leiser ✓, die leise Stimme ✓.',
    },
    {
      anweisung: 'Adjektiv oder Adverb? Nimm die beiden Proben: steigern und zwischen Artikel und Nomen setzen.',
      wort: 'dort',
      optionen: ['Adverb', 'Adjektiv'],
      richtig: 'Adverb',
      erklaerung: 'Nicht steigerbar und nicht zwischen Artikel und Nomen einsetzbar.',
    },

    {
      anweisung: 'Welche Wortart hat das fett gedruckte Wort?',
      satz: 'Beim <b>Schwimmen</b> vergisst sie die Zeit.',
      optionen: ['Nomen', 'Verb', 'Adjektiv', 'Adverb'],
      richtig: 'Nomen',
      erklaerung: 'Eine Substantivierung: „beim“ enthält den Artikel „dem“, und das Wort ist großgeschrieben.',
    },
    {
      anweisung: 'Welche Wortart hat das fett gedruckte Wort?',
      satz: 'Sie will heute noch <b>schwimmen</b>.',
      optionen: ['Verb', 'Nomen', 'Adjektiv', 'Adverb'],
      richtig: 'Verb',
      erklaerung: 'Hier steht der Infinitiv als Teil des Prädikats.',
    },
    {
      anweisung: 'Welche Wortart hat das fett gedruckte Wort?',
      satz: 'Das <b>Beste</b> kommt zum Schluss.',
      optionen: ['Nomen', 'Adjektiv', 'Adverb', 'Pronomen'],
      richtig: 'Nomen',
      erklaerung: 'Ein substantiviertes Adjektiv: Artikel davor, großgeschrieben.',
    },
  ],
});
