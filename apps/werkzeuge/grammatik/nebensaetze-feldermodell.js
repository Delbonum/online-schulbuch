// Übung: Satzgefüge doppelt in das topologische Feldermodell einordnen.

import { uebung } from './uebung.js';

const f = (satz, teile, erklaerung) => ({ typ: 'felder', satz, teile, erklaerung });

uebung('#uebung', {
  anweisung: 'Ordne jeden Satzteil dem richtigen Feld zu.',
  aufgaben: [
    f('Hauptsatz: Als die Sonne unterging, kehrten die Wanderer um.', [
      ['Als die Sonne unterging', 'vf'], ['kehrten', 'lsk'], ['die Wanderer', 'mf'], ['um', 'rsk'],
    ], 'Der ganze Nebensatz besetzt das Vorfeld – er ist ein einziges Satzglied. „Um“ ist die Partikel von „umkehren“.'),

    f('Nebensatz allein: Als die Sonne unterging', [
      ['Als', 'lsk'], ['die Sonne', 'mf'], ['unterging', 'rsk'],
    ], 'Derselbe Nebensatz, nun für sich betrachtet: Einleitungswort links, finites Verb rechts.'),

    f('Hauptsatz: Weil es regnete, blieben wir drinnen.', [
      ['Weil es regnete', 'vf'], ['blieben', 'lsk'], ['wir drinnen', 'mf'],
    ], 'Direkt nach dem Nebensatz folgt das finite Verb „blieben“ – also steht der Nebensatz im Vorfeld.'),

    f('Hauptsatz: Wir blieben drinnen, weil es regnete.', [
      ['Wir', 'vf'], ['blieben', 'lsk'], ['drinnen', 'mf'], ['weil es regnete', 'nf'],
    ], 'Der nachgestellte Nebensatz steht im Nachfeld.'),

    f('Hauptsatz: Wir haben, weil es regnete, drinnen gespielt.', [
      ['Wir', 'vf'], ['haben', 'lsk'], ['weil es regnete, drinnen', 'mf'], ['gespielt', 'rsk'],
    ], 'Hier steht der Nebensatz zwischen den beiden Teilen der Satzklammer – also im Mittelfeld.'),

    f('Hauptsatz: Sie versuchte, das Rätsel zu lösen.', [
      ['Sie', 'vf'], ['versuchte', 'lsk'], ['das Rätsel zu lösen', 'nf'],
    ], 'Die Infinitivgruppe steht hinter dem Verb im Nachfeld. Das Mittelfeld bleibt leer.'),

    f('Hauptsatz: Das Kind, das nebenan wohnt, hat heute geklingelt.', [
      ['Das Kind, das nebenan wohnt', 'vf'], ['hat', 'lsk'], ['heute', 'mf'], ['geklingelt', 'rsk'],
    ], 'Der Relativsatz ist ein Attribut zu „Kind“ und steht mit seinem Bezugswort zusammen im Vorfeld.'),

    f('Nebensatz allein: das nebenan wohnt', [
      ['das', 'lsk'], ['nebenan', 'mf'], ['wohnt', 'rsk'],
    ], 'Auch das Relativpronomen ist ein Einleitungswort und steht in der linken Satzklammer.'),

    f('Hauptsatz: Hätte ich Zeit, käme ich mit.', [
      ['Hätte ich Zeit', 'vf'], ['käme', 'lsk'], ['ich', 'mf'], ['mit', 'rsk'],
    ], 'Der uneingeleitete Nebensatz besetzt das Vorfeld. „Mit“ ist die Partikel von „mitkommen“.'),

    f('Nebensatz allein: Hätte ich Zeit', [
      ['Hätte', 'lsk'], ['ich Zeit', 'mf'],
    ], 'Ohne Einleitungswort steht das finite Verb vorn in der linken Satzklammer – wie bei einer Entscheidungsfrage.'),

    {
      anweisung: 'Beantworte die Frage zum Feldermodell.',
      satz: 'Obwohl es früh war, standen alle auf.',
      frage: 'In welchem Feld des Hauptsatzes steht der Nebensatz?',
      optionen: ['Vorfeld', 'Mittelfeld', 'Nachfeld', 'linke Satzklammer'],
      richtig: 'Vorfeld',
      erklaerung: 'Direkt nach dem Nebensatz folgt das finite Verb „standen“ – also besetzt der Nebensatz das Vorfeld.',
    },
    {
      anweisung: 'Beantworte die Frage zum Feldermodell.',
      satz: 'Sie fragte, ob noch jemand mitkommt.',
      frage: 'Was steht in der linken Satzklammer des Nebensatzes?',
      optionen: ['ob', 'noch jemand', 'mitkommt', 'nichts'],
      richtig: 'ob',
      erklaerung: 'Im Nebensatz besetzt das Einleitungswort die linke Satzklammer.',
    },
    {
      anweisung: 'Beantworte die Frage zum Feldermodell.',
      satz: 'Sie fragte, ob noch jemand mitkommt.',
      frage: 'In welchem Feld des Hauptsatzes steht der Nebensatz?',
      optionen: ['Nachfeld', 'Vorfeld', 'Mittelfeld', 'rechte Satzklammer'],
      richtig: 'Nachfeld',
      erklaerung: 'Der Nebensatz folgt auf den vollständigen Hauptsatz „Sie fragte“ – er steht im Nachfeld.',
    },
    {
      anweisung: 'Beantworte die Frage zum Feldermodell.',
      satz: 'Dass du kommst, freut mich sehr.',
      frage: 'Wie viele Satzglieder stehen im Vorfeld des Hauptsatzes?',
      optionen: ['genau eines', 'zwei', 'drei', 'keines'],
      richtig: 'genau eines',
      erklaerung: 'Der ganze dass-Satz ist ein Satzglied – hier sogar das Subjekt: „Was freut mich?“',
    },
  ],
});
