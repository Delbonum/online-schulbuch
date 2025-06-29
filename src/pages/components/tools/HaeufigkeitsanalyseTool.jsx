import React, { useState } from "react";

const klartextAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const haeufigkeitDeutsch = "ENISRATDHULCGMOBWFKZPVJYXQ".split("");

export default function SubstitutionAnalysisTool({ initialText }) {
  const [ersetzenText, setErsetzenText] = useState(initialText || "");
  const [klartextZuordnung, setKlartextZuordnung] = useState(Array(26).fill(""));
  const [showSubFreq, setShowSubFreq] = useState(false);

  const analyseHaeufigkeit = (text) => {
    const freq = {};
    for (let c of text.toUpperCase()) {
      if (/[A-Z]/.test(c)) {
        freq[c] = (freq[c] || 0) + 1;
      }
    }
    return freq;
  };

  const renderHaeufigkeitBalken = (freq) => {
    const max = Math.max(...Object.values(freq));
    return (
      <div className="flex gap-2 mt-2 text-xs items-end">
        {Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .map(([char, count]) => (
            <div key={char} className="text-center">
              <div
                className="bg-white/20 mx-auto"
                style={{ height: `${(count / max) * 100}px`, width: "12px" }}
              ></div>
              <div>{char}</div>
            </div>
          ))}
      </div>
    );
  };

  const applyErsetzung = (text, zuordnung) => {
    let result = "";
    const mapping = {};
    zuordnung.forEach((klarChar, idx) => {
      const geheimChar = klartextAlphabet[idx];
      if (klarChar) {
        mapping[geheimChar] = klarChar;
      }
    });
    for (let c of text.toUpperCase()) {
      result += mapping[c] || c;
    }
    return result;
  };

  const haeufigkeitsbasiertesAlphabet = () => {
    const freq = analyseHaeufigkeit(ersetzenText);
    const geheimHaeufigkeit = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([c]) => c);
    const zuordnung = Array(26).fill("");
    geheimHaeufigkeit.forEach((c, i) => {
      if (i < haeufigkeitDeutsch.length) {
        const geheimIndex = klartextAlphabet.indexOf(c);
        if (geheimIndex !== -1) {
          zuordnung[geheimIndex] = haeufigkeitDeutsch[i];
        }
      }
    });
    setKlartextZuordnung(zuordnung);
  };

  const updateKlartextBuchstabe = (index, value) => {
    const newZuordnung = [...klartextZuordnung];
    newZuordnung[index] = value.toUpperCase();
    setKlartextZuordnung(newZuordnung);
  };

  return (
    <div className="mb-8">
      <textarea
        value={ersetzenText}
        onChange={(e) => setErsetzenText(e.target.value)}
        className="w-full p-2 text-black rounded mb-2"
        rows={6}
      />
      <button
        onClick={() => setShowSubFreq(!showSubFreq)}
        className="mb-2 px-4 py-2 border border-white text-white rounded hover:bg-white hover:text-black transition"
      >
        Buchstabenhäufigkeit anzeigen
      </button>
      {showSubFreq && renderHaeufigkeitBalken(analyseHaeufigkeit(ersetzenText))}

      <p className="mt-4 font-bold">Klartextalphabet ermitteln:</p>
      <div className="overflow-x-auto">
        <table className="table-auto text-sm border mb-4">
          <thead>
            <tr>
              <th className="border px-2">Klartext:</th>
              {klartextAlphabet.map((_, i) => (
                <th key={i} className="border px-1 py-1 w-8">
                  <input
                    type="text"
                    value={klartextZuordnung[i] || ""}
                    onChange={(e) => updateKlartextBuchstabe(i, e.target.value)}
                    maxLength={1}
                    className="w-6 text-black text-center"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className="border px-2">Geheimtext:</th>
              {klartextAlphabet.map((char, i) => (
                <td key={i} className="border px-1 py-1 text-center w-8">{char}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mb-1 font-bold">Entschlüsselter Text mit deinem Alphabet:</p>
      <div className="bg-white/10 p-4 rounded text-sm mb-2 max-h-36 overflow-y-auto">
        {applyErsetzung(ersetzenText, klartextZuordnung)}
      </div>
      <button
        onClick={haeufigkeitsbasiertesAlphabet}
        className="mt-2 px-4 py-2 border border-white text-white rounded hover:bg-white hover:text-black transition"
      >
        Zuordnung aufgrund der Häufigkeiten
      </button>
    </div>
  );
}
