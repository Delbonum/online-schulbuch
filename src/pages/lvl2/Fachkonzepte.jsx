import React, { useState } from "react";
import SubstitutionTool from "../components/tools/SubstitutionTool";
import useLevelGuard from "../components/LevelGuard";
import WeiterButton from "../components/WeiterButton";

function applySubstitution(text, alphabet, mode) {
  const standard = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const map = {};
  if (mode === "encrypt") {
    for (let i = 0; i < 26; i++) {
      map[standard[i]] = alphabet[i];
    }
  } else {
    for (let i = 0; i < 26; i++) {
      map[alphabet[i]] = standard[i];
    }
  }
  return text
    .toUpperCase()
    .split("")
    .map((c) => (map[c] ? map[c] : c))
    .join("");
}

export default function Fachkonzepte() {
  useLevelGuard("level1Passed");

  const [mode, setMode] = useState("encrypt");
  const [text, setText] = useState("");
  const [key, setKey] = useState("QWERTZUIOPASDFGHJKLYXCVBNM");

  const handleKeyChange = (value) => {
    const filtered = value
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .split("")
      .filter((char, index, self) => self.indexOf(char) === index)
      .join("");
    setKey(filtered);
  };

  const result = applySubstitution(text, key, mode);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 heading-style">Fachkonzepte</h1>

      <div className="space-y-6 text-style">
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Das Ersetzungsverfahren</h2>
          <p>
            Beim <strong><b>Ersetzungsverfahren</b></strong> wird jedem Buchstaben des Klartextalphabets ein anderer Buchstabe zugeordnet.
            So ergibt sich ein neues Schlüssel- bzw. Geheimtextalphabet, das bei der Verschlüsselung als Schlüssel verwendet wird.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Brute Force</h2>
          <p>
            Im Bereich der Informationssicherheit versteht man unter einem <strong><b>Brute-Force</b></strong>-Angriff (brute force method: <i>Methode der rohen Gewalt</i>) eine Hacking-Methode, bei der automatisierte Software eingesetzt wird, um bspw. eine korrekte Kombination aus Zeichen in Passwörtern und anderen Zugangsdaten zu ermitteln und so auf Systeme, Konten oder Informationen zuzugreifen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Häufigkeitsanalyse</h2>
          <p>
              Die <strong><b>Häufigkeitsanalyse</b></strong> ist eine Methode der Kryptoanalyse. Dabei werden statistische Eigenschaften des verschlüsselten Textes ausgenutzt, um Rückschlüsse auf die unverschlüsselte Nachricht zu ziehen.
            Es werden die Buchstabenhäufigkeiten im Geheimtext mit bekannten Buchstabenhäufigkeiten in der Sprache verglichen.
            So können Rückschlüsse auf das verwendete Schlüsselalphabet gezogen werden.
            Die Häufigkeitsanalyse wird seit dem 7. Jahrhundert benutzt, um Texte zu entschlüsseln, die mittels monoalphabetischer Verschlüsselung ohne Transposition chiffriert worden sind.
            Entdeckt wurde die Häufigkeitsanalyse von dem arabischen Gelehrten al-Kindī, erst deutlich später kam dieses Wissen nach Europa.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Monoalphabetische Chiffrierverfahren</h2>
          <p>
            Bei <strong><b>monoalphabetischen Verfahren</b></strong> wird jeder Buchstabe des Klartextes durch einen festen, eindeutig zugeordneten Buchstaben ersetzt.
            Diese Zuordnung bleibt während der gesamten Nachricht gleich.
            Das Caesar- bzw. Verschiebeverfahren sowie das Ersetzungsverfahren sind Beispiele für monoalphabetische Chiffrierverfahren.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Ersetzungs-Tool</h2>
          <SubstitutionTool />
        </section>
      </div>

      <div className="mt-6">
        <WeiterButton to="/level2/pruefung" />
      </div>
    </div>
  );
}
