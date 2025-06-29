import React from "react";
import VigenereTool from '../components/tools/VigenereTool';
import useLevelGuard from "../components/LevelGuard";
import WeiterButton from "../components/WeiterButton";

export default function FachkonzepteLvl3() {
  useLevelGuard("level2Passed");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 heading-style">Fachkonzepte</h1>

      <div className="space-y-6 text-style">
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Polyalphabetische Chiffrierverfahren</h2>
          <p>
            Bei <strong><b>polyalphabetischen Verfahren</b></strong> wird nicht nur ein einziges Alphabet zur Verschlüsselung verwendet, sondern es kommen mehrere Alphabete zum Einsatz – typischerweise eines pro Buchstabe oder Buchstabenfolge. Dies erhöht die Sicherheit gegenüber monoalphabetischen Verfahren.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Progressive Caesar-Chiffre</h2>
          <p>
            Die <strong><b>progressive Caesar-Chiffre</b></strong> ist eine Variante des Caesar-Verfahrens, bei der sich die Verschiebezahl nach einem bestimmten Muster verändert – z. B. bei jedem Buchstaben um +1 erhöht. Dadurch entsteht ein einfaches polyalphabetisches Verfahren.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Vigenère-Verfahren</h2>
          <p>
            Das <strong><b>Vigenère-Verfahren</b></strong> verwendet ein Schlüsselwort, das über den Klartext gelegt wird. Jeder Buchstabe des Klartexts wird mit dem entsprechenden Buchstaben des Schlüsselwortes verschlüsselt – mit Hilfe der Tabula Recta oder einer Chiffrierscheibe. So entstehen gleichmäßige, aber variierende Verschiebungen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Kasiski-Test und Kolonnenanalyse</h2>
          <p>
            Der <strong><b>Kasiski-Test</b></strong> hilft dabei, die Schlüssellänge eines Vigenère-verschlüsselten Textes zu ermitteln, indem man gleiche Buchstabengruppen im Geheimtext sucht und die Abstände analysiert. Kennt man die Schlüssellänge, kann man mit der <strong><b>Kolonnenanalyse</b></strong> fortfahren: Man unterteilt den Geheimtext in Spalten (eine pro Schlüsselbuchstabe) und führt für jede Spalte eine Häufigkeitsanalyse durch.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">One-Time-Pad</h2>
          <p>
            Das <strong><b>One-Time-Pad</b></strong> ist eine besonders sichere Variante des Vigenère-Verfahrens. Dabei ist der Schlüssel so lang wie der Klartext, völlig zufällig gewählt und wird nur ein einziges Mal verwendet. Wenn diese Regeln eingehalten werden, ist das Verfahren mathematisch (nachgewiesen) unknackbar.
          </p>
        </section>

        <section>
            <h2 className="text-xl font-semibold text-white mb-2">Vigenère-Tool</h2>
            <VigenereTool />
        </section>
      </div>

      <div className="mt-6">
        <WeiterButton to="/level3/pruefung" />
      </div>
    </div>
  );
}
