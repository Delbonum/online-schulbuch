// Prüfungstraining: gemischte Aufgaben aus allen Kapiteln.

import { uebung } from './uebung.js';

const WORTARTEN = ['Verb', 'Nomen', 'Adjektiv', 'Artikel', 'Pronomen', 'Adverb', 'Präposition', 'Konjunktion', 'Partikel'];
const GLIEDER = ['Subjekt', 'Prädikat', 'Akkusativobjekt', 'Dativobjekt', 'Genitivobjekt', 'Präpositionalobjekt',
  'Lokaladverbial', 'Temporaladverbial', 'Modaladverbial', 'Kausaladverbial', 'Prädikativ'];
const ROLLEN = ['Agens', 'Patiens', 'Experiencer', 'Stimulus', 'Rezipient', 'Instrument', 'Kraft (Force)'];
const FUNKTION = ['Subjektsatz', 'Objektsatz', 'Adverbialsatz', 'Attributsatz', 'Prädikativsatz'];

const wortart = (wort, richtig, erklaerung) => ({ anweisung: 'Bestimme die Wortart.', wort, optionen: WORTARTEN, richtig, erklaerung });
const glied = (satz, richtig, erklaerung) => ({ anweisung: 'Bestimme das fett gedruckte Satzglied.', satz, optionen: GLIEDER, richtig, erklaerung });
const rolle = (satz, richtig, erklaerung) => ({ anweisung: 'Bestimme die semantische Rolle des fett gedruckten Elements.', satz, optionen: ROLLEN, richtig, erklaerung });
const nebensatz = (satz, richtig, erklaerung) => ({ anweisung: 'Bestimme den fett gedruckten Nebensatz nach seiner syntaktischen Funktion.', satz, optionen: FUNKTION, richtig, erklaerung });
const felder = (satz, teile, erklaerung) => ({ typ: 'felder', anweisung: 'Ordne die Satzteile den Feldern zu.', satz, teile, erklaerung });
const komma = (satz, kommas, erklaerung) => ({ typ: 'komma', anweisung: 'Setze alle obligatorischen Kommas.', woerter: satz.split(' '), kommas, erklaerung });

uebung('#uebung', {
  aufgaben: [
    wortart('Wanderung', 'Nomen', 'Artikelfähig und deklinierbar: die Wanderung, der Wanderung.'),
    wortart('sorgsam', 'Adjektiv', 'Steigerbar (sorgsamer) und zwischen Artikel und Nomen einsetzbar.'),
    wortart('inzwischen', 'Adverb', 'Unveränderlich und vorfeldfähig: „Inzwischen ist es dunkel.“'),
    wortart('innerhalb', 'Präposition', 'Fordert den Genitiv: innerhalb einer Stunde.'),
    wortart('sobald', 'Konjunktion', 'Leitet einen Nebensatz ein; das Verb rutscht ans Ende.'),
    wortart('kaum', 'Partikel', 'Nicht flektierbar, kein Kasus, keine Verknüpfung – sie schwächt nur ab.'),
    wortart('welche', 'Pronomen', 'Deklinierbar, aber nicht artikelfähig – ein Interrogativ- oder Relativpronomen.'),
    wortart('entscheiden', 'Verb', 'Konjugierbar: ich entscheide, sie entschied.'),

    glied('<b>Der neue Kollege</b> stellte sich kurz vor.', 'Subjekt', 'Probe: „Wer stellte sich vor?“'),
    glied('Sie erklärte <b>dem Praktikanten</b> die Maschine.', 'Dativobjekt', 'Probe: „Wem erklärte sie die Maschine?“'),
    glied('Sie erklärte dem Praktikanten <b>die Maschine</b>.', 'Akkusativobjekt', 'Probe: „Wen oder was erklärte sie?“'),
    glied('Wir verlassen uns <b>auf deine Zusage</b>.', 'Präpositionalobjekt', '„Sich verlassen auf“ ist fest. Probe: „Worauf verlassen wir uns?“'),
    glied('<b>Hinter dem Haus</b> steht ein alter Nussbaum.', 'Lokaladverbial', 'Probe: „Wo steht er?“ Die Präposition ist frei wählbar.'),
    glied('<b>Seit dem Umzug</b> sehen wir uns selten.', 'Temporaladverbial', 'Probe: „Seit wann?“'),
    glied('Er las den Vertrag <b>sehr gründlich</b>.', 'Modaladverbial', 'Probe: „Wie las er ihn?“'),
    glied('<b>Aus Vorsicht</b> nahm sie den längeren Weg.', 'Kausaladverbial', 'Probe: „Warum nahm sie ihn?“'),
    glied('Meine Cousine ist <b>Elektrikerin</b>.', 'Prädikativ', 'Nach „sein“ steht ein Prädikativ im Nominativ, kein Objekt.'),
    glied('Die Firma <b>hat</b> den Auftrag <b>angenommen</b>.', 'Prädikat', 'Hilfsverb und Partizip II bilden zusammen das Prädikat.'),
    glied('Der Angeklagte wurde <b>des Diebstahls</b> beschuldigt.', 'Genitivobjekt', 'Probe: „Wessen wurde er beschuldigt?“'),
    glied('Sie repariert die Uhr <b>mit einer Pinzette</b>.', 'Modaladverbial', 'Probe: „Womit?“ – ein instrumentales Modaladverbial.'),

    rolle('<b>Die Technikerin</b> tauschte den Akku aus.', 'Agens', 'Sie handelt absichtlich.'),
    rolle('Die Technikerin tauschte <b>den Akku</b> aus.', 'Patiens', 'Mit dem Akku geschieht etwas.'),
    rolle('<b>Das Hochwasser</b> zerstörte die Brücke.', 'Kraft (Force)', 'Eine Naturgewalt handelt nicht absichtlich.'),
    rolle('<b>Der Nachtwächter</b> bemerkte ein Licht im Fenster.', 'Experiencer', '„Bemerken“ ist Wahrnehmung, keine Handlung.'),
    rolle('Der Nachtwächter bemerkte <b>ein Licht im Fenster</b>.', 'Stimulus', 'Das Licht löst die Wahrnehmung aus.'),
    rolle('Der Verlag schickte <b>der Autorin</b> die Belegexemplare.', 'Rezipient', 'Sie bekommt etwas.'),
    rolle('Er zeichnete den Plan <b>mit einem Lineal</b>.', 'Instrument', 'Das Mittel der Handlung.'),
    rolle('<b>Die Anmeldung</b> wurde gestern bestätigt.', 'Patiens', 'Passivfalle: Subjekt, aber betroffen.'),

    nebensatz('<b>Dass die Lieferung verspätet kam</b>, ärgerte alle.', 'Subjektsatz', 'Probe: „Was ärgerte alle?“ → „Die Verspätung ärgerte alle.“'),
    nebensatz('Sie erzählte, <b>wen sie im Zug getroffen hatte</b>.', 'Objektsatz', 'Probe: „Was erzählte sie?“'),
    nebensatz('Die Wanderung fiel aus, <b>weil der Weg gesperrt war</b>.', 'Adverbialsatz', 'Probe: „Warum?“ – genauer ein Kausalsatz.'),
    nebensatz('Der Brief, <b>den sie gestern erhielt</b>, lag noch ungeöffnet da.', 'Attributsatz', 'Der Relativsatz hängt am Nomen „Brief“.'),
    nebensatz('Das Schwierige daran ist, <b>dass niemand sich zuständig fühlt</b>.', 'Prädikativsatz', 'Nach „sein“: „Das Schwierige daran ist die fehlende Zuständigkeit.“'),

    {
      anweisung: 'Bestimme den Nebensatz nach seiner Form.',
      satz: 'Sie erkundigte sich, <b>ob noch Plätze frei sind</b>.',
      optionen: ['indirekter Fragesatz', 'Konjunktionalsatz', 'Relativsatz', 'Infinitivsatz'],
      richtig: 'indirekter Fragesatz',
      erklaerung: 'Eingeleitet durch „ob“ – eine indirekt wiedergegebene Entscheidungsfrage.',
    },
    {
      anweisung: 'Bestimme den Nebensatz nach seiner Form.',
      satz: '<b>Hätte er früher angerufen</b>, wäre alles einfacher gewesen.',
      optionen: ['uneingeleiteter Nebensatz', 'Konjunktionalsatz', 'Relativsatz', 'Partizipialsatz'],
      richtig: 'uneingeleiteter Nebensatz',
      erklaerung: 'Kein Einleitungswort, das finite Verb steht vorn. Umformung: „Wenn er früher angerufen hätte …“',
    },
    {
      anweisung: 'Welche Art von Adverbialsatz ist das?',
      satz: '<b>Obwohl der Zug voll war</b>, fanden wir zwei Plätze.',
      optionen: ['Konzessivsatz', 'Kausalsatz', 'Konditionalsatz', 'Temporalsatz'],
      richtig: 'Konzessivsatz',
      erklaerung: '„Obwohl“ räumt einen Gegengrund ein.',
    },
    {
      anweisung: 'Welche Art von Adverbialsatz ist das?',
      satz: 'Sie löste die Aufgabe, <b>indem sie rückwärts rechnete</b>.',
      optionen: ['Modalsatz', 'Finalsatz', 'Konsekutivsatz', 'Kausalsatz'],
      richtig: 'Modalsatz',
      erklaerung: '„Indem“ gibt an, wie oder wodurch etwas geschieht.',
    },

    {
      anweisung: 'Aktiv, Vorgangspassiv oder Zustandspassiv?',
      satz: 'Der Schaden ist inzwischen behoben worden.',
      optionen: ['Vorgangspassiv', 'Zustandspassiv', 'Aktiv'],
      richtig: 'Vorgangspassiv',
      erklaerung: 'Perfekt des Vorgangspassivs – das „worden“ verrät es.',
    },
    {
      anweisung: 'Aktiv, Vorgangspassiv oder Zustandspassiv?',
      satz: 'Der Schaden ist inzwischen behoben.',
      optionen: ['Zustandspassiv', 'Vorgangspassiv', 'Aktiv'],
      richtig: 'Zustandspassiv',
      erklaerung: 'sein + Partizip II ohne „worden“: Es geht um den Zustand.',
    },
    {
      anweisung: 'Aktiv, Vorgangspassiv oder Zustandspassiv?',
      satz: 'Übermorgen wird der Bericht erscheinen.',
      optionen: ['Aktiv', 'Vorgangspassiv', 'Zustandspassiv'],
      richtig: 'Aktiv',
      erklaerung: 'werden + Infinitiv – Futur I im Aktiv.',
    },
    {
      typ: 'frei',
      anweisung: 'Forme den Satz um. Zeitform und Modalverb bleiben erhalten.',
      frage: 'Die Jury hat drei Beiträge ausgezeichnet. (ins Passiv)',
      muster: 'Drei Beiträge sind (von der Jury) ausgezeichnet worden.',
      erklaerung: 'Perfekt bleibt Perfekt, das Akkusativobjekt wird zum Subjekt.',
    },
    {
      typ: 'frei',
      anweisung: 'Forme den Satz um. Zeitform und Modalverb bleiben erhalten.',
      frage: 'Der Termin musste kurzfristig verschoben werden. (ins Aktiv)',
      muster: 'Man musste den Termin kurzfristig verschieben.',
      erklaerung: 'Das Agens fehlt und muss ergänzt werden. Modalverb und Präteritum bleiben.',
    },

    {
      typ: 'eingabe',
      anweisung: 'Überführe die Verbform in die verlangte Konjunktiv-Form.',
      frage: 'Er nimmt → Konjunktiv I',
      vor: 'Er',
      loesungen: ['nehme'],
      erklaerung: 'Infinitivstamm „nehm“ + e, ohne den Vokalwechsel des Indikativs.',
    },
    {
      typ: 'eingabe',
      anweisung: 'Überführe die Verbform in die verlangte Konjunktiv-Form.',
      frage: 'Wir haben → Konjunktiv II',
      vor: 'Wir',
      loesungen: ['hätten'],
      erklaerung: 'Präteritum „hatten“ + Umlaut.',
    },
    {
      typ: 'eingabe',
      anweisung: 'Setze die passende Konjunktiv-Form ein.',
      satz: 'Die Sprecherin erklärt, der Antrag ___ (sein) bereits geprüft.',
      loesungen: ['sei'],
      erklaerung: 'Indirekte Rede → Konjunktiv I.',
    },
    {
      typ: 'eingabe',
      anweisung: 'Setze die passende Konjunktiv-Form ein.',
      satz: 'Wenn ich das früher ___ (wissen), hätte ich abgesagt.',
      loesungen: ['gewusst hätte', 'wüsste'],
      erklaerung: 'Irreales in der Vergangenheit: „gewusst hätte“.',
    },

    {
      anweisung: 'Partikelverb oder Präfixverb?',
      satz: 'Wir sollten den Termin rechtzeitig <b>absagen</b>.',
      optionen: ['Partikelverb', 'Präfixverb'],
      richtig: 'Partikelverb',
      erklaerung: 'Probe: „Wir sagen den Termin ab.“',
    },
    {
      anweisung: 'Partikelverb oder Präfixverb?',
      satz: 'Niemand konnte die Lage richtig <b>einschätzen</b>.',
      optionen: ['Partikelverb', 'Präfixverb'],
      richtig: 'Partikelverb',
      erklaerung: 'Probe: „Er schätzt die Lage ein.“ Betonung auf „ein“.',
    },
    {
      anweisung: 'Partikelverb oder Präfixverb?',
      satz: 'Sie wollte den Auftrag nicht <b>erledigen</b>.',
      optionen: ['Präfixverb', 'Partikelverb'],
      richtig: 'Präfixverb',
      erklaerung: '„er-“ ist immer untrennbar. Partizip II: erledigt, ohne ge-.',
    },

    felder('Am Montag hat die Klasse das Museum besucht.', [
      ['Am Montag', 'vf'], ['hat', 'lsk'], ['die Klasse das Museum', 'mf'], ['besucht', 'rsk'],
    ], 'Ein Aussagesatz mit Satzklammer: „hat … besucht“.'),

    felder('Wann fährt der nächste Bus?', [
      ['Wann', 'vf'], ['fährt', 'lsk'], ['der nächste Bus', 'mf'],
    ], 'Ergänzungsfrage: Das Fragewort besetzt das Vorfeld.'),

    felder('Hast du die Unterlagen schon eingereicht?', [
      ['Hast', 'lsk'], ['du die Unterlagen schon', 'mf'], ['eingereicht', 'rsk'],
    ], 'Entscheidungsfrage: Das Vorfeld bleibt leer.'),

    felder('Nebensatz allein: weil der Weg gesperrt war', [
      ['weil', 'lsk'], ['der Weg gesperrt', 'mf'], ['war', 'rsk'],
    ], 'Im Nebensatz steht die Konjunktion links, das finite Verb rechts.'),

    felder('Sie freute sich, dass alle gekommen waren.', [
      ['Sie', 'vf'], ['freute', 'lsk'], ['sich', 'mf'], ['dass alle gekommen waren', 'nf'],
    ], 'Der nachgestellte Nebensatz steht im Nachfeld.'),

    komma('Als der Wecker klingelte war es noch dunkel', [3],
      'Der Temporalsatz im Vorfeld wird abgetrennt.'),
    komma('Die Nachbarin die uns geholfen hat wohnt im dritten Stock', [1, 5],
      'Eingeschobener Relativsatz – Kommas vorne und hinten.'),
    komma('Sie nahm den Bus um pünktlich anzukommen', [3],
      'Infinitivgruppe mit „um … zu“ – Komma ist Pflicht.'),
    komma('Der Vortrag war lang aber spannend', [3],
      'Vor „aber“ steht immer ein Komma.'),
    komma('Im Sommer fahren wir meistens ans Meer', [],
      'Ein einfacher Satz ohne Nebensatz und ohne Aufzählung – kein Komma.'),
    komma('Er wusste nicht ob er bleiben oder gehen sollte', [2],
      'Nur vor dem Nebensatz steht ein Komma; „oder“ verbindet hier nur zwei Infinitive.'),
  ],
});
