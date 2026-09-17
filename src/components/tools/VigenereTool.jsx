import { useState } from "react";
import { vigenere } from "../../lib/crypto";

export default function VigenereTool({ initialGeheimtext = "" }) {
  const [key, setKey] = useState("");
  const [plaintext, setPlaintext] = useState("");
  const [ciphertext, setCiphertext] = useState(initialGeheimtext);

  const textareaClass = "w-full bg-white/10 border border-white/20 p-2 rounded text-white font-mono break-all";

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="vigenere-tool-key" className="font-semibold block mb-1 text-white">
          Schlüssel:
        </label>
        <input
          id="vigenere-tool-key"
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          maxLength={30}
          className="w-full bg-white/10 border border-white/20 p-2 rounded text-white"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="vigenere-tool-plain" className="font-semibold block mb-1 text-white">
          Klartext:
        </label>
        <textarea
          id="vigenere-tool-plain"
          value={plaintext}
          onChange={(e) => setPlaintext(e.target.value)}
          rows={3}
          className={textareaClass}
        />
      </div>

      <div className="flex flex-wrap gap-4 mb-4 justify-center">
        <button type="button" onClick={() => setCiphertext(vigenere(plaintext, key))} className="btn" disabled={!key}>
          ↓ verschlüsseln
        </button>
        <button
          type="button"
          onClick={() => setPlaintext(vigenere(ciphertext, key, true))}
          className="btn"
          disabled={!key}
        >
          ↑ entschlüsseln
        </button>
      </div>

      <div>
        <label htmlFor="vigenere-tool-cipher" className="font-semibold block mb-1 text-white">
          Geheimtext:
        </label>
        <textarea
          id="vigenere-tool-cipher"
          value={ciphertext}
          onChange={(e) => setCiphertext(e.target.value)}
          rows={3}
          className={textareaClass}
        />
      </div>
    </div>
  );
}
