// Übung: Aktiv, Vorgangspassiv und Zustandspassiv erkennen und umformen.

import { uebung } from './uebung.js';

const ap = (satz, richtig, erklaerung) => ({
  anweisung: 'Steht dieser Satz im Aktiv, im Vorgangspassiv oder im Zustandspassiv?',
  satz,
  optionen: ['Aktiv', 'Vorgangspassiv', 'Zustandspassiv'],
  richtig,
  erklaerung,
});

const um = (frage, muster, erklaerung) => ({
  typ: 'frei',
  anweisung: 'Forme den Satz um. Zeitform und Modalverb müssen erhalten bleiben.',
  frage,
  muster,
  erklaerung,
});

uebung('#uebung', {
  aufgaben: [
    ap('Morgen wird der Saal renoviert.', 'Vorgangspassiv', 'werden + Partizip II.'),
    ap('Morgen wird es wohl regnen.', 'Aktiv', 'werden + Infinitiv – das ist Futur I im Aktiv.'),
    ap('Der Laden ist seit gestern geschlossen.', 'Zustandspassiv', 'sein + Partizip II: Es geht um den Zustand, nicht um den Vorgang.'),
    ap('Der Laden wird um 18 Uhr geschlossen.', 'Vorgangspassiv', 'werden + Partizip II: Hier geschieht etwas.'),
    ap('Das Fenster ist geöffnet worden.', 'Vorgangspassiv', 'Perfekt des Vorgangspassivs: sein + Partizip II + worden. Das „worden“ ist das entscheidende Signal.'),
    ap('Das Fenster ist geöffnet.', 'Zustandspassiv', 'Ohne „worden“ beschreibt der Satz nur den Zustand.'),
    ap('Nächste Woche wird der Kurs beginnen.', 'Aktiv', 'werden + Infinitiv – Futur I, kein Passiv.'),
    ap('Ohne passendes Werkzeug ist die Reparatur schwierig.', 'Aktiv', 'Nach „ist“ steht ein Adjektiv, kein Partizip II – ein Prädikativ. Der Satz ist Aktiv.'),
    ap('Der Chor wird das Stück längst geprobt haben.', 'Aktiv', 'Futur II im Aktiv: werden + Partizip II + haben. Das „haben“ am Ende verrät es.'),
    ap('Bald wird euch das Ergebnis mitgeteilt.', 'Vorgangspassiv', 'werden + Partizip II, mit Dativobjekt „euch“.'),
    ap('Sie wird nächstes Jahr Tierärztin.', 'Aktiv', '„Werden“ ist hier Vollverb – es folgt kein zweites Verb.'),
    ap('Die Wände waren frisch gestrichen.', 'Zustandspassiv', 'sein im Präteritum + Partizip II, ohne „worden“.'),
    ap('Die Wände waren frisch gestrichen worden.', 'Vorgangspassiv', 'Plusquamperfekt des Vorgangspassivs – erkennbar am „worden“.'),
    ap('Es wurde bis spät in die Nacht getanzt.', 'Vorgangspassiv', 'Ein unpersönliches Passiv: kein echtes Subjekt, nur das Platzhalter-„es“.'),
    ap('Der Verein organisiert jedes Jahr ein Fest.', 'Aktiv', 'Das Subjekt handelt.'),
    ap('Der Vortrag muss noch überarbeitet werden.', 'Vorgangspassiv', 'Passiv mit Modalverb: Modalverb + Partizip II + werden.'),

    um('Der Verein hat eine neue Halle gebaut. (ins Passiv)',
      'Eine neue Halle ist (vom Verein) gebaut worden.',
      'Perfekt bleibt Perfekt: „ist … gebaut worden“. Das Akkusativobjekt wird zum Subjekt im Nominativ.'),
    um('Die Schreinerin repariert den wackligen Stuhl. (ins Passiv)',
      'Der wacklige Stuhl wird (von der Schreinerin) repariert.',
      'Präsens bleibt Präsens.'),
    um('Am Ende der Sitzung wurden noch Unterlagen verteilt. (ins Aktiv)',
      'Am Ende der Sitzung verteilte man noch Unterlagen.',
      'Das Agens fehlt im Passivsatz und muss erfunden werden – „man“ ist immer möglich. Das Präteritum bleibt erhalten.'),
    um('Endlich konnte der Schaden behoben werden. (ins Aktiv)',
      'Endlich konnte man den Schaden beheben.',
      'Das Modalverb „konnte“ und das Präteritum bleiben. Aus „behoben werden“ wird der Infinitiv „beheben“.'),
    um('Der Gärtner befreit den Weg vom Laub. (ins Passiv)',
      'Der Weg wird (vom Gärtner) vom Laub befreit.',
      'Das Präpositionalobjekt „vom Laub“ bleibt unverändert stehen.'),
    um('Im Anschluss wurden mehrere Vorschläge diskutiert. (ins Aktiv)',
      'Im Anschluss diskutierte man mehrere Vorschläge.',
      'Agens erfinden, Präteritum beibehalten.'),
    um('Der Postbote gab ihr das Paket. (ins Passiv)',
      'Das Paket wurde ihr (vom Postboten) gegeben.',
      'Nur das Akkusativobjekt wird zum Subjekt. Das Dativobjekt „ihr“ bleibt im Dativ.'),
    um('Der Hagel beschädigte zahlreiche Autos. (ins Passiv)',
      'Zahlreiche Autos wurden durch den Hagel beschädigt.',
      'Bei einer Ursache oder einem Mittel steht „durch“, bei Personen „von“.'),

    {
      anweisung: 'Welche Form ist richtig?',
      frage: 'Die Fenster sind letzte Woche ___ .',
      optionen: ['geputzt worden', 'geputzt geworden'],
      richtig: 'geputzt worden',
      erklaerung: 'Im Passiv heißt das Partizip von „werden“ immer „worden“ – ohne ge-.',
    },
    {
      anweisung: 'Welche Form ist richtig?',
      frage: 'Nach dem Umbau ist das Haus viel heller ___ .',
      optionen: ['geworden', 'worden'],
      richtig: 'geworden',
      erklaerung: 'Hier ist „werden“ Vollverb – dann heißt das Partizip „geworden“.',
    },
    {
      anweisung: 'Lässt sich dieser Satz überhaupt ins Passiv setzen?',
      satz: 'Das Konzert hat drei Stunden gedauert.',
      optionen: ['nein', 'ja'],
      richtig: 'nein',
      erklaerung: 'Es gibt kein Akkusativobjekt, und „dauern“ bildet kein Passiv.',
    },
    {
      anweisung: 'Lässt sich dieser Satz überhaupt ins Passiv setzen?',
      satz: 'Der Nachbar hat das Auto gewaschen.',
      optionen: ['ja', 'nein'],
      richtig: 'ja',
      erklaerung: '„Das Auto“ ist ein Akkusativobjekt und kann zum Subjekt werden: „Das Auto ist gewaschen worden.“',
    },
  ],
});
