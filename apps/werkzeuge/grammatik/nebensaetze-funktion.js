// Übung: Nebensätze nach syntaktischer Funktion bestimmen.

import { uebung } from './uebung.js';

const FUNK = ['Subjektsatz', 'Objektsatz', 'Adverbialsatz', 'Attributsatz', 'Prädikativsatz'];

const f = (satz, richtig, erklaerung) => ({ satz, richtig, erklaerung });

uebung('#uebung', {
  anweisung: 'Bestimme den fett gedruckten Nebensatz nach seiner syntaktischen Funktion.',
  optionen: FUNK,
  aufgaben: [
    f('<b>Dass sie die Prüfung bestanden hat</b>, überrascht niemanden.', 'Subjektsatz', 'Probe: „Was überrascht niemanden?“ → „Ihr Erfolg überrascht niemanden.“'),
    f('Ich befürchte, <b>dass der Zug heute ausfällt</b>.', 'Objektsatz', 'Probe: „Was befürchte ich?“ → „Ich befürchte einen Ausfall.“ Der Nebensatz steht an der Objektstelle.'),
    f('Wir räumten auf, <b>als die letzten Gäste gegangen waren</b>.', 'Adverbialsatz', 'Probe: „Wann räumten wir auf?“ → „nach dem Aufbruch der Gäste“. Genauer: ein Temporalsatz.'),
    f('Der Junge, <b>der vor mir sitzt</b>, macht ständig Notizen.', 'Attributsatz', 'Der Nebensatz hängt am Nomen „Junge“ und beschreibt ihn näher.'),
    f('Das Beste daran ist, <b>dass niemand es merkt</b>.', 'Prädikativsatz', 'Nach „sein“ steht ein Prädikativ. Probe: „Das Beste daran ist die Unauffälligkeit.“'),
    f('<b>Wer früh aufsteht</b>, hat mehr vom Tag.', 'Subjektsatz', 'Probe: „Wer hat mehr vom Tag?“ → „Der Frühaufsteher hat mehr vom Tag.“ Ein Relativsatz ohne Bezugswort in der Subjektrolle.'),
    f('Er berichtet, <b>was ihm in den Ferien aufgefallen ist</b>.', 'Objektsatz', 'Probe: „Was berichtet er?“ → „Er berichtet seine Beobachtung.“'),
    f('Sie sprach leiser, <b>damit das Kind nicht aufwachte</b>.', 'Adverbialsatz', 'Probe: „Wozu sprach sie leiser?“ → ein Finalsatz.'),
    f('<b>Wenn du früh genug losgehst</b>, erreichst du den Zug.', 'Adverbialsatz', 'Probe: „Unter welcher Bedingung?“ → ein Konditionalsatz.'),
    f('Der Vorschlag, <b>den sie gemacht hat</b>, überzeugte alle.', 'Attributsatz', 'Der Relativsatz beschreibt das Nomen „Vorschlag“.'),
    f('<b>Dass niemand abgesagt hatte</b>, war ein gutes Zeichen.', 'Subjektsatz', 'Probe: „Was war ein gutes Zeichen?“'),
    f('Er las die Zeitung, <b>nachdem er gefrühstückt hatte</b>.', 'Adverbialsatz', 'Probe: „Wann las er die Zeitung?“ → ein Temporalsatz.'),
    f('Niemand wusste, <b>ob der Zug noch fährt</b>.', 'Objektsatz', 'Ein indirekter Fragesatz an der Objektstelle: „Was wusste niemand?“'),
    f('Es freut mich, <b>dass ihr gekommen seid</b>.', 'Subjektsatz', '„Es“ ist nur ein Platzhalter. Probe: „Euer Kommen freut mich.“'),
    f('Die Frage ist, <b>ob sich der Aufwand lohnt</b>.', 'Prädikativsatz', 'Nach „sein“: „Die Frage ist der Nutzen.“'),
    f('Wir warten darauf, <b>dass sich der Nebel auflöst</b>.', 'Objektsatz', 'Das Pronominaladverb „darauf“ kündigt ein Präpositionalobjekt an – der Nebensatz nimmt dessen Platz ein.'),
    f('Das Haus, <b>in dem sie aufgewachsen ist</b>, wurde verkauft.', 'Attributsatz', 'Ein Relativsatz mit Präposition, der das Nomen „Haus“ näher bestimmt.'),
    f('<b>Obwohl alle gewarnt hatten</b>, fuhr er weiter.', 'Adverbialsatz', 'Probe: „Trotz welchen Umstands?“ → ein Konzessivsatz.'),
    f('Ich verstehe nicht, <b>warum niemand etwas gesagt hat</b>.', 'Objektsatz', 'Probe: „Was verstehe ich nicht?“ Ein indirekter Fragesatz in der Objektrolle.'),
    f('Mir ist wichtig, <b>dass alle mitreden können</b>.', 'Subjektsatz', 'Probe: „Was ist mir wichtig?“ → „Die Beteiligung aller ist mir wichtig.“ „Mir“ ist dabei ein Dativobjekt.'),
  ],
});
