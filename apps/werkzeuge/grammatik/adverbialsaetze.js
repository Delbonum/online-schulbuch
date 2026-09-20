// Übung: Adverbialsätze nach ihrer Bedeutung bestimmen.

import { uebung } from './uebung.js';

const ARTEN = ['Temporalsatz', 'Kausalsatz', 'Finalsatz', 'Konditionalsatz', 'Konzessivsatz',
  'Konsekutivsatz', 'Modalsatz', 'Lokalsatz', 'Adversativsatz', 'Komparativsatz'];

const a = (satz, richtig, erklaerung) => ({ satz, richtig, erklaerung });

uebung('#uebung', {
  anweisung: 'Welche Art von Adverbialsatz ist fett gedruckt?',
  optionen: ARTEN,
  aufgaben: [
    a('<b>Bevor wir losfuhren</b>, prüften wir die Reifen.', 'Temporalsatz', 'Frage: „Wann?“ – „bevor“ ist eindeutig temporal.'),
    a('Die Wanderung fiel aus, <b>weil der Weg gesperrt war</b>.', 'Kausalsatz', 'Frage: „Warum?“'),
    a('Sie stellte den Wecker, <b>damit sie den Zug nicht verpasst</b>.', 'Finalsatz', 'Frage: „Wozu?“ – eine Absicht.'),
    a('<b>Falls es morgen regnet</b>, verschieben wir den Ausflug.', 'Konditionalsatz', 'Frage: „Unter welcher Bedingung?“'),
    a('<b>Obwohl sie kaum geübt hatte</b>, bestand sie die Prüfung.', 'Konzessivsatz', 'Frage: „Trotz welchen Umstands?“'),
    a('Der Nebel war so dicht, <b>dass man die Hand nicht sah</b>.', 'Konsekutivsatz', 'Frage: „Mit welcher Folge?“ – eine ungeplante Folge.'),
    a('Sie verbesserte den Text, <b>indem sie jeden Satz laut las</b>.', 'Modalsatz', 'Frage: „Wie? Wodurch?“'),
    a('Er blieb stehen, <b>wo der Weg sich gabelte</b>.', 'Lokalsatz', 'Frage: „Wo?“'),
    a('<b>Während ihr Bruder gern wandert</b>, bleibt sie lieber zu Hause.', 'Adversativsatz', 'Hier steht ein Gegensatz, keine Gleichzeitigkeit. Probe: „wohingegen“ passt.'),
    a('<b>Während das Wasser kochte</b>, schnitt sie das Gemüse.', 'Temporalsatz', 'Hier sind beide Vorgänge gleichzeitig. Probe: „solange“ passt.'),
    a('Der Weg war länger, <b>als wir gedacht hatten</b>.', 'Komparativsatz', 'Ein Vergleich nach einem Komparativ.'),
    a('<b>Wenn der Frühling kommt</b>, blühen die Kirschbäume.', 'Temporalsatz', 'Gemeint ist „immer wenn“ – also Zeit, nicht Bedingung.'),
    a('<b>Wenn du mir hilfst</b>, sind wir schneller fertig.', 'Konditionalsatz', 'Probe: „falls“ passt – also eine Bedingung.'),
    a('<b>Da niemand Bescheid gesagt hatte</b>, kam die Hälfte zu spät.', 'Kausalsatz', '„Da“ leitet einen Grund ein.'),
    a('<b>Sobald der Film zu Ende ist</b>, gehen wir.', 'Temporalsatz', 'Frage: „Wann?“'),
    a('Sie sprach lauter, <b>damit alle sie verstanden</b>.', 'Finalsatz', 'Absicht: „damit“ leitet immer einen Finalsatz ein.'),
    a('Sie sprach so laut, <b>dass alle sie verstanden</b>.', 'Konsekutivsatz', 'Hier ist es eine Folge, keine Absicht. Signal: „so … dass“.'),
    a('Er ging weiter, <b>ohne dass ihn jemand bemerkte</b>.', 'Modalsatz', '„Ohne dass“ beschreibt einen begleitenden Umstand – ein modaler Nebensatz.'),
    a('<b>Solange der Vorrat reicht</b>, gilt der Preis.', 'Temporalsatz', 'Frage: „Wie lange?“'),
    a('<b>Je länger sie übte</b>, desto sicherer wurde sie.', 'Komparativsatz', 'Die Konstruktion „je … desto“ vergleicht zwei Entwicklungen.'),
    a('<b>Anstatt dass er sich entschuldigte</b>, ging er einfach weg.', 'Adversativsatz', 'Ein Gegensatz zum Erwarteten.'),
    a('<b>Auch wenn du recht hast</b>, hilft uns das jetzt nicht.', 'Konzessivsatz', '„Auch wenn“ räumt etwas ein.'),

    {
      anweisung: 'Auch Infinitivgruppen können Adverbialsätze sein. Welche Art ist es hier?',
      satz: 'Sie kam eine Stunde früher, <b>um alles vorzubereiten</b>.',
      optionen: ['Finalsatz', 'Kausalsatz', 'Modalsatz', 'Temporalsatz'],
      richtig: 'Finalsatz',
      erklaerung: '„um … zu“ gibt immer einen Zweck an.',
    },
    {
      anweisung: 'Auch Infinitivgruppen können Adverbialsätze sein. Welche Art ist es hier?',
      satz: 'Er verließ das Haus, <b>ohne die Tür abzuschließen</b>.',
      optionen: ['Modalsatz', 'Finalsatz', 'Konzessivsatz', 'Konsekutivsatz'],
      richtig: 'Modalsatz',
      erklaerung: '„ohne … zu“ beschreibt einen begleitenden Umstand, der fehlt.',
    },
    {
      anweisung: 'Auch Infinitivgruppen können Adverbialsätze sein. Welche Art ist es hier?',
      satz: '<b>Statt sich auszuruhen</b>, begann sie gleich mit der nächsten Aufgabe.',
      optionen: ['Adversativsatz', 'Finalsatz', 'Temporalsatz', 'Kausalsatz'],
      richtig: 'Adversativsatz',
      erklaerung: '„statt … zu“ stellt einen Gegensatz zum Erwarteten her.',
    },
  ],
});
