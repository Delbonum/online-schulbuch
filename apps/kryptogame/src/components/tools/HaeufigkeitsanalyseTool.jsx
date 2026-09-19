import { useState } from "react";
import { ALPHABET, applyMapping, frequencyMapping, letterCounts } from "../../lib/crypto";
import FrequencyBars from "../FrequencyBars";
import ScrollArea from "../ScrollArea";

/** Kryptoanalyse des Ersetzungsverfahrens: Zuordnung Geheimtext → Klartext schrittweise ermitteln. */
export default function HaeufigkeitsanalyseTool({ initialText = "" }) {
  const [text, setText] = useState(initialText);
  const [mapping, setMapping] = useState(() => Array(26).fill(""));
  const [showFrequencies, setShowFrequencies] = useState(false);

  const updateLetter = (index, value) => {
    const next = [...mapping];
    next[index] = value
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(-1);
    setMapping(next);
  };

  return (
    <div className="mb-8">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-2 text-black rounded mb-2"
        rows={6}
        aria-label="Geheimtext"
      />
      <button type="button" onClick={() => setShowFrequencies(!showFrequencies)} className="btn mb-2">
        Buchstabenhäufigkeit {showFrequencies ? "ausblenden" : "anzeigen"}
      </button>
      {showFrequencies && <FrequencyBars counts={letterCounts(text)} />}

      <p className="mt-4 font-bold">Klartextalphabet ermitteln:</p>
      <ScrollArea>
        <table className="table-auto text-sm border mb-4">
          <tbody>
            <tr>
              <th scope="row" className="border px-2">
                Klartext:
              </th>
              {[...ALPHABET].map((char, i) => (
                <td key={char} className="border px-1 py-1 w-8">
                  <input
                    type="text"
                    value={mapping[i]}
                    onChange={(e) => updateLetter(i, e.target.value)}
                    className="w-6 text-black text-center uppercase"
                    aria-label={`Klartextbuchstabe für ${char}`}
                  />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="border px-2">
                Geheimtext:
              </th>
              {[...ALPHABET].map((char) => (
                <td key={char} className="border px-1 py-1 text-center w-8">
                  {char}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </ScrollArea>
      <p className="mb-1 font-bold">Entschlüsselter Text mit deinem Alphabet:</p>
      <div className="panel text-sm mb-2 max-h-36 overflow-y-auto">{applyMapping(text, mapping)}</div>
      <div className="flex flex-wrap gap-2 mt-2">
        <button type="button" onClick={() => setMapping(frequencyMapping(text))} className="btn">
          Zuordnung aufgrund der Häufigkeiten
        </button>
        <button type="button" onClick={() => setMapping(Array(26).fill(""))} className="btn">
          Zuordnung leeren
        </button>
      </div>
    </div>
  );
}
