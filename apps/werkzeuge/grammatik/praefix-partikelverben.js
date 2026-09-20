// Übung: Partikelverb oder Präfixverb?

import { uebung } from './uebung.js';

const v = (satz, richtig, erklaerung) => ({
  anweisung: 'Handelt es sich um ein Partikelverb (trennbar) oder ein Präfixverb (untrennbar)?',
  satz,
  optionen: ['Partikelverb', 'Präfixverb'],
  richtig,
  erklaerung,
});

uebung('#uebung', {
  aufgaben: [
    v('Wir sollten die Reste noch <b>einpacken</b>.', 'Partikelverb', 'Probe: „Wir packen die Reste ein.“ Betonung auf „ein“.'),
    v('Wir müssen die Aufgaben noch <b>verteilen</b>.', 'Präfixverb', 'Probe: „Wir verteilen die Aufgaben.“ Nichts wandert ans Ende; „ver-“ ist untrennbar.'),
    v('Sie konnte den Fehler schnell <b>entdecken</b>.', 'Präfixverb', '„ent-“ ist immer untrennbar. Partizip II: entdeckt, ohne ge-.'),
    v('Der Bus wird gleich <b>losfahren</b>.', 'Partikelverb', 'Probe: „Der Bus fährt los.“'),
    v('Wir mussten den ganzen Wald <b>durchqueren</b>.', 'Präfixverb', 'Betonung auf „que“: „Wir durchqueren den Wald.“ Nichts wandert ans Ende.'),
    v('Ich muss die Unterlagen noch <b>durchsehen</b>.', 'Partikelverb', 'Räumlich-wörtliche Bedeutung: „Ich sehe die Unterlagen durch.“'),
    v('Du musst den Vertrag noch <b>unterschreiben</b>.', 'Präfixverb', 'Probe: „Du unterschreibst den Vertrag.“ Partizip II: unterschrieben, ohne ge-.'),
    v('Die Fähre kann uns gleich <b>übersetzen</b>.', 'Partikelverb', 'Wörtliche Bedeutung: „Die Fähre setzt uns über.“'),
    v('Wir wollten euch nur kurz <b>besuchen</b>.', 'Präfixverb', '„be-“ ist immer untrennbar.'),
    v('Kannst du mich morgen <b>anrufen</b>?', 'Partikelverb', 'Probe: „Du rufst mich an.“'),
    v('Der Himmel wird sich im See <b>widerspiegeln</b>.', 'Partikelverb', 'Sonderfall: „widerspiegeln“ ist trennbar – „Der Himmel spiegelt sich im See wider.“ Alle anderen wider-Verben (widersprechen, widersetzen) sind untrennbar.'),
    v('Niemand konnte sich dem allgemeinen Trend <b>widersetzen</b>.', 'Präfixverb', '„wider-“ ist hier untrennbar: „Sie widersetzt sich.“'),
    v('Niemand konnte sich ihrer Wirkung <b>entziehen</b>.', 'Präfixverb', '„ent-“ ist immer untrennbar.'),
    v('Wir sollten die Kisten gemeinsam <b>hochtragen</b>.', 'Partikelverb', 'Probe: „Wir tragen die Kisten hoch.“'),
    v('Sie musste die Rechnung zweimal <b>bezahlen</b>.', 'Präfixverb', '„be-“ ist untrennbar; Partizip II: bezahlt.'),
    v('Bitte <b>zumachen</b> nicht vergessen!', 'Partikelverb', 'Probe: „Mach bitte zu.“'),
    v('Er wollte den Vorwurf sofort <b>zerstreuen</b>.', 'Präfixverb', '„zer-“ ist immer untrennbar.'),
    v('Ich werde die Frage gern <b>wiederholen</b>.', 'Präfixverb', 'Übertragene Bedeutung: „Ich wiederhole die Frage.“ Betonung auf „ho“.'),
    v('Der Fahrer musste das Hindernis <b>umfahren</b>.', 'Präfixverb', 'Übertragen-räumlich „außen herum“: „Er umfährt das Hindernis.“ Mit der Bedeutung „dagegen fahren“ wäre es trennbar.'),
    v('Sie hat den Text noch nicht <b>ausgedruckt</b>.', 'Partikelverb', 'Das ge- steht in der Mitte: aus-ge-druckt.'),
    v('Das Ergebnis konnte niemand <b>vorhersehen</b>.', 'Partikelverb', 'Probe: „Niemand sieht das vorher.“ Partizip II: vorhergesehen.'),

    {
      anweisung: 'Wie lautet das Partizip II?',
      typ: 'eingabe',
      wort: 'einladen',
      loesungen: ['eingeladen'],
      erklaerung: 'Trennbar, also ge- in der Mitte.',
    },
    {
      anweisung: 'Wie lautet das Partizip II?',
      typ: 'eingabe',
      wort: 'bekommen',
      loesungen: ['bekommen'],
      erklaerung: 'Untrennbar – kein ge-. Die Form ist identisch mit dem Infinitiv.',
    },
    {
      anweisung: 'Wie lautet das Partizip II?',
      typ: 'eingabe',
      wort: 'zurückgeben',
      loesungen: ['zurückgegeben'],
      erklaerung: 'Trennbar: zurück-ge-geben.',
    },
    {
      anweisung: 'Wie lautet der Infinitiv mit „zu“?',
      typ: 'eingabe',
      wort: 'aufräumen',
      loesungen: ['aufzuräumen'],
      erklaerung: 'Bei trennbaren Verben steht das „zu“ in der Mitte.',
    },
    {
      anweisung: 'Wie lautet der Infinitiv mit „zu“?',
      typ: 'eingabe',
      wort: 'verstehen',
      loesungen: ['zu verstehen'],
      erklaerung: 'Bei untrennbaren Verben steht das „zu“ davor.',
    },
  ],
});
