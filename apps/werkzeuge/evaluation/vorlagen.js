// Vorlagen für Unterrichtsevaluationen.
//
// Feedbackbogen „PoKUK“ zur Unterrichtsqualität: 45 Aussagen, vierstufig von „trifft nicht zu“ (1) bis „trifft zu“ (4),
// zu zehn Skalen in drei Bereichen (Kognitive Aktivierung, Klassenführung, Konstruktive Unterstützung). Wortlaut,
// Kürzel (Kog1 …) und Auswertung (Skalenmittelwert je Person, Ver6 umgepolt) wie im Fragebogen, Codebook und der
// Auswertungsmaske des Originals; nur die Anrede ist auf „du“ vereinheitlicht und „Schüler/inne“ berichtigt.

const STUFEN = ['trifft nicht zu', 'trifft eher nicht zu', 'trifft eher zu', 'trifft zu'];
const ABSCHNITT_1 = 'Unsere Lehrerin/unser Lehrer …';
const ABSCHNITT_2 = 'Bei der Lehrerin/dem Lehrer …';

const SKALEN = {
  Kog: ['Kognitive Aktivierung', 'Kognitive Aktivierung', ''],
  Soz: ['Sozialorientierung, Geduld und konstruktiver Umgang mit Fehlern', 'Konstruktive Unterstützung', ''],
  Adap: ['Adaptive Erleichterung bei Schwierigkeiten', 'Konstruktive Unterstützung', ''],
  Dia: ['Diagnostik von Verständnisschwierigkeiten', 'Konstruktive Unterstützung', ''],
  Ver: ['Verständlichkeit der Erklärungen', 'Konstruktive Unterstützung', ''],
  Int: ['Unangemessenes Interaktionstempo', 'Konstruktive Unterstützung', 'Achtung: Ein hoher Wert ist ungünstig (es geht zu schnell).'],
  Mot: ['Motivierende Unterrichtsgestaltung', 'Konstruktive Unterstützung', ''],
  Kon: ['Konsequenter Umgang mit Störungen und Konflikten', 'Klassenführung', ''],
  Moni: ['Monitoring („Allgegenwärtigkeit“)', 'Klassenführung', ''],
  Zeit: ['Zeitverluste und Störungen', 'Klassenführung', 'Achtung: Ein hoher Wert ist ungünstig (viel Zeit geht verloren).'],
};

// [Kürzel, Aussage, Abschnitt, umgepolt]
const AUSSAGEN = [
  ['Kog1', 'ermutigt uns, eigene Strategie zur Bearbeitung von Aufgaben einzusetzen.'],
  ['Kog2', 'stellt uns oft Fragen, bei denen man wirklich sieht, ob man etwas verstanden hat.'],
  ['Kog3', 'verlangt häufiger, dass wir unsere Arbeitsschritte ausführlich begründen.'],
  ['Kog4', 'fragt häufiger, ob jemand bei der Beantwortung von Fragen anders vorgegangen ist.'],
  ['Kog5', 'stellt Fragen, über die wir ganz genau nachdenken müssen.'],
  ['Kog6', 'möchte, dass wir unsere Antworten auch erklären können.'],
  ['Kog7', 'lässt unterschiedliche Antworten auf eine Frage vergleichen.'],
  ['Soz1', 'nimmt sich immer Zeit, wenn die Schüler/innen etwas mit ihm/ihr bereden wollen.'],
  ['Soz2', 'kümmert sich um Probleme der Schüler/innen.'],
  ['Soz3', 'ist geduldig, wenn jemand einen Fehler macht.'],
  ['Soz4', 'achtet darauf, dass in unserer Klasse niemand ausgelacht wird, der einen Fehler macht.'],
  ['Soz5', 'ermutigt uns zu fragen, wenn wir etwas nicht verstehen.'],
  ['Adap1', 'führt im Unterricht gute Beispiele auf, um die Inhalte verständlich zu machen.'],
  ['Adap2', 'stellt Fragen, die alle Schüler/innen nach bestem Vermögen beantworten können.'],
  ['Adap3', 'macht mir die Sachverhalte so klar, dass ich sie auch auf neue Bereiche übertragen kann.'],
  ['Adap4', 'erklärt besonders an schwierigen Stellen ganz langsam und sorgfältig.'],
  ['Dia1', 'weiß genau, was jeder von uns leistet.'],
  ['Dia2', 'merkt sofort, wenn man etwas nicht richtig verstanden hat.'],
  ['Dia3', 'weiß sofort, an welchen Stellen wir Schwierigkeiten haben.'],
  ['Dia4', 'weiß sofort, was jemand nicht verstanden hat.'],
  ['Dia5', 'merkt sofort, wenn eine Schülerin/ein Schüler im Unterricht nicht mitkommt.'],
  ['Ver1', 'unterrichtet so verständlich, dass man auch schwierige Sachen begreift.'],
  ['Ver2', 'drückt sich immer verständlich aus.'],
  ['Ver3', 'kann gut erklären.'],
  ['Ver4', 'geht im Unterricht in einer logischen Reihenfolge vor.'],
  ['Ver5', 'stellt die Beziehung zwischen behandelten Themen heraus.'],
  ['Ver6', 'erklärt häufig alles auf einmal.', ABSCHNITT_1, true],
  ['Int1', 'verlangt oft blitzschnelle Antworten.'],
  ['Int2', 'fragt oft unberechenbar in die Klasse und erwartet sofortige Antwort.'],
  ['Int3', 'lässt einem bei Fragen zu wenig Zeit zum Nachdenken.'],
  ['Mot1', 'gestaltet den Unterricht abwechslungsreich.'],
  ['Mot2', 'kann auch trockenen Stoff wirklich interessant machen.'],
  ['Mot3', 'kann Schüler/innen richtig begeistern.'],
  ['Kon1', 'erkennt schnell, wenn es Streit gibt und kann es verhindern.'],
  ['Kon2', 'kann streitende Schüler/innen schnell beruhigen.'],
  ['Kon3', 'weiß, wie mit aggressiven Schüler/innen umzugehen ist.'],
  ['Moni1', 'kontrolliert immer genau unsere Hausaufgaben.'],
  ['Moni2', 'achtet sehr darauf, dass wir aufpassen.'],
  ['Moni3', 'merkt sofort, wenn Schüler/innen beginnen, etwas anderes zu treiben.'],
  ['Moni4', 'weiß immer genau, was in der Klasse vor sich geht.'],
  ['Zeit1', 'dauert es zu Beginn der Stunde sehr lange, bis die Schüler/innen ruhig werden und zu arbeiten beginnen.', ABSCHNITT_2],
  ['Zeit2', 'wird viel Zeit vertrödelt.', ABSCHNITT_2],
  ['Zeit3', 'wird der Unterricht oft sehr gestört.', ABSCHNITT_2],
  ['Zeit4', 'wird fortwährend laut gequatscht.', ABSCHNITT_2],
  ['Zeit5', 'wird andauernd Blödsinn gemacht.', ABSCHNITT_2],
];

const reihenfolge = ['Kog', 'Kon', 'Zeit', 'Moni', 'Soz', 'Adap', 'Dia', 'Ver', 'Int', 'Mot'];

export const POKUK = {
  title: 'Feedback zum Unterricht (PoKUK)',
  settings: {
    intro: 'Nun interessieren wir uns für deine persönliche Einschätzung zum Unterricht deiner Lehrkraft. Bitte kreuze in jeder Zeile an, wie sehr die Aussage zutrifft. Es gibt kein Richtig oder Falsch.',
    outro: 'Vielen Dank für deine Unterstützung!',
    minResponses: 5,
    dimensions: reihenfolge.map((k) => ({ name: SKALEN[k][0], group: SKALEN[k][1], hint: SKALEN[k][2] })),
  },
  questions: AUSSAGEN.map(([kuerzel, text, abschnitt = ABSCHNITT_1, umgepolt = false]) => ({
    id: kuerzel.toLowerCase(),
    text,
    type: 'choice',
    options: [...STUFEN],
    correct: null,
    section: abschnitt,
    dimension: SKALEN[kuerzel.replace(/\d+$/, '')][0],
    ...(umgepolt && { reverse: true }),
  })),
};

export const VORLAGEN = [
  { name: 'Feedbackbogen Unterrichtsqualität (PoKUK, 45 Aussagen)', daten: POKUK },
  {
    name: 'Kurzes Feedback (5 Fragen)',
    daten: {
      title: 'Kurzes Feedback zum Unterricht',
      settings: { intro: 'Wie hast du den Unterricht in der letzten Zeit erlebt? Deine Antworten sind anonym.', outro: 'Danke für deine Rückmeldung!', minResponses: 5, dimensions: [] },
      questions: [
        { id: 'k1', text: 'Ich habe in diesem Fach viel gelernt.', type: 'choice', options: [...STUFEN], correct: null },
        { id: 'k2', text: 'Die Erklärungen waren verständlich.', type: 'choice', options: [...STUFEN], correct: null },
        { id: 'k3', text: 'Ich fühle mich im Unterricht wohl.', type: 'choice', options: [...STUFEN], correct: null },
        { id: 'k4', text: 'Das hat mir besonders gefallen:', type: 'text', maxLength: 1000 },
        { id: 'k5', text: 'Das wünsche ich mir anders:', type: 'text', maxLength: 1000 },
      ],
    },
  },
];
