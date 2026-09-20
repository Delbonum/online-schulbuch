// Übung: Ist das ein Satzglied? Und welche Probe hilft?

import { uebung } from './uebung.js';

const glied = (satz, richtig, erklaerung) => ({
  anweisung: 'Ist der fett gedruckte Teil ein vollständiges Satzglied?',
  satz,
  optionen: ['ja, ein Satzglied', 'nein, nur ein Teil eines Satzglieds'],
  richtig,
  erklaerung,
});

const probe = (frage, richtig, erklaerung) => ({
  anweisung: 'Welche Probe wurde hier angewendet?',
  frage,
  optionen: ['Verschiebeprobe', 'Ersatzprobe', 'Frageprobe', 'Weglassprobe'],
  richtig,
  erklaerung,
});

uebung('#uebung', {
  aufgaben: [
    glied('<b>Der junge Kater</b> jagt eine Motte.', 'ja, ein Satzglied', 'Verschiebeprobe: „Der junge Kater jagt …“ – die Gruppe lässt sich als Ganzes bewegen und durch „er“ ersetzen.'),
    glied('Der <b>junge</b> Kater jagt eine Motte.', 'nein, nur ein Teil eines Satzglieds', '„Junge“ ist ein Attribut zu „Kater“. Allein verschieben lässt es sich nicht.'),
    glied('Sie stellte die Vase <b>auf das Fensterbrett</b>.', 'ja, ein Satzglied', 'Verschiebeprobe: „Auf das Fensterbrett stellte sie die Vase.“ ✓'),
    glied('Sie stellte die Vase auf <b>das Fensterbrett</b>.', 'nein, nur ein Teil eines Satzglieds', 'Die Präposition gehört dazu. Ohne sie lässt sich die Gruppe nicht verschieben.'),
    glied('Ich habe <b>das Buch meiner Schwester</b> gelesen.', 'ja, ein Satzglied', 'Verschiebeprobe: „Das Buch meiner Schwester habe ich gelesen.“ ✓ Das Genitivattribut gehört mit dazu.'),
    glied('Ich habe das Buch <b>meiner Schwester</b> gelesen.', 'nein, nur ein Teil eines Satzglieds', 'Ein Genitivattribut zu „Buch“. „Meiner Schwester habe ich das Buch gelesen“ ergibt einen anderen Satz mit anderer Bedeutung.'),
    glied('<b>Am nächsten Morgen</b> war der Nebel verschwunden.', 'ja, ein Satzglied', 'Es steht bereits im Vorfeld – also ein Satzglied.'),
    glied('Am <b>nächsten</b> Morgen war der Nebel verschwunden.', 'nein, nur ein Teil eines Satzglieds', 'Ein Attribut innerhalb der Präpositionalgruppe.'),
    glied('<b>Dass er zu spät kam</b>, ärgerte alle.', 'ja, ein Satzglied', 'Ein ganzer Nebensatz kann ein Satzglied sein – hier ein Subjektsatz. Ersatzprobe: „Seine Verspätung ärgerte alle.“'),
    glied('Die Katze schläft <b>auf dem warmen Sofa</b>.', 'ja, ein Satzglied', 'Ersatzprobe: „Die Katze schläft dort.“ ✓'),

    probe('„Wir treffen uns am Bahnhof.“ → „Wir treffen uns dort.“', 'Ersatzprobe', 'Die Wortgruppe wurde durch ein einzelnes Wort ersetzt.'),
    probe('„Sie liest das Buch auf dem Sofa.“ → „Sie liest das Buch.“', 'Weglassprobe', 'Es wurde geprüft, ob der Satz ohne das Element noch vollständig ist.'),
    probe('„Morgen beginnt der Kurs.“ → „Der Kurs beginnt morgen.“', 'Verschiebeprobe', 'Das Element wurde an eine andere Stelle im Satz geschoben.'),
    probe('„Sie half ihrem Bruder.“ → „Wem half sie?“', 'Frageprobe', 'Es wurde eine Frage gebildet, die das Satzglied als Antwort verlangt.'),
    probe('„Er wartet auf die Antwort.“ → „Er wartet darauf.“', 'Ersatzprobe', 'Ersatz durch ein Pronominaladverb – ein Hinweis auf ein Präpositionalobjekt.'),

    {
      anweisung: 'Notwendig oder frei? Prüfe mit der Weglassprobe.',
      satz: 'Sie wohnt in einem alten Bauernhaus.',
      frage: 'Ist „in einem alten Bauernhaus“ notwendig oder weglassbar?',
      optionen: ['notwendig', 'frei weglassbar'],
      richtig: 'notwendig',
      erklaerung: '„Sie wohnt.“ klingt unvollständig – „wohnen“ verlangt eine Ortsangabe.',
    },
    {
      anweisung: 'Notwendig oder frei? Prüfe mit der Weglassprobe.',
      satz: 'Sie liest in ihrem Zimmer.',
      frage: 'Ist „in ihrem Zimmer“ notwendig oder weglassbar?',
      optionen: ['frei weglassbar', 'notwendig'],
      richtig: 'frei weglassbar',
      erklaerung: '„Sie liest.“ ist ein vollständiger Satz. Das Adverbial ist eine freie Zusatzangabe.',
    },
    {
      anweisung: 'Notwendig oder frei? Prüfe mit der Weglassprobe.',
      satz: 'Der Kellner stellt das Glas auf den Tisch.',
      frage: 'Ist „auf den Tisch“ notwendig oder weglassbar?',
      optionen: ['notwendig', 'frei weglassbar'],
      richtig: 'notwendig',
      erklaerung: '„Der Kellner stellt das Glas.“ ist unvollständig – „stellen“ verlangt eine Richtungsangabe.',
    },
    {
      anweisung: 'Präpositionalobjekt oder Adverbial? Prüfe, ob das Verb die Präposition fest verlangt.',
      satz: 'Sie ärgert sich <b>über den Lärm</b>.',
      optionen: ['Präpositionalobjekt', 'Adverbial'],
      richtig: 'Präpositionalobjekt',
      erklaerung: '„Sich ärgern über“ ist fest – man kann die Präposition nicht austauschen. Ersatzprobe: „Sie ärgert sich darüber.“',
    },
    {
      anweisung: 'Präpositionalobjekt oder Adverbial? Prüfe, ob das Verb die Präposition fest verlangt.',
      satz: 'Sie sitzt <b>hinter dem Haus</b>.',
      optionen: ['Adverbial', 'Präpositionalobjekt'],
      richtig: 'Adverbial',
      erklaerung: 'Die Präposition ist frei wählbar: vor, neben, in dem Haus. Und die Frage lautet „Wo?“, nicht „Wohinter?“.',
    },
    {
      anweisung: 'Präpositionalobjekt oder Adverbial? Prüfe, ob das Verb die Präposition fest verlangt.',
      satz: 'Er rechnet <b>mit einer Absage</b>.',
      optionen: ['Präpositionalobjekt', 'Adverbial'],
      richtig: 'Präpositionalobjekt',
      erklaerung: '„Rechnen mit“ ist fest. Ersatzprobe: „Er rechnet damit.“',
    },
    {
      anweisung: 'Präpositionalobjekt oder Adverbial? Prüfe, ob das Verb die Präposition fest verlangt.',
      satz: 'Er fährt <b>mit dem Zug</b>.',
      optionen: ['Adverbial', 'Präpositionalobjekt'],
      richtig: 'Adverbial',
      erklaerung: 'Hier antwortet „mit dem Zug“ auf „Womit?“ im Sinne des Mittels – ein Modaladverbial. „Fahren“ verlangt kein „mit“.',
    },
  ],
});
