// Übung: Satzglieder gemischt bestimmen.

import { uebung } from './uebung.js';

const ALLE = ['Subjekt', 'Prädikat', 'Akkusativobjekt', 'Dativobjekt', 'Genitivobjekt', 'Präpositionalobjekt',
  'Lokaladverbial', 'Temporaladverbial', 'Modaladverbial', 'Kausaladverbial', 'Prädikativ'];

const s = (satz, richtig, erklaerung) => ({ satz, richtig, erklaerung });

uebung('#uebung', {
  anweisung: 'Bestimme das fett gedruckte Satzglied.',
  optionen: ALLE,
  aufgaben: [
    s('<b>Die alte Lampe</b> flackert schon wieder.', 'Subjekt', 'Probe: „Wer oder was flackert?“ Außerdem richtet sich die Verbform danach.'),
    s('Er <b>verschenkte</b> sein altes Fahrrad.', 'Prädikat', 'Die finite Verbform bildet den Kern des Satzes.'),
    s('Der Junge <b>hat</b> das Fenster <b>geschlossen</b>.', 'Prädikat', 'Das Prädikat kann aus mehreren Verbformen bestehen: Hilfsverb + Partizip II.'),
    s('Sie öffnet <b>das Fenster</b>.', 'Akkusativobjekt', 'Probe: „Wen oder was öffnet sie?“'),
    s('Der Arzt half <b>dem Verletzten</b>.', 'Dativobjekt', 'Probe: „Wem half der Arzt?“ – „helfen“ fordert den Dativ.'),
    s('Sie bedurfte <b>keiner weiteren Hilfe</b>.', 'Genitivobjekt', 'Probe: „Wessen bedurfte sie?“ Genitivobjekte sind selten und klingen gehoben.'),
    s('Wir freuen uns <b>über die Nachricht</b>.', 'Präpositionalobjekt', '„Sich freuen über“ ist eine feste Verbindung: Das Verb verlangt genau diese Präposition. Probe: „Worüber freuen wir uns?“'),
    s('<b>Im Keller</b> steht ein altes Klavier.', 'Lokaladverbial', 'Probe: „Wo steht es?“'),
    s('<b>Nächsten Montag</b> beginnt der Kurs.', 'Temporaladverbial', 'Probe: „Wann beginnt der Kurs?“'),
    s('Sie las den Text <b>sehr langsam</b>.', 'Modaladverbial', 'Probe: „Wie las sie den Text?“'),
    s('<b>Wegen des dichten Nebels</b> fiel der Flug aus.', 'Kausaladverbial', 'Probe: „Warum fiel der Flug aus?“'),
    s('Mein Onkel ist <b>Schreiner</b>.', 'Prädikativ', 'Nach „sein“ folgt kein Objekt, sondern ein Prädikativ: Es sagt, was das Subjekt ist.'),
    s('Er schnitt das Brot <b>mit einem scharfen Messer</b>.', 'Modaladverbial', 'Probe: „Womit schnitt er?“ Ein Adverbial des Mittels gehört zu den Modaladverbialen. Semantisch ist es ein Instrument.'),
    s('Sie denkt schon lange <b>an ihre Prüfung</b>.', 'Präpositionalobjekt', '„Denken an“ ist fest. Probe: „Woran denkt sie?“'),
    s('Der Zug fährt <b>nach Chur</b>.', 'Lokaladverbial', 'Probe: „Wohin fährt der Zug?“ – Richtung, also lokal.'),
    s('Der Kellner reichte <b>dem Gast</b> die Karte.', 'Dativobjekt', 'Probe: „Wem reichte er die Karte?“'),
    s('Der Kellner reichte dem Gast <b>die Karte</b>.', 'Akkusativobjekt', 'Probe: „Wen oder was reichte er?“'),
    s('<b>Nach dem Konzert</b> gingen alle noch essen.', 'Temporaladverbial', 'Probe: „Wann gingen alle essen?“ Die Präposition „nach“ ist hier nicht vom Verb gefordert.'),
    s('Das Kind blieb <b>ruhig</b>.', 'Prädikativ', 'Nach „bleiben“ steht ein Prädikativ, das dem Subjekt eine Eigenschaft zuschreibt.'),
    s('<b>Der Hund meiner Nachbarin</b> bellt nachts.', 'Subjekt', 'Das ganze Element ist ein Satzglied. „Meiner Nachbarin“ ist darin nur ein Attribut.'),
    s('Sie hofft <b>auf besseres Wetter</b>.', 'Präpositionalobjekt', '„Hoffen auf“ ist fest: Das Verb verlangt genau diese Präposition. Probe: „Worauf hofft sie?“'),
    s('Sie wartet <b>vor dem Kino</b>.', 'Lokaladverbial', 'Hier ist die Präposition frei wählbar (im, beim, hinter dem …) und beantwortet „Wo?“ – also kein Objekt.'),
    s('<b>Trotz der Kälte</b> blieben alle draußen.', 'Kausaladverbial', 'Ein konzessives Adverbial („trotz welchen Umstands?“) gehört zur Gruppe der kausalen Adverbiale im weiteren Sinn.'),
    s('<b>Jeden Sommer</b> fahren wir ans Meer.', 'Temporaladverbial', 'Probe: „Wann?“ – Auch ein Akkusativ ohne Präposition kann ein Adverbial sein.'),
    s('Sie fährt <b>mit dem Velo</b> zur Schule.', 'Modaladverbial', 'Probe: „Womit fährt sie?“ – Mittel, also modal.'),
    s('<b>Dieser Vorschlag</b> gefällt mir.', 'Subjekt', 'Probe: „Wer oder was gefällt?“ Das Subjekt muss nicht handeln.'),
    s('Dieser Vorschlag gefällt <b>mir</b>.', 'Dativobjekt', '„Gefallen“ fordert den Dativ.'),
    s('Sie ist <b>eine ausgezeichnete Pianistin</b>.', 'Prädikativ', 'Nach „sein“ steht das Prädikativ im Nominativ – kein Akkusativobjekt.'),
    s('Er legte das Buch <b>auf den Tisch</b>.', 'Lokaladverbial', 'Probe: „Wohin legte er es?“ Die Präposition ist frei wählbar (unter, neben, hinter) – also kein Präpositionalobjekt.'),
    s('<b>Aus Angst</b> sagte er nichts.', 'Kausaladverbial', 'Probe: „Warum sagte er nichts?“'),
    s('Sie arbeitet <b>seit drei Jahren</b> in Basel.', 'Temporaladverbial', 'Probe: „Seit wann arbeitet sie dort?“'),
    s('Ich danke <b>dir</b> herzlich.', 'Dativobjekt', '„Danken“ fordert den Dativ.'),
    s('Die Biologin beschrieb <b>die seltene Pflanze</b>.', 'Akkusativobjekt', 'Probe: „Wen oder was beschrieb sie?“'),
    s('<b>Am späten Abend</b> fährt der letzte Bus.', 'Temporaladverbial', 'Probe: „Wann fährt er?“'),
  ],
});
