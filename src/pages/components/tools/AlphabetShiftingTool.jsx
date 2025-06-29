import React, { useState } from "react";

const klartextAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function AlphabetShiftingTool({ initialText }) {
  const [verschiebeText, setVerschiebeText] = useState(initialText || "");
  const [caesarShift, setCaesarShift] = useState(0);
  const [showCaesarFreq, setShowCaesarFreq] = useState(false);

  const decryptCaesar = (text, shift) => {
    return text
      .toUpperCase()
      .split("")
      .map((char) => {
        if (/[A-Z]/.test(char)) {
          let index = (char.charCodeAt(0) - 65 - shift + 26) % 26;
          return String.fromCharCode(index + 65);
        }
        return char;
      })
      .join("");
  };

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
    const haeufigster = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "?";
    const abstand = (haeufigster.charCodeAt(0) - "E".charCodeAt(0) + 26) % 26;
    const schluessel = String.fromCharCode("A".charCodeAt(0) + abstand);

    return (
      <div className="flex items-start gap-4">
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
        <div className="text-sm max-w-lg bg-white/10 p-4 rounded">
          Häufigster Buchstabe: <strong>{haeufigster}</strong><br />
          Abstand zu 'E': <strong>{abstand}</strong><br />
          Vermuteter Schlüssel: <strong>{schluessel}</strong>
        </div>
      </div>
    );
  };

  const getGeheimAlphabet = (shift) => {
    return klartextAlphabet.map((_, i) => klartextAlphabet[(i + shift) % 26]);
  };

  return (
    <div className="mb-8">
      <textarea
        value={verschiebeText}
        onChange={(e) => setVerschiebeText(e.target.value)}
        className="w-full p-2 text-black rounded mb-2"
        rows={2}
      />
      <div className="flex items-center justify-center gap-4 mb-2">
        <button onClick={() => setCaesarShift((caesarShift + 25) % 26)} className="px-2 py-1 border rounded">⬅</button>
        <div className="text-center">
          <div><strong>Schlüssel:</strong> {klartextAlphabet[caesarShift]}</div>
          <div><strong>Verschiebezahl:</strong> {caesarShift}</div>
          <table className="table-fixed text-sm border mt-2">
            <thead>
              <tr>
                {klartextAlphabet.map((char, i) => (
                  <th key={i} className="border w-7 h-7">{char}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {getGeheimAlphabet(caesarShift).map((char, i) => (
                  <td key={i} className="border text-center w-7 h-7">{char}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <button onClick={() => setCaesarShift((caesarShift + 1) % 26)} className="px-2 py-1 border rounded">➡</button>
      </div>
      <div className="bg-white/10 p-4 rounded text-sm mb-4">
        {decryptCaesar(verschiebeText, caesarShift)}
      </div>
      <button
        onClick={() => setShowCaesarFreq(!showCaesarFreq)}
        className="mb-2 px-4 py-2 border border-white text-white rounded hover:bg-white hover:text-black transition"
      >
        Buchstabenhäufigkeit anzeigen
      </button>
      {showCaesarFreq && renderHaeufigkeitBalken(analyseHaeufigkeit(verschiebeText))}
    </div>
  );
}

