// Übung: Haupt- oder Nebensatz, Satzreihe oder Satzgefüge.

import { uebung } from './uebung.js';

const hn = (satz, richtig, erklaerung) => ({
  anweisung: 'Ist der fett gedruckte Teilsatz ein Hauptsatz oder ein Nebensatz?',
  satz,
  optionen: ['Hauptsatz', 'Nebensatz'],
  richtig,
  erklaerung,
});

const gefuege = (satz, richtig, erklaerung) => ({
  anweisung: 'Satzreihe oder Satzgefüge?',
  satz,
  optionen: ['Satzreihe', 'Satzgefüge'],
  richtig,
  erklaerung,
});

uebung('#uebung', {
  aufgaben: [
    hn('Sie ging früher, <b>weil sie noch einkaufen musste</b>.', 'Nebensatz', 'Das finite Verb „musste“ steht am Ende.'),
    hn('Sie ging früher, <b>denn sie musste noch einkaufen</b>.', 'Hauptsatz', 'Nach „denn“ bleibt das Verb an zweiter Stelle – „denn“ ist nebenordnend.'),
    hn('<b>Als der Regen aufhörte</b>, gingen wir hinaus.', 'Nebensatz', '„Aufhörte“ steht am Ende.'),
    hn('Es hörte auf zu regnen, <b>und wir gingen hinaus</b>.', 'Hauptsatz', '„Gingen“ steht an zweiter Stelle; „und“ verbindet zwei gleichrangige Sätze.'),
    hn('Das Buch, <b>das du gesucht hast</b>, liegt im Regal.', 'Nebensatz', 'Ein Relativsatz mit Verb am Ende.'),
    hn('<b>Ich weiß nicht</b>, ob der Laden offen ist.', 'Hauptsatz', '„Weiß“ steht an zweiter Stelle – das ist der übergeordnete Satz.'),
    hn('Ich weiß nicht, <b>ob der Laden offen ist</b>.', 'Nebensatz', '„Ist“ steht am Ende – ein indirekter Fragesatz.'),
    hn('<b>Obwohl es spät war</b>, arbeitete sie weiter.', 'Nebensatz', '„War“ steht am Ende.'),

    gefuege('Der Zug hatte Verspätung, deshalb kamen wir zu spät.', 'Satzreihe', '„Deshalb“ ist ein Adverb im Vorfeld: „kamen“ steht an zweiter Stelle. Zwei Hauptsätze.'),
    gefuege('Wir kamen zu spät, weil der Zug Verspätung hatte.', 'Satzgefüge', '„Hatte“ steht am Ende – ein Nebensatz ist untergeordnet.'),
    gefuege('Sie räumte auf, und er kochte das Abendessen.', 'Satzreihe', 'Zwei gleichrangige Hauptsätze mit „und“.'),
    gefuege('Während sie aufräumte, kochte er das Abendessen.', 'Satzgefüge', 'Der „während“-Satz ist untergeordnet.'),
    gefuege('Es war kalt, aber niemand beschwerte sich.', 'Satzreihe', '„Aber“ ist nebenordnend.'),
    gefuege('Niemand beschwerte sich, obwohl es kalt war.', 'Satzgefüge', '„Obwohl“ ist unterordnend.'),

    {
      anweisung: 'An welcher Stelle steht der Nebensatz?',
      satz: '<b>Bevor wir losfuhren</b>, prüften wir den Reifendruck.',
      optionen: ['Vordersatz (im Vorfeld)', 'Nachsatz (im Nachfeld)', 'Zwischensatz (eingeschoben)'],
      richtig: 'Vordersatz (im Vorfeld)',
      erklaerung: 'Direkt nach dem Nebensatz steht das finite Verb „prüften“ – also besetzt der Nebensatz das Vorfeld.',
    },
    {
      anweisung: 'An welcher Stelle steht der Nebensatz?',
      satz: 'Wir prüften den Reifendruck, <b>bevor wir losfuhren</b>.',
      optionen: ['Nachsatz (im Nachfeld)', 'Vordersatz (im Vorfeld)', 'Zwischensatz (eingeschoben)'],
      richtig: 'Nachsatz (im Nachfeld)',
      erklaerung: 'Der Nebensatz folgt dem vollständigen Hauptsatz und steht damit im Nachfeld.',
    },
    {
      anweisung: 'An welcher Stelle steht der Nebensatz?',
      satz: 'Der Reifen, <b>der schon alt war</b>, platzte auf der Autobahn.',
      optionen: ['Zwischensatz (eingeschoben)', 'Vordersatz (im Vorfeld)', 'Nachsatz (im Nachfeld)'],
      richtig: 'Zwischensatz (eingeschoben)',
      erklaerung: 'Der Relativsatz steht mitten im Subjekt und wird beidseitig durch Kommas abgetrennt.',
    },
    {
      anweisung: 'Wie viele Nebensätze enthält dieser Satz?',
      satz: 'Sie erzählte, dass sie umziehe, sobald die Wohnung frei werde.',
      optionen: ['zwei', 'einen', 'drei', 'keinen'],
      richtig: 'zwei',
      erklaerung: 'Der dass-Satz hängt am Hauptsatz (1. Grades), der sobald-Satz hängt am dass-Satz (2. Grades).',
    },
  ],
});
