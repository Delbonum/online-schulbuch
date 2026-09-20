// Übung: Prädikativ erkennen und von Objekt, Prädikat und Adverbial unterscheiden.

import { uebung } from './uebung.js';

const p = (satz, richtig, erklaerung, optionen) => ({
  anweisung: 'Bestimme das fett gedruckte Satzglied.',
  satz,
  optionen: optionen ?? ['Prädikativ', 'Akkusativobjekt', 'Prädikat', 'Adverbial'],
  richtig,
  erklaerung,
});

uebung('#uebung', {
  aufgaben: [
    p('Meine Tante ist <b>Architektin</b>.', 'Prädikativ', 'Nach „sein“ steht das Prädikativ im Nominativ: Tante = Architektin.'),
    p('Meine Tante sucht <b>eine Architektin</b>.', 'Akkusativobjekt', 'Hier sind Tante und Architektin zwei verschiedene Personen – und der Fall ist der Akkusativ.'),
    p('Der Tee wird langsam <b>kalt</b>.', 'Prädikativ', 'Nach „werden“ folgt ein Prädikativ, das dem Subjekt eine Eigenschaft zuschreibt.'),
    p('Er <b>ist</b> ein Einzelgänger.', 'Prädikat', '„Ist“ ist die finite Verbform und damit das Prädikat. Das Prädikativ wäre „ein Einzelgänger“.'),
    p('Ein Versprechen ist und bleibt <b>ein Versprechen</b>.', 'Prädikativ', 'Zwei Kopulaverben, ein gemeinsames Prädikativ im Nominativ.'),
    p('Trotz des Lärms blieb sie <b>gelassen</b>.', 'Prädikativ', 'Nach „bleiben“ steht ein Prädikativ.'),
    p('Sie liest den Text <b>gelassen</b>.', 'Adverbial', 'Hier beschreibt „gelassen“ die Art des Lesens – ein Modaladverbial.'),
    p('Der neue Kollege heißt <b>Jonas</b>.', 'Prädikativ', '„Heißen“ gehört zu den Kopulaverben.'),
    p('Mein Onkel wohnt <b>in einer alten Mühle</b>.', 'Adverbial', 'Frage: „Wo wohnt sie?“ – ein notwendiges Lokaladverbial, kein Prädikativ.'),
    p('Ihr Bruder <b>arbeitet</b> in einer Gärtnerei.', 'Prädikat', 'Die finite Verbform „arbeitet“ ist das Prädikat.'),
    p('Der Vorschlag scheint <b>vernünftig</b>.', 'Prädikativ', '„Scheinen“ verhält sich wie ein Kopulaverb.'),
    p('Alle nannten ihn <b>einen Sturkopf</b>.', 'Prädikativ', 'Ein Objektsprädikativ: Es schreibt dem Objekt „ihn“ eine Eigenschaft zu.'),
    p('Ich finde deinen Plan <b>riskant</b>.', 'Prädikativ', 'Objektsprädikativ nach „finden“.'),
    p('Sie ist <b>im Garten</b>.', 'Adverbial', 'Auch nach „sein“ kann ein Lokaladverbial stehen, wenn es einen Ort nennt.'),
    p('Das größte Problem war <b>der fehlende Strom</b>.', 'Prädikativ', 'Nominativ nach „sein“: Problem = fehlender Strom.'),

    {
      anweisung: 'Prädikativ oder Objekt? Setze zur Probe ein maskulines Nomen ein.',
      satz: 'Sie wurde <b>eine bekannte Forscherin</b>.',
      optionen: ['Prädikativ (Nominativ)', 'Akkusativobjekt'],
      richtig: 'Prädikativ (Nominativ)',
      erklaerung: 'Probe: „Sie wurde ein bekannter Forscher.“ – Nominativ, also Prädikativ.',
    },
    {
      anweisung: 'Prädikativ oder Objekt? Setze zur Probe ein maskulines Nomen ein.',
      satz: 'Sie kennt <b>eine bekannte Forscherin</b>.',
      optionen: ['Akkusativobjekt', 'Prädikativ (Nominativ)'],
      richtig: 'Akkusativobjekt',
      erklaerung: 'Probe: „Sie kennt einen bekannten Forscher.“ – Akkusativ, also ein Objekt.',
    },
    {
      anweisung: 'Um welche Art von Nebensatz handelt es sich?',
      satz: 'Das Problem ist, <b>dass niemand die Unterlagen findet</b>.',
      optionen: ['Prädikativsatz', 'Objektsatz', 'Subjektsatz', 'Adverbialsatz'],
      richtig: 'Prädikativsatz',
      erklaerung: 'Ersatzprobe: „Das Problem ist der Verlust der Unterlagen.“ Der Nebensatz steht an der Stelle eines Prädikativs.',
    },
    {
      anweisung: 'Um welche Art von Nebensatz handelt es sich?',
      satz: '<b>Dass niemand die Unterlagen findet</b>, ist ein Problem.',
      optionen: ['Subjektsatz', 'Prädikativsatz', 'Objektsatz', 'Adverbialsatz'],
      richtig: 'Subjektsatz',
      erklaerung: 'Hier steht derselbe Nebensatz an der Subjektstelle. Probe: „Was ist ein Problem?“',
    },
  ],
});
