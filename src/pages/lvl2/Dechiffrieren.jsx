import React, { useState } from "react";
import useLevelGuard from "../components/LevelGuard";
import WeiterButton from "../components/WeiterButton";

export default function Dechiffrieren() {
  useLevelGuard("level1Passed");

  const [userInput, setUserInput] = useState("");
  const [showSolution, setShowSolution] = useState(false);

  const klartext = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const geheimtext = "MNBVCXZLKJHGFDSAPOIUYTREWQ".split("");
  const botschaft = "JCUQU LMIU VY TCOIUMDVCD XOCFVCO QCKUOCKICDCO";

  const entschlüsseln = (geheimtext) => {
    return geheimtext
      .split("")
      .map((char) => {
        const index = geheimtextAlphabet.indexOf(char.toUpperCase());
        return index !== -1 ? klartextAlphabet[index] : "?";
      })
      .join("");
  };

  const klartextAlphabet = klartext;
  const geheimtextAlphabet = geheimtext;

  return (
    <>
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 text-style">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-4 heading-style">Al-Kindi stellt eine Aufgabe</h1>
          <p className="mb-4">
            Al-Kindi legt dir ein neues Geheimtextalphabet sowie eine verschlüsselte Nachricht vor.
          </p>
          <p className="mb-4">
            <i>„Jetzt bist du dran“</i>, sagt Al-Kindi. <i>„Entschlüssele diese Nachricht: <strong className="text-white font-bold">{botschaft}</strong>!“</i>
          </p>
          <div className="overflow-x-auto mt-8 text-style">
              <h2 className="text-xl font-bold mb-2 heading-style">Klartext- und Geheimtextalphabet</h2>
              <table className="table-auto border border-white mb-4">
                  <thead>
                      <tr>
                          {klartext.map((char, i) => (
                              <th key={i} className="border px-2 py-1">{char}</th>
                              ))}
                          </tr>
                          </thead>
                          <tbody>
                              <tr>
                                  {geheimtext.map((char, i) => (
                                      <td key={i} className="border px-2 py-1">{char}</td>
                                      ))}
                                  </tr>
                                  </tbody>
                                  </table>
                                  </div>
          <div className="mb-4">
            <label htmlFor="input" className="font-bold block mb-2">Deine Entschlüsselung:</label>
            <input
              id="input"
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full p-2 rounded text-black"
              placeholder="Gib hier deinen Klartext ein..."
            />
          </div>
          <button
            onClick={() => setShowSolution(true)}
            className="mt-2 px-4 py-2 border border-white text-white rounded hover:bg-white hover:text-black transition"
          >
            Lösung anzeigen
          </button>
          {showSolution && (
            <p className="mt-4">
              <b>Richtige Lösung:</b> JETZT HAST DU VERSTANDEN FREMDER ZEITREISENDER
            </p>
          )}
      <p className="mb-4">
            <br></br>Du entschließt, Al-Kindi für seine Hilfe zu danken, indem du ihm eine verschlüsselte Nachricht schreibst.
            Du verwendest das gleiche Geheimtextalphabet und schreibst: <strong className="text-white font-bold">"HAB DANK MEISTER ALKINDI"</strong>
            <br /><br /><em>Hinweis: Notiere dir die verschlüsselte Nachricht für die Zwischenprüfung.</em>
          </p>
        </div>
      </div>

      <WeiterButton to="/level2/kryptoanalyse" />
    </>
  );
}
