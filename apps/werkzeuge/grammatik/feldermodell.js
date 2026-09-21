// Übung: Sätze in das topologische Feldermodell einordnen.

import { uebung } from './uebung.js';

const f = (satz, teile, erklaerung) => ({ typ: 'felder', satz, teile, erklaerung });

uebung('#uebung', {
  anweisung: 'Ordne jeden Satzteil dem richtigen Feld zu.',
  aufgaben: [
    f('Morgen streicht mein Bruder das Gartenhaus.', [
      ['Morgen', 'vf'], ['streicht', 'lsk'], ['mein Bruder das Gartenhaus', 'mf'],
    ], 'Ein Aussagesatz: ein Satzglied im Vorfeld, das finite Verb an zweiter Stelle. Die rechte Satzklammer bleibt leer, weil es nur eine Verbform gibt.'),

    f('Die Katze hat die Maus gefangen.', [
      ['Die Katze', 'vf'], ['hat', 'lsk'], ['die Maus', 'mf'], ['gefangen', 'rsk'],
    ], 'Das Hilfsverb „hat“ ist finit und steht links, das Partizip II rechts – eine klassische Satzklammer.'),

    f('Hat er die Tür abgeschlossen?', [
      ['Hat', 'lsk'], ['er die Tür', 'mf'], ['abgeschlossen', 'rsk'],
    ], 'Eine Entscheidungsfrage: Das Vorfeld bleibt leer, das finite Verb steht ganz vorn.'),

    f('Wird der Verein nächstes Jahr ein Fest organisieren?', [
      ['Wird', 'lsk'], ['der Verein nächstes Jahr ein Fest', 'mf'], ['organisieren', 'rsk'],
    ], 'Auch hier eine Entscheidungsfrage – Vorfeld leer.'),

    f('Wem hast du das Werkzeug geliehen?', [
      ['Wem', 'vf'], ['hast', 'lsk'], ['du das Werkzeug', 'mf'], ['geliehen', 'rsk'],
    ], 'Eine Ergänzungsfrage: Das Fragewort besetzt das Vorfeld, das finite Verb steht an zweiter Stelle.'),

    f('Schließ bitte das Tor!', [
      ['Schließ', 'lsk'], ['bitte das Tor', 'mf'],
    ], 'Im Imperativsatz steht das Verb ganz vorn – das Vorfeld bleibt leer.'),

    f('Der Zug fährt in zwei Minuten ab.', [
      ['Der Zug', 'vf'], ['fährt', 'lsk'], ['in zwei Minuten', 'mf'], ['ab', 'rsk'],
    ], '„Ab“ ist die abgetrennte Partikel von „abfahren“ und gehört deshalb in die rechte Satzklammer.'),

    f('Sie will das Bild morgen abholen.', [
      ['Sie', 'vf'], ['will', 'lsk'], ['das Bild morgen', 'mf'], ['abholen', 'rsk'],
    ], 'Modalverb finit links, Infinitiv rechts.'),

    f('Ich bleibe heute zu Hause, weil es in Strömen regnet.', [
      ['Ich', 'vf'], ['bleibe', 'lsk'], ['heute zu Hause', 'mf'], ['weil es in Strömen regnet', 'nf'],
    ], 'Der nachgestellte Nebensatz steht im Nachfeld.'),

    f('Nebensatz allein: weil es in Strömen regnete', [
      ['weil', 'lsk'], ['es in Strömen', 'mf'], ['regnete', 'rsk'],
    ], 'Im Nebensatz übernimmt das Einleitungswort die linke Satzklammer, das finite Verb rutscht in die rechte. Das Vorfeld bleibt leer.'),

    f('Heute weiß ich, dass du da bist.', [
      ['Heute', 'vf'], ['weiß', 'lsk'], ['ich', 'mf'], ['dass du da bist', 'nf'],
    ], 'Der dass-Satz steht im Nachfeld des Hauptsatzes.'),

    f('Nebensatz allein: dass du da bist', [
      ['dass', 'lsk'], ['du da', 'mf'], ['bist', 'rsk'],
    ], 'Auch hier: Einleitungswort links, finites Verb rechts.'),

    f('Er ist deutlich größer als sein Bruder.', [
      ['Er', 'vf'], ['ist', 'lsk'], ['deutlich größer', 'mf'], ['als sein Bruder', 'nf'],
    ], 'Vergleiche mit „als“ und „wie“ stehen im Nachfeld.'),

    f('Am Sonntag wollten wir eigentlich wandern gehen.', [
      ['Am Sonntag', 'vf'], ['wollten', 'lsk'], ['wir eigentlich', 'mf'], ['wandern gehen', 'rsk'],
    ], 'Zwei infinite Verbformen bilden zusammen die rechte Satzklammer.'),

    {
      anweisung: 'Beantworte die Frage zum Feldermodell.',
      satz: 'Gestern hat meine Nachbarin den Rasen gemäht.',
      frage: 'Wie viele Satzglieder stehen im Vorfeld?',
      optionen: ['genau eines', 'zwei', 'so viele wie nötig', 'keines'],
      richtig: 'genau eines',
      erklaerung: 'Das Vorfeld nimmt immer genau ein Satzglied auf – hier „Gestern“. Deshalb ist es ein so guter Satzgliedtest.',
    },
    {
      anweisung: 'Beantworte die Frage zum Feldermodell.',
      satz: 'Sie räumte am Abend noch die Küche auf.',
      frage: 'Was steht in der rechten Satzklammer?',
      optionen: ['auf', 'die Küche', 'räumte', 'am Abend'],
      richtig: 'auf',
      erklaerung: 'Die abgetrennte Verbpartikel von „aufräumen“ gehört in die rechte Satzklammer.',
    },
    {
      anweisung: 'Nutze das Vorfeld als Werkzeug.',
      satz: 'Mein Bruder streicht morgen das alte Gartenhaus.',
      frage: 'Welche Wortgruppe kannst du gemeinsam ins Vorfeld schieben?',
      optionen: ['das alte Gartenhaus', 'streicht morgen', 'morgen das', 'Bruder streicht'],
      richtig: 'das alte Gartenhaus',
      erklaerung: '„Das alte Gartenhaus streicht mein Bruder morgen.“ – Die drei Wörter passen nur gemeinsam vor das finite Verb. Sie bilden ein Satzglied.',
    },
    {
      anweisung: 'Nutze das Vorfeld als Werkzeug.',
      frage: 'Welches Wort kann allein im Vorfeld stehen?',
      optionen: ['dort', 'sehr', 'und', 'mit'],
      richtig: 'dort',
      erklaerung: '„Dort wartet sie.“ funktioniert. „Sehr“, „und“ und „mit“ können nicht allein vor dem finiten Verb stehen. „Dort“ ist vorfeldfähig – ein Adverb.',
    },
  ],
});
