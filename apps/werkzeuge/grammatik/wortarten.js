// Übung: Wortarten gemischt bestimmen.

import { uebung } from './uebung.js';

const ALLE = ['Verb', 'Nomen', 'Adjektiv', 'Artikel', 'Pronomen', 'Adverb', 'Präposition', 'Konjunktion', 'Partikel'];

const w = (wort, richtig, erklaerung) => ({ wort, richtig, erklaerung });
const s = (satz, richtig, erklaerung) => ({ satz, richtig, erklaerung });

uebung('#uebung', {
  anweisung: 'Bestimme die Wortart.',
  optionen: ALLE,
  aufgaben: [
    w('Fahrrad', 'Nomen', 'Artikelfähig: das Fahrrad. Und deklinierbar: des Fahrrads, den Fahrrädern.'),
    w('rennen', 'Verb', 'Konjugierbar: ich renne, du rennst, sie rannte.'),
    w('hilfsbereit', 'Adjektiv', 'Komparierbar (hilfsbereiter) und zwischen Artikel und Nomen einsetzbar: der hilfsbereite Nachbar.'),
    w('weil', 'Konjunktion', 'Unveränderlich, nicht vorfeldfähig, fordert keinen Kasus – und verknüpft einen Nebensatz mit dem Hauptsatz.'),
    w('neben', 'Präposition', 'Unveränderlich und fordert einen Kasus: neben dem Haus (Dativ), neben das Haus (Akkusativ).'),
    w('sehr', 'Partikel', 'Unveränderlich, nicht vorfeldfähig, kein Kasus, keine Verknüpfung – es verstärkt nur.'),
    w('manchmal', 'Adverb', 'Unveränderlich, aber vorfeldfähig: „Manchmal regnet es.“'),
    w('Gerechtigkeit', 'Nomen', 'Auch abstrakte Begriffe sind Nomen: die Gerechtigkeit.'),
    w('wachsen', 'Verb', 'Konjugierbar: es wächst, es wuchs, gewachsen.'),
    w('neugierig', 'Adjektiv', 'neugierig – neugieriger – am neugierigsten; das neugierige Kind.'),
    w('obwohl', 'Konjunktion', 'Leitet einen Nebensatz ein und verbindet ihn mit dem Hauptsatz.'),
    w('damals', 'Adverb', 'Vorfeldfähig: „Damals war alles anders.“'),
    w('nur', 'Partikel', 'Grenzt ein, lässt sich aber nicht allein ins Vorfeld stellen.'),
    w('wegen', 'Präposition', 'Fordert den Genitiv: wegen des Regens.'),
    w('niemand', 'Pronomen', 'Deklinierbar (niemandem, niemanden), nicht artikelfähig – ein Indefinitpronomen.'),
    w('Erinnerung', 'Nomen', 'die Erinnerung – der Erinnerung – die Erinnerungen.'),
    w('glänzen', 'Verb', 'Konjugierbar: es glänzt, es glänzte, geglänzt.'),
    w('sorgfältig', 'Adjektiv', 'Steigerbar und zwischen Artikel und Nomen einsetzbar: die sorgfältige Arbeit.'),
    w('sondern', 'Konjunktion', 'Verbindet zwei Satzteile nach einer Verneinung: nicht A, sondern B.'),
    w('ziemlich', 'Partikel', 'Eine Gradpartikel: Sie verstärkt ein Adjektiv, steht aber nie allein im Vorfeld.'),
    w('ohne', 'Präposition', 'Fordert den Akkusativ: ohne den Schlüssel.'),
    w('Antwort', 'Nomen', 'die Antwort – der Antwort – die Antworten.'),
    w('zufrieden', 'Adjektiv', 'zufrieden – zufriedener – am zufriedensten.'),
    w('dass', 'Konjunktion', 'Leitet einen Nebensatz ein. Nicht zu verwechseln mit dem Artikel oder Pronomen „das“ (nur ein s).'),
    w('morgens', 'Adverb', 'Vorfeldfähig: „Morgens trinkt sie Tee.“ Adverbien auf -s bezeichnen oft eine regelmäßige Zeit.'),
    w('bloß', 'Partikel', 'Unveränderlich, nicht vorfeldfähig, kein Kasus, keine Verknüpfung.'),
    w('seit', 'Präposition', 'Fordert den Dativ: seit dem Frühling.'),
    w('springen', 'Verb', 'Konjugierbar: ich springe, ich sprang, gesprungen.'),
    w('ruhig', 'Adjektiv', 'ruhig – ruhiger – am ruhigsten; der ruhige Abend.'),
    w('und', 'Konjunktion', 'Verbindet gleichrangige Teile: Brot und Butter.'),
    w('welcher', 'Pronomen', 'Deklinierbar (welchem, welchen), aber nicht artikelfähig – ein Interrogativ- oder Relativpronomen.'),
    w('irgendwo', 'Adverb', 'Unveränderlich und vorfeldfähig: „Irgendwo muss der Schlüssel sein.“'),

    s('Sie kaufte <b>ein</b> gebrauchtes Klavier.', 'Artikel', 'Hier begleitet „ein“ das Nomen als unbestimmter Artikel.'),
    s('Von den drei Angeboten war nur <b>eines</b> brauchbar.', 'Pronomen', 'Hier steht „eines“ anstelle eines Nomens – es vertritt es, also ein Pronomen.'),
    s('Der Mechaniker reparierte <b>den</b> Motor.', 'Artikel', 'Bestimmter Artikel im Akkusativ maskulin.'),
    s('<b>Ihr</b> Vorschlag hat uns überzeugt.', 'Pronomen', 'Ein Possessivpronomen: Es steht an der Artikelstelle, gehört aber zu den Pronomen.'),
    s('Der <b>laufende</b> Motor war laut.', 'Adjektiv', 'Ein Partizip I, das hier wie ein Adjektiv gebraucht wird: Es steht zwischen Artikel und Nomen und ist dekliniert.'),
    s('<b>Das Laufen</b> fällt ihm schwer.', 'Nomen', 'Ein substantiviertes Verb. Der Artikel davor und die Großschreibung machen es zum Nomen.'),
    s('Sie arbeitet <b>schnell</b>.', 'Adjektiv', 'Auch ohne Nomen daneben bleibt „schnell“ ein Adjektiv: Es ist steigerbar (schneller) und passt zwischen Artikel und Nomen (die schnelle Arbeit). Als Satzglied ist es hier ein Modaladverbial.'),
    s('Sie arbeitet <b>heute</b>.', 'Adverb', 'Im Unterschied zu „schnell“ lässt sich „heute“ nicht steigern und nicht zwischen Artikel und Nomen stellen.'),
  ],
});
