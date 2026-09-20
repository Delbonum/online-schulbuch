// Übung: Flexionsart bestimmen (Konjugation, Deklination, Komparation – oder gar nicht flektierbar).

import { uebung } from './uebung.js';

const wort = (w, richtig, erklaerung) => ({ wort: w, richtig, erklaerung });

uebung('#uebung', {
  anweisung: 'Wie lässt sich dieses Wort beugen?',
  optionen: ['konjugieren', 'deklinieren', 'komparieren', 'gar nicht flektierbar'],
  aufgaben: [
    wort('schreiben', 'konjugieren', 'Ein Verb: ich schreibe, du schreibst, sie schrieb.'),
    wort('Fenster', 'deklinieren', 'Ein Nomen: das Fenster – des Fensters – den Fenstern.'),
    wort('hell', 'komparieren', 'Ein Adjektiv: hell – heller – am hellsten. Adjektive lassen sich auch deklinieren, gefragt ist hier aber die Stufe, die nur sie können.'),
    wort('obwohl', 'gar nicht flektierbar', 'Eine Konjunktion. Sie bleibt immer gleich.'),
    wort('dieses', 'deklinieren', 'Ein Demonstrativpronomen: dieser – diese – dieses – diesem.'),
    wort('gestern', 'gar nicht flektierbar', 'Ein Adverb. Adverbien verändern ihre Form nicht.'),
    wort('mutig', 'komparieren', 'Ein Adjektiv: mutig – mutiger – am mutigsten.'),
    wort('unter', 'gar nicht flektierbar', 'Eine Präposition. Sie fordert zwar einen Kasus, verändert selbst aber nie ihre Form.'),
    wort('gewinnen', 'konjugieren', 'Ein Verb: ich gewinne, wir gewannen, gewonnen.'),
    wort('Freundschaft', 'deklinieren', 'Ein Nomen: die Freundschaft – der Freundschaft – die Freundschaften.'),
    wort('sehr', 'gar nicht flektierbar', 'Eine Partikel. Sie verstärkt nur und lässt sich nicht beugen.'),
    wort('leise', 'komparieren', 'Ein Adjektiv: leise – leiser – am leisesten.'),
    wort('sie', 'deklinieren', 'Ein Personalpronomen: sie – ihrer – ihr – sie.'),
    wort('und', 'gar nicht flektierbar', 'Eine Konjunktion.'),
    wort('bleiben', 'konjugieren', 'Ein Verb: ich bleibe, er blieb, geblieben.'),
    wort('Wasser', 'deklinieren', 'Ein Nomen: das Wasser – des Wassers.'),
    wort('doch', 'gar nicht flektierbar', 'Je nach Satz Partikel oder Konjunktion – in beiden Fällen unveränderlich.'),
    wort('teuer', 'komparieren', 'Ein Adjektiv: teuer – teurer – am teuersten.'),
    wort('werden', 'konjugieren', 'Ein Verb – und zwar ein besonders wichtiges: Es bildet Futur und Passiv.'),
    wort('niemand', 'deklinieren', 'Ein Indefinitpronomen: niemand – niemandem – niemanden.'),
  ],
});
