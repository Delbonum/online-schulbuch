// Übung: Steigerungsformen bilden und erkennen.

import { uebung } from './uebung.js';

const stufe = (satz, richtig, erklaerung) => ({
  anweisung: 'In welcher Steigerungsstufe steht die fett gedruckte Form?',
  satz,
  optionen: ['Positiv', 'Komparativ', 'Superlativ'],
  richtig,
  erklaerung,
});

const bilden = (frage, loesungen, erklaerung) => ({
  anweisung: 'Bilde die verlangte Form.',
  typ: 'eingabe',
  frage,
  loesungen,
  erklaerung,
});

uebung('#uebung', {
  aufgaben: [
    stufe('Der Weg über die Brücke ist <b>kürzer</b>.', 'Komparativ', 'Endung -er, dazu Umlaut.'),
    stufe('Das ist der <b>schönste</b> Platz im Park.', 'Superlativ', 'Superlativ vor einem Nomen, deshalb dekliniert.'),
    stufe('Der Kaffee ist heute <b>stark</b>.', 'Positiv', 'Die Grundform ohne Vergleich.'),
    stufe('Sie schwimmt <b>am liebsten</b> im See.', 'Superlativ', 'Unregelmäßig: gern – lieber – am liebsten.'),
    stufe('Dieses Buch finde ich <b>interessanter</b> als das andere.', 'Komparativ', 'Erkennbar am „als“.'),
    stufe('Heute ist es <b>so warm wie</b> gestern.', 'Positiv', 'Der Vergleich mit „so … wie“ steht im Positiv.'),
    stufe('Er hat <b>mehr</b> Zeit als ich.', 'Komparativ', 'Unregelmäßig: viel – mehr – am meisten.'),
    stufe('Der Turm ist <b>am höchsten</b>.', 'Superlativ', 'Unregelmäßig: hoch – höher – am höchsten.'),

    bilden('alt → Komparativ', ['älter'], 'Kurze Adjektive bekommen oft einen Umlaut.'),
    bilden('breit → Superlativ (mit „am“)', ['am breitesten'], 'Nach -t wird ein e eingeschoben: am breitesten.'),
    bilden('dunkel → Komparativ', ['dunkler'], 'Bei -el fällt das e weg: dunkler.'),
    bilden('gut → Superlativ (mit „am“)', ['am besten'], 'Unregelmäßig: gut – besser – am besten.'),
    bilden('teuer → Komparativ', ['teurer'], 'Bei -er fällt das e weg: teurer.'),
    bilden('nah → Komparativ', ['näher'], 'Unregelmäßig: nah – näher – am nächsten.'),
    bilden('hübsch → Superlativ (mit „am“)', ['am hübschesten'], 'Nach -sch wird ein e eingeschoben.'),
    bilden('viel → Komparativ', ['mehr'], 'Unregelmäßig: viel – mehr – am meisten.'),
    bilden('jung → Superlativ (mit „am“)', ['am jüngsten'], 'Umlaut und Endung -sten.'),
    bilden('gern → Komparativ', ['lieber'], 'Ein Adverb, das sich trotzdem steigern lässt.'),

    {
      anweisung: 'Lässt sich dieses Adjektiv sinnvoll steigern?',
      wort: 'schwer',
      optionen: ['ja, komparierbar', 'nein, nicht komparierbar'],
      richtig: 'ja, komparierbar',
      erklaerung: 'schwer – schwerer – am schwersten.',
    },
    {
      anweisung: 'Lässt sich dieses Adjektiv sinnvoll steigern?',
      wort: 'tot',
      optionen: ['nein, nicht komparierbar', 'ja, komparierbar'],
      richtig: 'nein, nicht komparierbar',
      erklaerung: 'Ein absoluter Zustand: Man kann nicht „töter“ sein. Trotzdem bleibt „tot“ ein Adjektiv – es passt zwischen Artikel und Nomen: der tote Baum.',
    },
    {
      anweisung: 'Lässt sich dieses Adjektiv sinnvoll steigern?',
      wort: 'hölzern',
      optionen: ['nein, nicht komparierbar', 'ja, komparierbar'],
      richtig: 'nein, nicht komparierbar',
      erklaerung: 'Zuordnung zu einem Material. Adjektiv ist es trotzdem: der hölzerne Steg.',
    },
    {
      anweisung: 'Lässt sich dieses Adjektiv sinnvoll steigern?',
      wort: 'aufmerksam',
      optionen: ['ja, komparierbar', 'nein, nicht komparierbar'],
      richtig: 'ja, komparierbar',
      erklaerung: 'aufmerksam – aufmerksamer – am aufmerksamsten.',
    },
    {
      anweisung: 'Lässt sich dieses Adjektiv sinnvoll steigern?',
      wort: 'viereckig',
      optionen: ['nein, nicht komparierbar', 'ja, komparierbar'],
      richtig: 'nein, nicht komparierbar',
      erklaerung: 'Eine Form ist viereckig oder nicht – dazwischen gibt es nichts.',
    },
    {
      anweisung: 'Welcher Vergleich ist richtig?',
      frage: 'Ergänze: Der Zug ist schneller ___ das Auto.',
      optionen: ['als', 'wie'],
      richtig: 'als',
      erklaerung: 'Nach dem Komparativ steht „als“.',
    },
    {
      anweisung: 'Welcher Vergleich ist richtig?',
      frage: 'Ergänze: Der Zug ist genauso schnell ___ das Auto.',
      optionen: ['wie', 'als'],
      richtig: 'wie',
      erklaerung: 'Nach dem Positiv (so/genauso) steht „wie“.',
    },
  ],
});
