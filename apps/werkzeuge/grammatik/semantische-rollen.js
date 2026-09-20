// Übung: semantische Rollen bestimmen.

import { uebung } from './uebung.js';

const ROLLEN = ['Agens', 'Patiens', 'Experiencer', 'Stimulus', 'Rezipient', 'Instrument', 'Kraft (Force)'];

const r = (satz, richtig, erklaerung) => ({ satz, richtig, erklaerung });

uebung('#uebung', {
  anweisung: 'Welche semantische Rolle hat das fett gedruckte Element in der beschriebenen Situation?',
  optionen: ROLLEN,
  aufgaben: [
    r('<b>Die Gärtnerin</b> schneidet die Hecke.', 'Agens', 'Sie handelt absichtlich. Probe: „Sie schneidet die Hecke absichtlich.“ ✓'),
    r('Die Gärtnerin schneidet <b>die Hecke</b>.', 'Patiens', 'Mit der Hecke geschieht etwas – sie wird verändert.'),
    r('<b>Der Sturm</b> riss das Vordach ab.', 'Kraft (Force)', 'Eine Naturgewalt verursacht etwas, ohne es zu wollen.'),
    r('<b>Die Spaziergängerin</b> hört ein seltsames Geräusch.', 'Experiencer', '„Hören“ ist ein Wahrnehmungsverb: Sie nimmt wahr, sie handelt nicht.'),
    r('Die Spaziergängerin hört <b>ein seltsames Geräusch</b>.', 'Stimulus', 'Das Geräusch löst die Wahrnehmung aus.'),
    r('Die Tante schenkt <b>ihrem Neffen</b> ein Fahrrad.', 'Rezipient', 'Sie bekommt etwas – die Empfängerin.'),
    r('Die Tante schenkt ihrem Neffen <b>ein Fahrrad</b>.', 'Patiens', 'Das Fahrrad ist das Übergebene. Wo zwischen Patiens und Thema unterschieden wird, wäre es ein Thema.'),
    r('Der Hausmeister öffnete die Tür <b>mit dem Zweitschlüssel</b>.', 'Instrument', 'Das Mittel, mit dem gehandelt wird.'),
    r('<b>Das Paket</b> wurde gestern zugestellt.', 'Patiens', 'Passivfalle: Obwohl es Subjekt ist, bleibt das Paket der Betroffene.'),
    r('<b>Der Film</b> begeisterte das Publikum.', 'Stimulus', 'Der Film löst das Gefühl aus.'),
    r('Der Film begeisterte <b>das Publikum</b>.', 'Experiencer', 'Das Publikum empfindet etwas.'),
    r('<b>Der Tierarzt</b> untersucht das Kaninchen.', 'Agens', 'Eine bewusste Handlung.'),
    r('Der Tierarzt untersucht <b>das Kaninchen</b>.', 'Patiens', 'Mit ihm geschieht etwas.'),
    r('<b>Die Hitze</b> ließ den Asphalt aufweichen.', 'Kraft (Force)', 'Keine Absicht – eine wirkende Kraft.'),
    r('<b>Das Kind</b> fürchtet sich vor dem Gewitter.', 'Experiencer', '„Sich fürchten“ ist ein Gefühlsverb.'),
    r('Das Kind fürchtet sich <b>vor dem Gewitter</b>.', 'Stimulus', 'Das Gewitter löst die Furcht aus.'),
    r('Die Monteurin befestigte die Lampe <b>mit einem Akkuschrauber</b>.', 'Instrument', 'Das Werkzeug ist das Mittel.'),
    r('<b>Der Nachbar</b> reparierte den Zaun.', 'Agens', 'Absichtliche Handlung.'),
    r('<b>Die Gewinnerin</b> bekam eine Urkunde überreicht.', 'Rezipient', 'Sie empfängt etwas – auch wenn sie Subjekt des Satzes ist.'),
    r('<b>Die Lawine</b> begrub die Hütte.', 'Kraft (Force)', 'Eine Naturgewalt.'),
    r('<b>Der Duft aus der Bäckerei</b> machte alle hungrig.', 'Stimulus', 'Der Duft löst die Empfindung aus.'),
    r('Der Duft aus der Bäckerei machte <b>alle</b> hungrig.', 'Experiencer', 'Sie empfinden Hunger, ohne etwas zu tun.'),
    r('Er öffnete die Flasche <b>mit einem Korkenzieher</b>.', 'Instrument', 'Das Mittel der Handlung.'),
    r('<b>Die Bibliothekarin</b> bemerkte den Fehler.', 'Experiencer', '„Bemerken“ ist Wahrnehmung, keine Handlung.'),
    r('<b>Die Straße</b> wurde von der Gemeinde gesperrt.', 'Patiens', 'Passiv: Das Subjekt ist der Betroffene.'),
    r('Die Straße wurde <b>von der Gemeinde</b> gesperrt.', 'Agens', 'Die „von“-Gruppe im Passiv nennt den Handelnden.'),
    r('<b>Die Schülerin</b> schaut sich den Film noch einmal an.', 'Agens', '„Sich anschauen“ ist absichtlich – im Unterschied zu „sehen“.'),
    r('<b>Die Schülerin</b> sieht einen Regenbogen.', 'Experiencer', '„Sehen“ passiert einem, „anschauen“ tut man.'),
    r('Der Stein traf <b>die Scheibe</b>.', 'Patiens', 'Die Scheibe ist die Betroffene.'),
    r('<b>Der Stein</b> traf die Scheibe.', 'Kraft (Force)', 'Ein Gegenstand, der eine Wirkung verursacht, ohne Absicht. Manche Grammatiken sprechen hier auch von einem Instrument – entscheidend ist: kein Agens.'),
  ],
});
