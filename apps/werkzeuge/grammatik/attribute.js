// Übung: Attribut oder eigenes Satzglied?

import { uebung } from './uebung.js';

const ja = (satz, richtig, erklaerung) => ({
  anweisung: 'Ist der fett gedruckte Teil ein eigenes Satzglied oder nur ein Attribut?',
  satz,
  optionen: ['eigenes Satzglied', 'Attribut (kein Satzglied)'],
  richtig,
  erklaerung,
});

const art = (satz, richtig, erklaerung) => ({
  anweisung: 'Welche Art von Attribut ist fett gedruckt?',
  satz,
  optionen: ['Adjektivattribut', 'Genitivattribut', 'Präpositionalattribut', 'Apposition', 'Attributsatz'],
  richtig,
  erklaerung,
});

uebung('#uebung', {
  aufgaben: [
    ja('Ich habe <b>den Schlüssel meiner Mutter</b> gefunden.', 'eigenes Satzglied', 'Verschiebeprobe: „Den Schlüssel meiner Mutter habe ich gefunden.“ ✓ – ein Akkusativobjekt.'),
    ja('Ich habe den Schlüssel <b>meiner Mutter</b> gefunden.', 'Attribut (kein Satzglied)', 'Ein Genitivattribut zu „Schlüssel“. Allein lässt es sich nicht verschieben.'),
    ja('Die Frau <b>mit dem grünen Mantel</b> stieg aus.', 'Attribut (kein Satzglied)', 'Ein Präpositionalattribut zu „Frau“. Probe: „Mit dem grünen Mantel stieg die Frau aus“ ändert die Bedeutung.'),
    ja('Die Frau stieg <b>an der nächsten Haltestelle</b> aus.', 'eigenes Satzglied', 'Ein Lokaladverbial. Probe: „An der nächsten Haltestelle stieg die Frau aus.“ ✓'),
    ja('Das Kind, <b>das nebenan wohnt</b>, klingelte an der Tür.', 'Attribut (kein Satzglied)', 'Ein Relativsatz als Attribut zu „Kind“. Zusammen bilden sie das Subjekt.'),
    ja('<b>Dass das Kind klingelte</b>, überraschte alle.', 'eigenes Satzglied', 'Ein Subjektsatz: Der Nebensatz steht an der Subjektstelle.'),
    ja('Sie bewunderte <b>den sorgfältig restaurierten Brunnen</b>.', 'eigenes Satzglied', 'Das ganze Element ist ein Akkusativobjekt; „sorgfältig restaurierten“ ist darin ein Attribut.'),
    ja('Er erinnerte sich <b>seiner Kindheit</b>.', 'eigenes Satzglied', 'Ein Genitivobjekt: Es hängt direkt am Verb „sich erinnern“.'),
    ja('Die Erinnerung <b>seiner Kindheit</b> verblasste.', 'Attribut (kein Satzglied)', 'Hier hängt der Genitiv am Nomen „Erinnerung“ – ein Genitivattribut.'),
    ja('Wir warten <b>auf das Ergebnis</b>.', 'eigenes Satzglied', 'Ein Präpositionalobjekt – es hängt am Verb „warten auf“.'),
    ja('Die Hoffnung <b>auf ein Ergebnis</b> schwand.', 'Attribut (kein Satzglied)', 'Hier hängt die Präpositionalgruppe am Nomen „Hoffnung“ – ein Präpositionalattribut.'),

    art('Der <b>alte</b> Brunnen steht mitten im Dorf.', 'Adjektivattribut', 'Ein Adjektiv vor dem Nomen, dekliniert.'),
    art('Das Dach <b>des Turms</b> wurde erneuert.', 'Genitivattribut', 'Ein Genitiv nach dem Nomen: „Wessen Dach?“'),
    art('Der Turm <b>aus dem 14. Jahrhundert</b> ist einsturzgefährdet.', 'Präpositionalattribut', 'Eine Präpositionalgruppe, die das Nomen näher bestimmt.'),
    art('Basel, <b>die Stadt am Rheinknie</b>, hat drei Landesgrenzen.', 'Apposition', 'Eine nachgestellte Beifügung in Kommas, im selben Fall wie das Bezugswort.'),
    art('Das Buch, <b>das auf dem Tisch liegt</b>, gehört mir.', 'Attributsatz', 'Ein Relativsatz als Attribut zu „Buch“.'),
    art('Der <b>einstürzende</b> Turm wurde gesperrt.', 'Adjektivattribut', 'Ein Partizip I, das hier wie ein Adjektiv vor dem Nomen steht – man nennt es auch Partizipattribut.'),
  ],
});
