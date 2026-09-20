// Übung: adverbiale Bestimmungen – Hauptgruppe und feine Einteilung.

import { uebung } from './uebung.js';

const HAUPT = ['Lokaladverbial', 'Temporaladverbial', 'Modaladverbial', 'Kausaladverbial'];

const h = (satz, richtig, erklaerung) => ({
  anweisung: 'Welche Hauptgruppe? Nutze die Grundfragen Wo? Wann? Wie? Warum?',
  satz,
  optionen: HAUPT,
  richtig,
  erklaerung,
});

const fein = (satz, optionen, richtig, erklaerung) => ({
  anweisung: 'Bestimme die Unterart genau.',
  satz,
  optionen,
  richtig,
  erklaerung,
});

const LOKAL = ['Ort (Wo?)', 'Richtung (Wohin?)', 'Herkunft (Woher?)', 'Distanz (Wie weit?)'];
const TEMP = ['Zeitpunkt (Wann?)', 'Dauer (Wie lange?)', 'Zeitraum (Seit wann?)', 'Frequenz (Wie oft?)'];
const MODAL = ['Art und Weise (Wie?)', 'Instrumental (Womit?)', 'Vergleich (Wie … wie?)', 'Grad (Wie sehr?)'];
const KAUSAL = ['kausal (Grund)', 'final (Zweck)', 'konditional (Bedingung)', 'konzessiv (Einräumung)', 'konsekutiv (Folge)'];

uebung('#uebung', {
  aufgaben: [
    h('<b>Im Treppenhaus</b> roch es nach frischer Farbe.', 'Lokaladverbial', 'Frage: „Wo?“'),
    h('Der Unterricht beginnt <b>um acht Uhr</b>.', 'Temporaladverbial', 'Frage: „Wann?“'),
    h('Sie erklärte den Weg <b>sehr geduldig</b>.', 'Modaladverbial', 'Frage: „Wie?“'),
    h('<b>Aus Angst vor der Prüfung</b> lernte er die ganze Nacht.', 'Kausaladverbial', 'Frage: „Warum?“'),
    h('Wir gingen <b>durch den Park</b> nach Hause.', 'Lokaladverbial', 'Frage: „Wo entlang / wohin?“'),
    h('<b>Nach drei Stunden</b> war die Sitzung endlich zu Ende.', 'Temporaladverbial', 'Frage: „Wann?“'),
    h('Er zerlegte den Schrank <b>mit einem Schraubenzieher</b>.', 'Modaladverbial', 'Frage: „Womit?“ – ein instrumentales Modaladverbial.'),
    h('<b>Zur Sicherheit</b> nahm sie einen Schirm mit.', 'Kausaladverbial', 'Frage: „Wozu?“ – final, also zur kausalen Gruppe gehörend.'),
    h('Sie las den Brief <b>zweimal</b>.', 'Temporaladverbial', 'Frage: „Wie oft?“ – Frequenz.'),
    h('<b>Bei schlechtem Wetter</b> bleibt der Markt geschlossen.', 'Kausaladverbial', 'Frage: „Unter welcher Bedingung?“ – konditional.'),
    h('Der Wanderweg führt <b>am Fluss entlang</b>.', 'Lokaladverbial', 'Frage: „Wo entlang?“'),
    h('Sie sprach <b>wie eine Politikerin</b>.', 'Modaladverbial', 'Ein Vergleich – gehört zu den Modaladverbialen.'),

    fein('Der Hund lief <b>in den Garten</b>.', LOKAL, 'Richtung (Wohin?)', 'Der Akkusativ nach „in“ zeigt die Richtung an.'),
    fein('Der Hund schlief <b>im Garten</b>.', LOKAL, 'Ort (Wo?)', 'Der Dativ nach „in“ zeigt den Ort an.'),
    fein('Der Brief kam <b>aus Kanada</b>.', LOKAL, 'Herkunft (Woher?)', 'Frage: „Woher kam der Brief?“'),
    fein('Sie schwammen <b>zwei Kilometer weit</b>.', LOKAL, 'Distanz (Wie weit?)', 'Frage: „Wie weit?“ – ein Adverbial der Erstreckung.'),

    fein('<b>Morgen früh</b> fahren wir los.', TEMP, 'Zeitpunkt (Wann?)', 'Frage: „Wann?“'),
    fein('Die Reise dauerte <b>zwei Wochen</b>.', TEMP, 'Dauer (Wie lange?)', 'Frage: „Wie lange?“'),
    fein('Sie arbeitet <b>seit dem Frühling</b> hier.', TEMP, 'Zeitraum (Seit wann?)', 'Frage: „Seit wann?“ – der Beginn eines Zeitraums.'),
    fein('Er ruft <b>jeden Sonntag</b> an.', TEMP, 'Frequenz (Wie oft?)', 'Frage: „Wie oft?“'),

    fein('Sie erklärte es <b>ausführlich</b>.', MODAL, 'Art und Weise (Wie?)', 'Frage: „Wie erklärte sie es?“'),
    fein('Er öffnete den Brief <b>mit einem Messer</b>.', MODAL, 'Instrumental (Womit?)', 'Frage: „Womit?“ – das Mittel der Handlung.'),
    fein('Das Kind schlief <b>wie ein Stein</b>.', MODAL, 'Vergleich (Wie … wie?)', 'Ein Vergleich mit „wie“.'),
    fein('Die Kosten stiegen <b>um ein Drittel</b>.', MODAL, 'Grad (Wie sehr?)', 'Frage: „Um wie viel?“ – eine Angabe des Maßes.'),

    fein('<b>Wegen des Unfalls</b> war die Straße gesperrt.', KAUSAL, 'kausal (Grund)', 'Frage: „Warum?“'),
    fein('Sie trainiert <b>für den Wettkampf</b>.', KAUSAL, 'final (Zweck)', 'Frage: „Wozu trainiert sie?“'),
    fein('<b>Ohne deine Hilfe</b> hätten wir es nicht geschafft.', KAUSAL, 'konditional (Bedingung)', 'Frage: „Unter welcher Bedingung?“ Umformuliert: „Wenn du nicht geholfen hättest …“'),
    fein('<b>Trotz der frühen Stunde</b> war der Laden voll.', KAUSAL, 'konzessiv (Einräumung)', 'Frage: „Trotz welchen Umstands?“'),
    fein('Er lachte <b>bis zur Erschöpfung</b>.', KAUSAL, 'konsekutiv (Folge)', 'Frage: „Mit welcher Folge?“'),

    {
      anweisung: 'Notwendig oder frei?',
      satz: 'Meine Großeltern wohnen <b>in einem alten Bauernhaus</b>.',
      optionen: ['notwendiges Adverbial', 'freies Adverbial'],
      richtig: 'notwendiges Adverbial',
      erklaerung: '„Wohnen“ verlangt eine Ortsangabe: „Meine Großeltern wohnen.“ ist unvollständig.',
    },
    {
      anweisung: 'Notwendig oder frei?',
      satz: 'Meine Großeltern frühstücken <b>in der Küche</b>.',
      optionen: ['freies Adverbial', 'notwendiges Adverbial'],
      richtig: 'freies Adverbial',
      erklaerung: '„Meine Großeltern frühstücken.“ ist ein vollständiger Satz.',
    },
  ],
});
