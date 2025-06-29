import React, { useState } from "react";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function VigenereChiffreTool() {
  const [key, setKey] = useState("GEHEIM");
  const [plaintext, setPlaintext] = useState("HIER STEHT DIE INFORMATION");

  const sanitize = (text) => {
    return text.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 30);
  };

  const sanitizedKey = sanitize(key);
  const sanitizedPlaintext = sanitize(plaintext);

  const extendedKey = sanitizedKey.length > 0
    ? sanitizedKey.repeat(Math.ceil(sanitizedPlaintext.length / sanitizedKey.length)).slice(0, sanitizedPlaintext.length)
    : "";

  const calculate = () => {
    if (sanitizedKey.length === 0 || sanitizedPlaintext.length === 0) {
      return { plain: [], key: [], shifts: [], cipher: [] };
    }
    const plain = sanitizedPlaintext;
    const keySeq = extendedKey;
    const shiftVals = keySeq.split('').map(k => alphabet.indexOf(k));
    const cipher = plain.split('').map((char, idx) => {
      const shift = shiftVals[idx];
      const charIndex = alphabet.indexOf(char);
      return alphabet[(charIndex + shift) % 26];
    });
    return {
      plain: plain.split(''),
      key: keySeq.split(''),
      shifts: shiftVals,
      cipher
    };
  };

  const { plain, key: keyLine, shifts, cipher } = calculate();

  return (
    <div className="mt-6 p-4 bg-white/10 rounded">
      <div className="mb-4">
        <label className="block mb-1">Schlüssel:</label>
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          maxLength={30}
          className="w-full p-2 rounded bg-white/10 border border-white/20"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Klartext:</label>
        <input
          type="text"
          value={plaintext}
          onChange={(e) => setPlaintext(e.target.value)}
          maxLength={30}
          className="w-full p-2 rounded bg-white/10 border border-white/20"
        />
      </div>
      {plain.length > 0 && (
        <div className="overflow-x-auto mt-6">
          <table className="table-auto border-collapse text-center mx-auto">
            <tbody>
              <tr>
                <td className="pr-2 font-semibold">Klartext</td>
                {plain.map((char, i) => (
                  <td key={`plain-${i}`} className="border px-2 py-1">{char}</td>
                ))}
              </tr>
              <tr>
                <td className="pr-2 font-semibold">Schlüssel</td>
                {keyLine.map((char, i) => (
                  <td key={`key-${i}`} className="border px-2 py-1">{char}</td>
                ))}
              </tr>
              <tr>
                <td className="pr-2 font-semibold">Verschiebung</td>
                {shifts.map((num, i) => (
                  <td key={`shift-${i}`} className="border px-2 py-1">{num}</td>
                ))}
              </tr>
              <tr>
                <td className="pr-2 font-semibold">Geheimtext</td>
                {cipher.map((char, i) => (
                  <td key={`cipher-${i}`} className="border px-2 py-1 font-bold text-green-300">{char}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
