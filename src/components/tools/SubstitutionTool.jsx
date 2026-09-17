import { useState } from "react";
import { normalizeSubstitutionKey, substitute } from "../../lib/crypto";

export default function SubstitutionTool() {
  const [mode, setMode] = useState("encrypt");
  const [text, setText] = useState("");
  const [key, setKey] = useState("QWERTZUIOPASDFGHJKLYXCVBNM");

  const result = substitute(text, key, mode === "decrypt");

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="substitution-mode" className="block font-semibold">
          Modus:
        </label>
        <select id="substitution-mode" value={mode} onChange={(e) => setMode(e.target.value)} className="input-style">
          <option value="encrypt">Verschlüsseln</option>
          <option value="decrypt">Entschlüsseln</option>
        </select>
      </div>

      <div>
        <label htmlFor="substitution-text" className="block font-semibold">
          Text:
        </label>
        <input
          id="substitution-text"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input-style w-full"
        />
      </div>

      <div>
        <label htmlFor="substitution-key" className="block font-semibold">
          Schlüsselalphabet (26 Buchstaben):
        </label>
        <input
          id="substitution-key"
          type="text"
          value={key}
          onChange={(e) => setKey(normalizeSubstitutionKey(e.target.value))}
          className="input-style w-full font-mono"
          maxLength={26}
        />
        <p className="text-sm text-white/70 mt-1">
          Beispiel: QWERTZUIOPASDFGHJKLYXCVBNM
          {key.length < 26 && ` – noch ${26 - key.length} Buchstaben ohne Zuordnung`}
        </p>
      </div>

      <div>
        <p className="block font-semibold">Ergebnis:</p>
        <div className="border rounded p-2 bg-white text-black min-h-[2.5rem]" aria-live="polite">
          {result}
        </div>
      </div>
    </div>
  );
}
