import { useState } from "react";
import AlphabetTable from "../../components/AlphabetTable";

export default function Dechiffrieren() {
  const [userInput, setUserInput] = useState("");
  const [showSolution, setShowSolution] = useState(false);

  const botschaft = "JCUQU LMIU VY TCOIUMDVCD XOCFVCO QCKUOCKICDVCO";

  return (
    <>
      <div className="min-w-0">
        <div>
          <h1 className="text-2xl font-bold mb-4 heading-style">Al-Kindi stellt eine Aufgabe</h1>
          <p className="mb-4">
            Al-Kindi legt dir ein neues Geheimtextalphabet sowie eine verschlüsselte Nachricht vor.
          </p>
          <p className="mb-4">
            <i>„Jetzt bist du dran“</i>, sagt Al-Kindi.{" "}
            <i>
              „Entschlüssele diese Nachricht: <strong className="text-white font-bold">{botschaft}</strong>!“
            </i>
          </p>
          <div className="mt-8 text-style">
            <h2 className="text-xl font-bold mb-2 heading-style">Klartext- und Geheimtextalphabet</h2>
            <div className="mb-4">
              <AlphabetTable cipher="MNBVCXZLKJHGFDSAPOIUYTREWQ" />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="input" className="font-bold block mb-2">
              Deine Entschlüsselung:
            </label>
            <input
              id="input"
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="input-style w-full uppercase"
              placeholder="Gib hier deinen Klartext ein..."
            />
          </div>
          <button onClick={() => setShowSolution(true)} className="btn mt-2">
            Lösung anzeigen
          </button>
          {showSolution && (
            <p className="mt-4">
              <b>Richtige Lösung:</b> JETZT HAST DU VERSTANDEN FREMDER ZEITREISENDER
            </p>
          )}
          <p className="mb-4">
            <br></br>Du beschließt, Al-Kindi für seine Hilfe zu danken, indem du ihm eine verschlüsselte Nachricht
            schreibst. Du verwendest das gleiche Geheimtextalphabet und schreibst:{" "}
            <strong className="text-white font-bold">"HAB DANK MEISTER ALKINDI"</strong>
            <br />
            <br />
            <em>Hinweis: Notiere dir die verschlüsselte Nachricht für die Zwischenprüfung.</em>
          </p>
        </div>
      </div>
    </>
  );
}
