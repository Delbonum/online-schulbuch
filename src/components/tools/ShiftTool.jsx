import { useState } from "react";
import { ALPHABET, caesar } from "../../lib/crypto";

export default function ShiftTool() {
  const [text, setText] = useState("");
  const [shift, setShift] = useState(3);
  const [mode, setMode] = useState("encrypt");

  const result = caesar(text, mode === "encrypt" ? shift : -shift);
  const inverseShift = (26 - shift) % 26;

  return (
    <div className="space-y-4 text-style">
      <div>
        <label htmlFor="shift-mode" className="block text-white font-semibold">
          Modus:
        </label>
        <select id="shift-mode" value={mode} onChange={(e) => setMode(e.target.value)} className="input-style">
          <option value="encrypt">Verschlüsseln</option>
          <option value="decrypt">Entschlüsseln</option>
        </select>
      </div>

      <div>
        <label htmlFor="shift-text" className="block text-white font-semibold">
          Text:
        </label>
        <input
          id="shift-text"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input-style w-full"
        />
      </div>

      <div>
        <label htmlFor="shift-value" className="block text-white font-semibold">
          {mode === "decrypt"
            ? "Verschiebezahl n (Schlüssel s | Verschiebezahl n′):"
            : "Verschiebezahl n (Schlüssel s):"}
        </label>
        <input
          id="shift-value"
          type="number"
          value={shift}
          onChange={(e) => setShift(Math.max(0, Math.min(25, Number(e.target.value) || 0)))}
          min="0"
          max="25"
          className="input-style w-20 inline-block"
        />
        <span className="ml-2 text-white">
          ({ALPHABET[shift]}
          {mode === "decrypt" && ` | ${inverseShift}`})
        </span>
      </div>

      <div>
        <p className="block text-white font-semibold">Ergebnis:</p>
        <div className="border rounded p-2 bg-white text-black min-h-[2.5rem]" aria-live="polite">
          {result}
        </div>
      </div>
    </div>
  );
}
