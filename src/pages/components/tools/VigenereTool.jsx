import React, { useState } from "react";

export default function VigenereTool({ initialGeheimtext = "" }) {
  const [key, setKey] = useState("");
  const [plaintext, setPlaintext] = useState("");
  const [ciphertext, setCiphertext] = useState(initialGeheimtext);

  const vigenere = (text, key, decrypt = false) => {
    const aCode = "A".charCodeAt(0);
    const cleanText = text.toUpperCase().replace(/[^A-Z]/g, "");
    const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, "");
    if (!cleanKey.length) return "";

    let result = "";
    for (let i = 0; i < cleanText.length; i++) {
      const t = cleanText.charCodeAt(i) - aCode;
      const k = cleanKey.charCodeAt(i % cleanKey.length) - aCode;
      const shift = decrypt ? (t - k + 26) % 26 : (t + k) % 26;
      result += String.fromCharCode(aCode + shift);
    }
    return result;
  };

  const handleEncrypt = () => {
    setCiphertext(vigenere(plaintext, key, false));
  };

  const handleDecrypt = () => {
    setPlaintext(vigenere(ciphertext, key, true));
  };

  return (
    <div>
      <div className="mb-4">
        <label className="font-semibold block mb-1 text-white">Schlüssel:</label>
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          maxLength={30}
          className="w-full bg-white/10 border border-white/20 p-2 rounded text-white"
        />
      </div>

      <div className="mb-4">
        <label className="font-semibold block mb-1 text-white">Klartext:</label>
        <textarea
          value={plaintext}
          onChange={(e) => setPlaintext(e.target.value)}
          rows={3}
          className="w-full bg-white/10 border border-white/20 p-2 rounded text-white"
        />
      </div>

    <div className="flex gap-4 mb-4 justify-center">
      <button
        onClick={handleEncrypt}
        className="border border-white text-white font-semibold px-4 py-2 rounded hover:bg-white/10 transition duration-200"
      >
        ↓ verschlüsseln
      </button>
      <button
        onClick={handleDecrypt}
        className="border border-white text-white font-semibold px-4 py-2 rounded hover:bg-white/10 transition duration-200"
      >
        ↑ entschlüsseln
      </button>
    </div>

      <div>
        <label className="font-semibold block mb-1 text-white">Geheimtext:</label>
        <textarea
          value={ciphertext}
          onChange={(e) => setCiphertext(e.target.value)}
          rows={3}
          className="w-full bg-white/10 border border-white/20 p-2 rounded text-white"
        />
      </div>
    </div>
  );
}
