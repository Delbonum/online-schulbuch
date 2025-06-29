import React, { useState } from "react";

function caesarEncrypt(text, shift) {
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + shift) % 26) + 65);
      } else if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + shift) % 26) + 97);
      } else {
        return char;
      }
    })
    .join("");
}

function caesarDecrypt(text, shift) {
  return caesarEncrypt(text, 26 - shift);
}

export default function ShiftTool() {
  const [text, setText] = useState("");
  const [shift, setShift] = useState(3);
  const [mode, setMode] = useState("encrypt");

  const result =
    mode === "encrypt"
      ? caesarEncrypt(text, shift)
      : caesarDecrypt(text, shift);

  const inverseShift = (26 - shift) % 26;
  const label = mode === "decrypt"
    ? "Verschiebezahl n (Schlüssel s | Verschiebezahl n′):"
    : "Verschiebezahl n (Schlüssel s):";

  return (
    <div className="space-y-4 text-style">
      <div>
        <label className="block text-white font-semibold">Modus:</label>
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
        <label className="block text-white font-semibold">Text:</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input-style w-full"
        />
      </div>

      <div>
        <label className="block text-white font-semibold">{label}</label>
        <input
          type="number"
          value={shift}
          onChange={(e) => {
            const val = Math.max(0, Math.min(25, Number(e.target.value)));
            setShift(val);
          }}
          min="0"
          max="25"
          className="input-style w-20 inline-block"
        />
        <span className="ml-2 text-white">
          ({String.fromCharCode(65 + shift)}
          {mode === "decrypt" && ` | ${inverseShift}`}
          )
        </span>
      </div>

      <div>
        <label className="block text-white font-semibold">Ergebnis:</label>
        <div className="border rounded p-2 bg-white text-black">{result}</div>
      </div>
    </div>
  );
}
