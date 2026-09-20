// Übung: Konjunktivformen bilden und den richtigen Konjunktiv wählen.

import { uebung } from './uebung.js';

const form = (vor, frage, loesungen, erklaerung) => ({
  typ: 'eingabe',
  anweisung: 'Überführe die Verbform in die verlangte Konjunktiv-Form.',
  frage,
  vor,
  loesungen,
  erklaerung,
});

const wahl = (satz, richtig, erklaerung) => ({
  anweisung: 'Welcher Konjunktiv gehört hier hin?',
  satz,
  optionen: ['Konjunktiv I', 'Konjunktiv II'],
  richtig,
  erklaerung,
});

uebung('#uebung', {
  aufgaben: [
    form('Sie', 'Sie liest → Konjunktiv I', ['lese'], 'Infinitivstamm „les“ + Endung -e. In der 3. Person Singular fehlt das -t – und der Vokalwechsel des Indikativs entfällt.'),
    form('Sie', 'Sie liest → Konjunktiv II', ['läse', 'würde lesen'], 'Präteritum „las“ + Umlaut + e.'),
    form('Sie', 'Sie fährt → Konjunktiv II', ['führe', 'würde fahren'], 'Präteritum „fuhr“ + Umlaut + e.'),
    form('Er', 'Er weiß → Konjunktiv I', ['wisse'], 'Infinitivstamm „wiss“ + e.'),
    form('Du', 'Du weißt → Konjunktiv II', ['wüsstest', 'würdest wissen'], 'Präteritum „wusste“ + Umlaut: wüsste, wüsstest.'),
    form('Ihr', 'Ihr nehmt → Konjunktiv II', ['nähmet', 'nähmt', 'würdet nehmen'], 'Präteritum „nahmt“ + Umlaut.'),
    form('Wir', 'Wir gehen → Konjunktiv II', ['gingen', 'würden gehen'], 'Präteritum „gingen“ – hier gibt es keinen Umlaut, die Form ist mit dem Indikativ Präteritum identisch.'),
    form('Sie', 'Sie muss → Konjunktiv I', ['müsse'], 'Modalverben bilden den Konjunktiv I regelmäßig: müsse, könne, dürfe.'),
    form('Sie', 'Sie muss → Konjunktiv II', ['müsste'], 'Präteritum „musste“ + Umlaut.'),
    form('Sie', 'Sie hat → Konjunktiv I', ['habe'], 'Infinitivstamm „hab“ + e.'),
    form('Sie', 'Sie hat → Konjunktiv II', ['hätte'], 'Präteritum „hatte“ + Umlaut.'),
    form('Wir', 'Wir sind → Konjunktiv I', ['seien'], '„Sein“ ist unregelmäßig: sei, seist, sei, seien, seiet, seien.'),
    form('Wir', 'Wir sind → Konjunktiv II', ['wären'], 'Präteritum „waren“ + Umlaut.'),
    form('Du', 'Du gibst → Konjunktiv I', ['gebest'], 'Infinitivstamm „geb“ + est. Achtung: kein Vokalwechsel wie im Indikativ.'),
    form('Sie', 'Sie arbeitet → Konjunktiv II', ['würde arbeiten', 'arbeitete'], 'Ein schwaches Verb: Der Konjunktiv II ist mit dem Präteritum identisch, deshalb nimmt man die würde-Form.'),
    form('Du', 'Du singst → Konjunktiv II', ['sängest', 'sängst', 'würdest singen'], 'Präteritum „sang“ + Umlaut. Die würde-Form ist heute üblicher.'),
    form('Er', 'Er kann → Konjunktiv I', ['könne'], 'Infinitivstamm „könn“ + e.'),
    form('Ich', 'Ich laufe → Konjunktiv II', ['liefe', 'würde laufen'], 'Präteritum „lief“ + e.'),

    wahl('Die Zeitung meldet, der Verkehr ___ zusammengebrochen. (sein)', 'Konjunktiv I', 'Indirekte Rede: „sei zusammengebrochen“.'),
    wahl('Wenn ich mehr Zeit ___, würde ich öfter kochen. (haben)', 'Konjunktiv II', 'Eine irreale Bedingung: „hätte“.'),
    wahl('Er behauptet, er ___ nichts davon gewusst. (haben)', 'Konjunktiv I', 'Indirekte Rede: „habe nichts gewusst“.'),
    wahl('___ Sie mir bitte kurz helfen? (können)', 'Konjunktiv II', 'Eine höfliche Bitte: „Könnten Sie …“'),
    wahl('Sie tut so, als ___ sie das nie gehört. (haben)', 'Konjunktiv II', 'Irrealer Vergleich mit „als“: „als hätte sie das nie gehört“.'),
    wahl('Der Sprecher erklärt, die Sitzung ___ verschoben. (werden)', 'Konjunktiv I', 'Indirekte Rede: „werde verschoben“.'),
    wahl('An deiner Stelle ___ ich noch einmal nachfragen. (werden)', 'Konjunktiv II', 'Ein vorsichtiger Rat: „würde ich nachfragen“.'),

    {
      anweisung: 'Die Ersatzregel: Welche Form muss hier stehen?',
      satz: 'Die Nachbarn sagen, sie ___ nichts gehört.',
      optionen: ['hätten (Konjunktiv II als Ersatz)', 'haben (Konjunktiv I)'],
      richtig: 'hätten (Konjunktiv II als Ersatz)',
      erklaerung: 'Der Konjunktiv I „haben“ sieht aus wie der Indikativ. Deshalb weicht man auf den Konjunktiv II „hätten“ aus.',
    },
    {
      anweisung: 'Die Ersatzregel: Welche Form muss hier stehen?',
      satz: 'Der Nachbar sagt, er ___ nichts gehört.',
      optionen: ['habe (Konjunktiv I)', 'hätte (Konjunktiv II)'],
      richtig: 'habe (Konjunktiv I)',
      erklaerung: 'In der 3. Person Singular unterscheidet sich der Konjunktiv I klar vom Indikativ („hat“ gegen „habe“) – also bleibt es beim Konjunktiv I.',
    },
    {
      typ: 'eingabe',
      anweisung: 'Setze die passende Konjunktiv-Form ein und entscheide selbst, ob Konjunktiv I oder II nötig ist.',
      satz: 'Jonas erzählt, er ___ (sein) seit Montag erkältet.',
      loesungen: ['sei'],
      erklaerung: 'Indirekte Rede → Konjunktiv I: „sei“.',
    },
    {
      typ: 'eingabe',
      anweisung: 'Setze die passende Konjunktiv-Form ein und entscheide selbst, ob Konjunktiv I oder II nötig ist.',
      satz: 'Wenn er gesund ___ (sein), käme er mit.',
      loesungen: ['wäre'],
      erklaerung: 'Irreale Bedingung → Konjunktiv II: „wäre“.',
    },
    {
      typ: 'eingabe',
      anweisung: 'Setze die passende Konjunktiv-Form ein und entscheide selbst, ob Konjunktiv I oder II nötig ist.',
      satz: 'Sie berichtet, das Team ___ (müssen) die Arbeit wiederholen.',
      loesungen: ['müsse'],
      erklaerung: 'Indirekte Rede → Konjunktiv I: „müsse“.',
    },
    {
      typ: 'eingabe',
      anweisung: 'Setze die passende Konjunktiv-Form ein und entscheide selbst, ob Konjunktiv I oder II nötig ist.',
      satz: 'Hätte ich das gewusst, ___ (kommen) ich früher.',
      loesungen: ['wäre ich früher gekommen', 'wäre'],
      erklaerung: 'Irreales in der Vergangenheit: hätte/wäre + Partizip II – hier „wäre … gekommen“.',
    },
  ],
});
