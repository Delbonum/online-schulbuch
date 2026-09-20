// Übung: Objektarten unterscheiden – und Objekt gegen Adverbial abgrenzen.

import { uebung } from './uebung.js';

const OBJ = ['Akkusativobjekt', 'Dativobjekt', 'Genitivobjekt', 'Präpositionalobjekt'];

const o = (satz, richtig, erklaerung) => ({
  anweisung: 'Welches Objekt ist fett gedruckt?',
  satz,
  optionen: OBJ,
  richtig,
  erklaerung,
});

const ab = (satz, richtig, erklaerung) => ({
  anweisung: 'Präpositionalobjekt oder adverbiale Bestimmung?',
  satz,
  optionen: ['Präpositionalobjekt', 'adverbiale Bestimmung'],
  richtig,
  erklaerung,
});

uebung('#uebung', {
  aufgaben: [
    o('Der Mechaniker prüft <b>die Bremsen</b>.', 'Akkusativobjekt', 'Probe: „Wen oder was prüft er?“'),
    o('Sie antwortete <b>dem Kunden</b> sofort.', 'Dativobjekt', '„Antworten“ fordert den Dativ: „Wem antwortete sie?“'),
    o('Das Gericht beschuldigte ihn <b>des Betrugs</b>.', 'Genitivobjekt', 'Probe: „Wessen beschuldigte man ihn?“ – „beschuldigen“ regiert den Genitiv.'),
    o('Sie interessiert sich <b>für alte Landkarten</b>.', 'Präpositionalobjekt', '„Sich interessieren für“ ist fest. Probe: „Wofür interessiert sie sich?“'),
    o('Der Nachbar gratulierte <b>meiner Schwester</b>.', 'Dativobjekt', '„Gratulieren“ fordert den Dativ.'),
    o('Er erinnert sich <b>jenes Sommers</b> gern.', 'Genitivobjekt', 'Ein gehobener Genitiv am Verb „sich erinnern“.'),
    o('Wir haben <b>den letzten Zug</b> verpasst.', 'Akkusativobjekt', 'Probe: „Wen oder was haben wir verpasst?“'),
    o('Sie besteht <b>auf einer Entschuldigung</b>.', 'Präpositionalobjekt', '„Bestehen auf“ ist fest. Ersatzprobe: „Sie besteht darauf.“'),
    o('Das Paket gehört <b>dir</b>.', 'Dativobjekt', '„Gehören“ fordert den Dativ.'),
    o('Die Wanderin fragte <b>einen Einheimischen</b> nach dem Weg.', 'Akkusativobjekt', 'Probe: „Wen fragte sie?“'),
    o('Die Wanderin fragte einen Einheimischen <b>nach dem Weg</b>.', 'Präpositionalobjekt', '„Fragen nach“ ist fest. Probe: „Wonach fragte sie?“'),
    o('Der Vortrag besteht <b>aus drei Teilen</b>.', 'Präpositionalobjekt', '„Bestehen aus“ ist fest.'),
    o('Sie schenkte <b>ihrem Patenkind</b> ein Buch.', 'Dativobjekt', 'Probe: „Wem schenkte sie es?“'),
    o('Sie schenkte ihrem Patenkind <b>ein Buch</b>.', 'Akkusativobjekt', 'Probe: „Wen oder was schenkte sie?“'),
    o('Niemand konnte sich <b>seines Lachens</b> erwehren.', 'Genitivobjekt', '„Sich erwehren“ ist eines der wenigen Verben mit Genitiv.'),
    o('Der Trainer denkt schon <b>an die nächste Saison</b>.', 'Präpositionalobjekt', '„Denken an“ ist fest. Ersatzprobe: „Er denkt daran.“'),

    ab('Sie zweifelt <b>an seiner Aussage</b>.', 'Präpositionalobjekt', '„Zweifeln an“ ist fest. Frage: „Woran zweifelt sie?“ Ersatz: „Sie zweifelt daran.“'),
    ab('Sie sitzt <b>an ihrem Schreibtisch</b>.', 'adverbiale Bestimmung', 'Die Präposition ist austauschbar (an, vor, hinter). Frage: „Wo sitzt sie?“ Ersatz: „Sie sitzt dort.“'),
    ab('Wir rechnen <b>mit Verspätung</b>.', 'Präpositionalobjekt', '„Rechnen mit“ ist fest. Ersatz: „Wir rechnen damit.“'),
    ab('Wir fahren <b>mit dem Bus</b>.', 'adverbiale Bestimmung', 'Frage: „Womit fahren wir?“ im Sinne des Mittels. Ersatz durch ein Pronominaladverb passt nicht recht – es ist ein Modaladverbial.'),
    ab('Er ärgert sich <b>über den Lärm</b>.', 'Präpositionalobjekt', '„Sich ärgern über“ ist fest.'),
    ab('Er wohnt <b>über der Bäckerei</b>.', 'adverbiale Bestimmung', 'Frage: „Wo wohnt er?“ – ein Lokaladverbial.'),
    ab('Die Klasse bereitet sich <b>auf die Prüfung</b> vor.', 'Präpositionalobjekt', '„Sich vorbereiten auf“ ist fest. Frage: „Worauf?“'),
    ab('Die Klasse arbeitet <b>seit einer Woche</b> daran.', 'adverbiale Bestimmung', 'Frage: „Seit wann?“ – ein Temporaladverbial.'),

    {
      anweisung: 'Genitivobjekt oder Genitivattribut?',
      satz: 'Ich habe <b>den Schlüssel meiner Nachbarin</b> gefunden.',
      frage: 'Was ist „meiner Nachbarin“?',
      optionen: ['Genitivattribut', 'Genitivobjekt'],
      richtig: 'Genitivattribut',
      erklaerung: 'Es hängt am Nomen „Schlüssel“, nicht am Verb. Das ganze Element ist ein Akkusativobjekt.',
    },
    {
      anweisung: 'Genitivobjekt oder Genitivattribut?',
      satz: 'Die Arbeit bedarf <b>großer Sorgfalt</b>.',
      frage: 'Was ist „großer Sorgfalt“?',
      optionen: ['Genitivobjekt', 'Genitivattribut'],
      richtig: 'Genitivobjekt',
      erklaerung: '„Bedürfen“ fordert den Genitiv direkt – das Element hängt am Verb.',
    },
    {
      anweisung: 'Genitivobjekt oder Genitivattribut?',
      satz: 'Das Dach <b>des Nachbarhauses</b> muss neu gedeckt werden.',
      frage: 'Was ist „des Nachbarhauses“?',
      optionen: ['Genitivattribut', 'Genitivobjekt'],
      richtig: 'Genitivattribut',
      erklaerung: 'Es hängt am Nomen „Dach“ und bildet mit ihm zusammen das Subjekt.',
    },
  ],
});
