import React from "react";
import TabulaRectaTool from '../components/tools/TabulaRectaTool';
import useLevelGuard from "../components/LevelGuard";
import WeiterButton from "../components/WeiterButton";
import trithemius from "../../img/trithemius.png";
import bellaso from "../../img/bellaso.png";
import vigenere from "../../img/vigenere.png";

export default function Historie() {
  useLevelGuard("level2Passed");

  return (
    <div>
      <h1 className="text-2xl font-bold heading-style mb-4">
        Begegnungen mit Trithemius, Bellaso und Vigenère
      </h1>

      <div className="space-y-8 text-style">
        <div className="flex flex-col md:flex-row items-start gap-4">
          <img src={trithemius} alt="Trithemius" className="w-80 h-auto self-start" />
          <p>
            Du findest dich im 16. Jahrhundert wieder. Bücher, Manuskripte und erste Drucke erzählen dir vom Werk des deutschen Benediktinermönchs <strong>Johannes Trithemius</strong>.
            In seiner Abhandlung <em>Polygraphiae libri sex</em> beschreibt er die sogenannte <strong>Tabula Recta</strong> – eine quadratische Tabelle mit 26 Zeilen, die jeweils um einen Buchstaben versetzt sind.
            Sie erinnert dich an deine Idee, die Verschiebezahl ständig zu verändern.<br></br><br></br>
            Dir fällt auf, dass du die Tabula Recta auch nutzen kannst, um nach Caesars Verfahren zu verschlüsseln:
            Stellst du entwa den Schlüsselbuchstaben 'D' ein, so wird das Geheimtextalphabet 'DEFGHIJKLMNOPQRSTUVWXYZABC' markiert, das sich bei der Verschiebezahl 3 ergibt.
            Für jeden Klartextbuchstaben kannst du nun einfach die entsprechende Zeile der Tabula Recta nutzen, um den Geheimtextbuchstaben zu finden.
            Genauso kannst du für jeden Geheimtextbuchstaben in der Zeile zum Entschlüsseln in der Kopfzeile nachschauen, welches der entsprechende Klartextbuchstabe ist.
            Dann fällt dir außerdem auf: Um nach progressiver Caesar-Verschlüsselung zu verschlüsseln, musst du einfach nach jedem verschlüsselten Buchstaben in die nächste Zeile der Tabula Recta wechseln.
          </p>
        </div>
        <TabulaRectaTool />

        <div className="flex flex-col md:flex-row-reverse items-start gap-4">
          <img src={bellaso} alt="Bellaso" className="w-40 h-auto self-start" />
          <p>
            Doch damit nicht genug. Du reist weiter nach Italien und triffst auf den Kryptologen <strong>Giovan Battista Bellaso</strong>.
            Dieser nutzt zur Verschlüsselung nach wie vor eine <strong>Chiffrierscheibe</strong>, schlägt aber vor, das Alphabet nicht regelmäßig, sondern mithilfe eines Geheimwortes zu verändern.<br></br><br></br>
            Der erste Buchstabe des Geheimwortes bestimmt die Verschiebezahl für den ersten Klartextbuchstaben, der zweite Buchstabe die Verschiebezahl für den zweiten Klartextbuchstaben und so weiter.
            So wird für jeden Buchstaben ein anderes Geheimtextalphabet verwendet, das auf dem Schlüssel basiert.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-start gap-4">
          <img src={vigenere} alt="Vigenère" className="w-80 h-auto self-start" />
          <p>
            Schließlich begegnet dir der Franzose <strong>Blaise de Vigenère</strong>, der die Ideen von Trithemius und Bellaso aufgreift und verfeinert.
            Er schlägt vor, die Tabula Recta statt einer Chiffrierscheibe zu nutzen – aber mit einem Twist:
            Anstelle der geordneten Zeilen verwendet er <em>verwürfelte Alphabete</em>.<br></br><br></br>
            Seine Idee ist brillant, doch als du in der Zeit noch einige Jahrhunderte in die Zukunft reist, um zu überprüfen, ob Vigenères Idee auch später noch Anwendung findet, stellst du fest, dass dieser Vorschlag in Vergessenheit gerät.
            Stattdessen wird aber die ursprüngliche Form – die auf der Tabula Recta mit geordneten Buchstaben beruht – unter dem Namen <strong>Vigenère-Chiffre</strong> bekannt.<br></br><br></br>
            Du notierst dir alles in deinem Zeitreise-Journal. Der nächste Schritt ist klar:
            Du willst verstehen, wie die Vigenère-Chiffre genau funktioniert - wie sicher sie ist und ob du sie vielleicht knacken kannst...
          </p>
        </div>
      </div>

      <div className="mt-6">
        <WeiterButton to="/level3/vigenere" />
      </div>
    </div>
  );
}
