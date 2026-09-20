// Wortliste für die Wortmurmelbahn.
// art: Verb | Adjektiv | Nomen | Artikel/Pronomen | Adverb | Präposition | Konjunktion | Partikel
// hinweise[i] erklärt die i-te Weiche; null lässt die Standarderklärung stehen.

import { murmelbahn } from './murmelbahn.js';

const WOERTER = [
  { wort: 'schwimmen', art: 'Verb', hinweise: ['ich schwimme, du schwammst – die Form ändert sich.', 'Person, Zahl und Zeit lassen sich ablesen.'], beispiel: 'Verben bilden den Kern des Prädikats.' },
  { wort: 'verkaufen', art: 'Verb', hinweise: ['sie verkauft, sie verkaufte.', 'Eindeutig konjugierbar.'] },
  { wort: 'bleiben', art: 'Verb' },
  { wort: 'überlegen', art: 'Verb', hinweise: ['ich überlege, sie überlegte.', 'Konjugierbar. Achtung: Es gibt auch das Adjektiv „überlegen“ (jemandem überlegen sein) – hier ist das Verb gemeint.'] },

  { wort: 'Brücke', art: 'Nomen', hinweise: ['die Brücke – der Brücke – die Brücken.', 'Nicht konjugierbar, nur deklinierbar.', 'Nicht steigerbar: „brückener“ gibt es nicht.', 'Ein Artikel kann davorstehen: die Brücke.'] },
  { wort: 'Hoffnung', art: 'Nomen', hinweise: [null, null, null, 'die Hoffnung – artikelfähig.'] },
  { wort: 'Motor', art: 'Nomen' },
  { wort: 'Freundschaft', art: 'Nomen' },

  { wort: 'mutig', art: 'Adjektiv', hinweise: ['der mutige Mann, mutigere Menschen – die Form ändert sich.', 'Nicht konjugierbar.', 'mutig – mutiger – am mutigsten, und: der mutige Retter.'] },
  { wort: 'sauber', art: 'Adjektiv' },
  { wort: 'hölzern', art: 'Adjektiv', hinweise: [null, null, 'Steigern lässt sich „hölzern“ nicht – aber es passt zwischen Artikel und Nomen: der hölzerne Steg. Damit ist die Weiche bedient.'], beispiel: 'Nicht steigerbare Adjektive erkennt man an der zweiten Probe.' },
  { wort: 'aufmerksam', art: 'Adjektiv' },

  { wort: 'dieses', art: 'Artikel/Pronomen', hinweise: ['dieser – diese – diesem: die Form ändert sich.', 'Nicht konjugierbar.', 'Nicht steigerbar, und zwischen Artikel und Nomen passt es nicht: „das dieses Haus“ geht nicht.', 'Vor „dieses“ kann kein Artikel stehen – es steht ja selbst an dieser Stelle. Genauer: ein Demonstrativpronomen.'] },
  { wort: 'meine', art: 'Artikel/Pronomen', hinweise: [null, null, null, 'Ein Possessivpronomen: Es steht an der Artikelstelle.'] },
  { wort: 'niemand', art: 'Artikel/Pronomen', hinweise: [null, null, null, 'Ein Indefinitpronomen: niemandem, niemanden.'] },
  { wort: 'eine', art: 'Artikel/Pronomen', hinweise: ['ein – eine – einem.', null, null, 'Der unbestimmte Artikel selbst.'] },

  { wort: 'heute', art: 'Adverb', hinweise: ['„Heute“ bleibt immer gleich.', 'Es kann allein im Vorfeld stehen: „Heute kommt sie.“'], beispiel: 'Als Satzglied wäre „heute“ hier ein Temporaladverbial – die Wortart bleibt Adverb.' },
  { wort: 'draußen', art: 'Adverb', hinweise: [null, '„Draußen wartet jemand.“ – funktioniert.'] },
  { wort: 'deswegen', art: 'Adverb', hinweise: [null, '„Deswegen blieb sie zu Hause.“ Solche Wörter heißen Konjunktionaladverbien: Sie verknüpfen inhaltlich, stehen aber im Vorfeld – anders als Konjunktionen.'] },
  { wort: 'oft', art: 'Adverb' },
  { wort: 'nirgends', art: 'Adverb' },

  { wort: 'ohne', art: 'Präposition', hinweise: ['„Ohne“ verändert sich nie.', '„Ohne kommt sie“ ergibt keinen Satz.', 'ohne den Schlüssel – Akkusativ.'] },
  { wort: 'während', art: 'Präposition', hinweise: [null, null, 'während des Unterrichts – Genitiv. Achtung: „während“ kann auch eine Konjunktion sein („während sie schlief“). Hier ist die Präposition gemeint.'] },
  { wort: 'zwischen', art: 'Präposition', hinweise: [null, null, 'zwischen den Häusern (Dativ) oder zwischen die Häuser (Akkusativ) – eine Wechselpräposition.'] },
  { wort: 'trotz', art: 'Präposition' },

  { wort: 'obwohl', art: 'Konjunktion', hinweise: ['Unveränderlich.', '„Obwohl kommt sie“ geht nicht.', 'Es fordert keinen Fall.', 'Es verbindet einen Nebensatz mit dem Hauptsatz.'] },
  { wort: 'sondern', art: 'Konjunktion', hinweise: [null, null, null, 'Verbindet zwei Teile: nicht A, sondern B.'] },
  { wort: 'damit', art: 'Konjunktion', hinweise: [null, null, null, 'Als Konjunktion leitet es einen Finalsatz ein: „…, damit alle es verstehen.“'] },
  { wort: 'nachdem', art: 'Konjunktion' },

  { wort: 'sehr', art: 'Partikel', hinweise: ['Unveränderlich.', '„Sehr kommt sie“ geht nicht.', 'Es fordert keinen Fall.', 'Es verbindet nichts – es verstärkt nur: sehr schön.'] },
  { wort: 'nur', art: 'Partikel', hinweise: [null, null, null, 'Es grenzt ein, verbindet aber nichts.'] },
  { wort: 'ziemlich', art: 'Partikel' },
  { wort: 'bloß', art: 'Partikel' },
];

murmelbahn('#murmelbahn', WOERTER);
