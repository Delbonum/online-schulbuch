// Übung: Adverb, Präposition, Konjunktion oder Partikel – und nebenordnend oder unterordnend?

import { uebung } from './uebung.js';

const VIER = ['Adverb', 'Präposition', 'Konjunktion', 'Partikel'];

const w = (wort, richtig, erklaerung) => ({
  anweisung: 'Welche der vier unveränderlichen Wortarten ist das?',
  wort,
  optionen: VIER,
  richtig,
  erklaerung,
});

const art = (satz, richtig, erklaerung) => ({
  anweisung: 'Welche Art von Adverb ist fett gedruckt?',
  satz,
  optionen: ['Lokaladverb', 'Temporaladverb', 'Modaladverb', 'Kausaladverb'],
  richtig,
  erklaerung,
});

const konj = (satz, richtig, erklaerung) => ({
  anweisung: 'Ist die fett gedruckte Konjunktion nebenordnend oder unterordnend?',
  satz,
  optionen: ['nebenordnend', 'unterordnend'],
  richtig,
  erklaerung,
});

uebung('#uebung', {
  aufgaben: [
    w('draußen', 'Adverb', 'Vorfeldfähig: „Draußen wartet jemand.“'),
    w('hinter', 'Präposition', 'Fordert einen Kasus: hinter dem Haus (Dativ), hinter das Haus (Akkusativ).'),
    w('obwohl', 'Konjunktion', 'Verknüpft einen Nebensatz mit dem Hauptsatz.'),
    w('sogar', 'Partikel', 'Hebt hervor, steht aber nicht allein im Vorfeld und verknüpft nichts.'),
    w('bald', 'Adverb', '„Bald beginnt der Unterricht.“ – vorfeldfähig.'),
    w('statt', 'Präposition', 'Fordert den Genitiv: statt des Vortrags.'),
    w('sondern', 'Konjunktion', 'Verbindet zwei gleichrangige Teile nach einer Verneinung.'),
    w('kaum', 'Partikel', 'Schwächt ab. Als Modaladverb wird es manchmal auch anders eingeordnet – nach der Murmelbahn zählt: nicht vorfeldfähig im engeren Sinn, kein Kasus, keine Verknüpfung.'),
    w('trotzdem', 'Adverb', '„Trotzdem kam sie.“ – Das Verb steht direkt dahinter, also besetzt „trotzdem“ das Vorfeld: ein Konjunktionaladverb.'),
    w('nachdem', 'Konjunktion', 'Leitet einen Nebensatz ein; das Verb rutscht ans Ende.'),
    w('innerhalb', 'Präposition', 'Fordert den Genitiv: innerhalb einer Woche.'),
    w('nirgendwo', 'Adverb', 'Vorfeldfähig: „Nirgendwo war er zu finden.“'),
    w('halt', 'Partikel', 'Eine Abtönungspartikel: „Das ist halt so.“'),
    w('oder', 'Konjunktion', 'Verbindet gleichrangige Teile.'),

    art('<b>Dort</b> hinten steht der Automat.', 'Lokaladverb', 'Antwort auf „Wo?“'),
    art('<b>Damals</b> gab es hier noch ein Kino.', 'Temporaladverb', 'Antwort auf „Wann?“'),
    art('Sie hat es <b>gern</b> gemacht.', 'Modaladverb', 'Antwort auf „Wie?“'),
    art('Der Zug hatte Verspätung, <b>deshalb</b> kam sie zu spät.', 'Kausaladverb', 'Antwort auf „Warum?“ – ein Konjunktionaladverb.'),
    art('Wir treffen uns <b>oft</b> am Bahnhof.', 'Temporaladverb', 'Frage nach der Häufigkeit: „Wie oft?“'),
    art('Der Ball rollte <b>hinunter</b>.', 'Lokaladverb', 'Antwort auf „Wohin?“'),
    art('Das hat sie <b>vergebens</b> versucht.', 'Modaladverb', 'Antwort auf „Wie?“'),
    art('<b>Folglich</b> mussten wir umplanen.', 'Kausaladverb', 'Gibt die Folge an und verknüpft inhaltlich.'),

    konj('Sie packte die Tasche, <b>denn</b> der Zug fuhr bald.', 'nebenordnend', 'Nach „denn“ bleibt das Verb an zweiter Stelle: „der Zug fuhr“. Das ist die klassische Ausnahme.'),
    konj('Sie packte die Tasche, <b>weil</b> der Zug bald fuhr.', 'unterordnend', 'Das finite Verb „fuhr“ steht am Ende – ein Nebensatz.'),
    konj('Er rief an, <b>aber</b> niemand ging ran.', 'nebenordnend', 'Das Verb „ging“ steht an zweiter Stelle.'),
    konj('Er rief an, <b>obwohl</b> es schon spät war.', 'unterordnend', 'Das Verb „war“ steht am Ende.'),
    konj('Wir warten, <b>bis</b> alle da sind.', 'unterordnend', '„Sind“ steht am Ende.'),
    konj('Nimmst du Tee <b>oder</b> Kaffee?', 'nebenordnend', 'Verbindet zwei gleichrangige Wörter.'),
    konj('Sie erklärte alles, <b>damit</b> niemand etwas falsch macht.', 'unterordnend', '„Macht“ steht am Ende – ein Finalsatz.'),
    konj('Ich weiß nicht, <b>ob</b> der Laden noch offen ist.', 'unterordnend', '„Ist“ steht am Ende – ein indirekter Fragesatz.'),

    {
      anweisung: 'Adverb oder Konjunktion? Achte auf die Stellung des finiten Verbs.',
      satz: 'Es war kalt, <b>darum</b> zogen wir die Jacken an.',
      optionen: ['Adverb', 'Konjunktion'],
      richtig: 'Adverb',
      erklaerung: 'Direkt nach „darum“ steht das Verb „zogen“ – also besetzt „darum“ das Vorfeld. Ein Konjunktionaladverb.',
    },
    {
      anweisung: 'Adverb oder Konjunktion? Achte auf die Stellung des finiten Verbs.',
      satz: 'Wir zogen die Jacken an, <b>weil</b> es kalt war.',
      optionen: ['Konjunktion', 'Adverb'],
      richtig: 'Konjunktion',
      erklaerung: 'Das Verb „war“ steht ganz am Ende – typisch für den Nebensatz nach einer unterordnenden Konjunktion.',
    },
    {
      anweisung: 'Welche Wortart hat das fett gedruckte Wort in diesem Satz?',
      satz: 'Sie wartet schon lange <b>darauf</b>.',
      optionen: ['Adverb', 'Präposition', 'Pronomen', 'Partikel'],
      richtig: 'Adverb',
      erklaerung: 'Ein Pronominaladverb aus „da“ + „auf“. Es ersetzt eine ganze Präpositionalgruppe.',
    },
    {
      anweisung: 'Welche Wortart hat das fett gedruckte Wort in diesem Satz?',
      satz: 'Sie wartet <b>auf</b> den Bus.',
      optionen: ['Präposition', 'Adverb', 'Partikel', 'Konjunktion'],
      richtig: 'Präposition',
      erklaerung: 'Hier fordert „auf“ den Akkusativ: auf den Bus.',
    },
    {
      anweisung: 'Welche Wortart hat das fett gedruckte Wort in diesem Satz?',
      satz: 'Der Deckel geht nicht <b>auf</b>.',
      optionen: ['Partikel', 'Präposition', 'Adverb', 'Konjunktion'],
      richtig: 'Partikel',
      erklaerung: 'Hier ist „auf“ die abgetrennte Verbpartikel von „aufgehen“ – sie fordert keinen Kasus und verknüpft nichts.',
    },
  ],
});
