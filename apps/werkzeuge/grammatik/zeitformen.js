// Übung: Zeitformen erkennen und bilden.

import { uebung } from './uebung.js';

const TEMPORA = ['Präsens', 'Präteritum', 'Perfekt', 'Plusquamperfekt', 'Futur I', 'Futur II'];

const tempus = (satz, richtig, erklaerung) => ({
  anweisung: 'In welcher Zeitform steht dieser Satz?',
  satz,
  optionen: TEMPORA,
  richtig,
  erklaerung,
});

uebung('#uebung', {
  aufgaben: [
    tempus('Die Klasse besucht am Freitag das Museum.', 'Präsens', 'Eine einfache Verbform in der Gegenwart – auch wenn hier die Zukunft gemeint ist.'),
    tempus('Der Schreiner reparierte den alten Stuhl.', 'Präteritum', 'Eine einfache Verbform mit Vergangenheitsendung.'),
    tempus('Wir haben den Zug leider verpasst.', 'Perfekt', 'haben im Präsens + Partizip II.'),
    tempus('Sie war schon eingeschlafen, als das Telefon klingelte.', 'Plusquamperfekt', 'sein im Präteritum + Partizip II. Der Hauptsatz beschreibt die Vorvergangenheit.'),
    tempus('Nächste Woche werden wir das Ergebnis erfahren.', 'Futur I', 'werden + Infinitiv.'),
    tempus('Bis zum Abend wird sie den Aufsatz beendet haben.', 'Futur II', 'werden + Partizip II + haben.'),
    tempus('Der Nachbar hatte den Schlüssel unter die Matte gelegt.', 'Plusquamperfekt', 'hatte + Partizip II.'),
    tempus('Ihr seid gestern früher gegangen.', 'Perfekt', 'sein im Präsens + Partizip II. Verben der Ortsveränderung bilden das Perfekt mit „sein“.'),
    tempus('Im Winter fiel damals sehr viel Schnee.', 'Präteritum', 'Eine einfache Vergangenheitsform, typisch für Erzählungen.'),
    tempus('Er wird jetzt wohl schon zu Hause sein.', 'Futur I', 'werden + Infinitiv. Gemeint ist keine Zukunft, sondern eine Vermutung über die Gegenwart.'),
    tempus('Sie wird den Brief wohl vergessen haben.', 'Futur II', 'werden + Partizip II + haben – hier als Vermutung über etwas Vergangenes.'),
    tempus('Das Wasser kocht.', 'Präsens', 'Einfache Verbform, Gegenwart.'),

    {
      anweisung: 'Aktiv oder Passiv? Schau auf die zweite Verbform.',
      satz: 'Morgen wird der Saal renoviert.',
      optionen: ['Passiv (werden + Partizip II)', 'Futur I Aktiv (werden + Infinitiv)'],
      richtig: 'Passiv (werden + Partizip II)',
      erklaerung: '„Renoviert“ ist ein Partizip II, also Passiv – und zwar im Präsens.',
    },
    {
      anweisung: 'Aktiv oder Passiv? Schau auf die zweite Verbform.',
      satz: 'Morgen wird der Saal glänzen.',
      optionen: ['Futur I Aktiv (werden + Infinitiv)', 'Passiv (werden + Partizip II)'],
      richtig: 'Futur I Aktiv (werden + Infinitiv)',
      erklaerung: '„Glänzen“ ist ein Infinitiv, also Futur I im Aktiv.',
    },
    {
      anweisung: 'Aktiv oder Passiv? Schau auf die zweite Verbform.',
      satz: 'In zwei Stunden wird der Film beginnen.',
      optionen: ['Futur I Aktiv (werden + Infinitiv)', 'Passiv (werden + Partizip II)'],
      richtig: 'Futur I Aktiv (werden + Infinitiv)',
      erklaerung: '„Beginnen“ ist ein Infinitiv. Außerdem lässt sich „beginnen“ hier gar nicht ins Passiv setzen.',
    },

    {
      anweisung: 'Setze die Verbform in die verlangte Zeitform.',
      frage: 'sie liest (Perfekt)',
      typ: 'eingabe',
      vor: 'sie',
      loesungen: ['hat gelesen'],
      erklaerung: 'haben im Präsens + Partizip II „gelesen“.',
    },
    {
      anweisung: 'Setze die Verbform in die verlangte Zeitform.',
      frage: 'er fährt (Plusquamperfekt)',
      typ: 'eingabe',
      vor: 'er',
      loesungen: ['war gefahren'],
      erklaerung: 'Verben der Ortsveränderung bilden Perfekt und Plusquamperfekt mit „sein“.',
    },
    {
      anweisung: 'Setze die Verbform in die verlangte Zeitform.',
      frage: 'wir arbeiten (Präteritum)',
      typ: 'eingabe',
      vor: 'wir',
      loesungen: ['arbeiteten'],
      erklaerung: 'Ein schwaches Verb: Stamm + -te + Personalendung.',
    },
    {
      anweisung: 'Setze die Verbform in die verlangte Zeitform.',
      frage: 'du bleibst (Perfekt)',
      typ: 'eingabe',
      vor: 'du',
      loesungen: ['bist geblieben'],
      erklaerung: '„Bleiben“ gehört zu den Verben, die das Perfekt mit „sein“ bilden.',
    },
    {
      anweisung: 'Setze die Verbform in die verlangte Zeitform.',
      frage: 'ich denke (Präteritum)',
      typ: 'eingabe',
      vor: 'ich',
      loesungen: ['dachte'],
      erklaerung: 'Ein gemischtes Verb: Vokalwechsel und schwache Endung.',
    },
    {
      anweisung: 'Setze die Verbform in die verlangte Zeitform.',
      frage: 'sie kommen (Futur I)',
      typ: 'eingabe',
      vor: 'sie',
      loesungen: ['werden kommen'],
      erklaerung: 'werden im Präsens + Infinitiv.',
    },
    {
      anweisung: 'Setze die Verbform in die verlangte Zeitform.',
      frage: 'er räumt auf (Perfekt)',
      typ: 'eingabe',
      vor: 'er',
      loesungen: ['hat aufgeräumt'],
      erklaerung: 'Trennbares Verb: Das ge- steht in der Mitte.',
    },
    {
      anweisung: 'Setze die Verbform in die verlangte Zeitform.',
      frage: 'ihr versteht (Perfekt)',
      typ: 'eingabe',
      vor: 'ihr',
      loesungen: ['habt verstanden'],
      erklaerung: 'Untrennbares Präfix „ver-“: kein ge- im Partizip II.',
    },
  ],
});
