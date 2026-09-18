import { useState } from "react";
import { letterIndex, lettersOnly, repeatKey, vigenere } from "../../lib/crypto";
import ScrollArea from "../ScrollArea";

const MAX_LENGTH = 30;

/** Zeigt Klartext, wiederholten Schlüssel, Verschiebung und Geheimtext untereinander. */
export default function VigenereChiffreTool() {
  const [key, setKey] = useState("GEHEIM");
  const [plaintext, setPlaintext] = useState("HIER STEHT DIE INFORMATION");

  const plain = lettersOnly(plaintext).slice(0, MAX_LENGTH);
  const keyLine = repeatKey(key, plain.length);
  const cipher = vigenere(plain, key);

  const rows = [
    ["Klartext", [...plain], ""],
    ["Schlüssel", [...keyLine], ""],
    ["Verschiebung", [...keyLine].map(letterIndex), ""],
    ["Geheimtext", [...cipher], "font-bold text-green-300"],
  ];

  return (
    <div className="mt-6 panel">
      <div className="mb-4">
        <label htmlFor="vigenere-key" className="block mb-1">
          Schlüssel:
        </label>
        <input
          id="vigenere-key"
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          maxLength={MAX_LENGTH}
          className="w-full p-2 rounded bg-white/10 border border-white/20"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="vigenere-plain" className="block mb-1">
          Klartext:
        </label>
        <input
          id="vigenere-plain"
          type="text"
          value={plaintext}
          onChange={(e) => setPlaintext(e.target.value)}
          maxLength={MAX_LENGTH}
          className="w-full p-2 rounded bg-white/10 border border-white/20"
        />
      </div>
      {plain.length > 0 && keyLine.length > 0 && (
        <ScrollArea className="mt-6">
          <table className="table-auto border-collapse text-center mx-auto">
            <tbody>
              {rows.map(([label, cells, className]) => (
                <tr key={label}>
                  <th scope="row" className="pr-2 font-semibold text-left">
                    {label}
                  </th>
                  {cells.map((cell, i) => (
                    <td key={i} className={`border px-2 py-1 ${className}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      )}
    </div>
  );
}
