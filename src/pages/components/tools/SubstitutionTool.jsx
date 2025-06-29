import React, { useState } from "react";

const standard = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function applySubstitution(text, alphabet, mode) {
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

export default function SubstitutionTool() {
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
    <div className="space-y-4">
      <div>
        <label className="block font-semibold">Modus:</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="input-style"
        >
          <option value="encrypt">Verschlüsseln</option>
          <option value="decrypt">Entschlüsseln</option>
        </select>
      </div>

      <div>
        <label className="block font-semibold">Text:</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input-style w-full"
        />
      </div>

      <div>
        <label className="block font-semibold">Schlüsselalphabet (26 Buchstaben):</label>
        <input
          type="text"
          value={key}
          onChange={(e) => handleKeyChange(e.target.value)}
          className="input-style w-full"
          maxLength={26}
        />
        <p className="text-sm text-white/70 mt-1">
          Beispiel: QWERTZUIOPASDFGHJKLYXCVBNM
        </p>
      </div>

      <div>
        <label className="block font-semibold">Ergebnis:</label>
        <div className="border rounded p-2 bg-white text-black">{result}</div>
      </div>
    </div>
  );
}
