import { useState } from "react";
import { lettersOnly, mostFrequentLetter, splitColumns } from "../../lib/crypto";

export default function KolonnenanalyseTool({ initialText = "" }) {
  const [text, setText] = useState(initialText);
  const [length, setLength] = useState(6);
  const [result, setResult] = useState([]);

  const analyse = () => {
    const safeLength = Math.max(1, Math.min(30, length || 1));
    setResult(splitColumns(text, safeLength).map(mostFrequentLetter));
  };

  return (
    <div className="text-sm space-y-4">
      <div>
        <label htmlFor="kolonnen-text" className="block mb-1">
          Geheimtext:
        </label>
        <textarea
          id="kolonnen-text"
          className="w-full p-2 rounded bg-white/10 text-white"
          value={text}
          rows={4}
          onChange={(e) => setText(lettersOnly(e.target.value))}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label htmlFor="kolonnen-laenge">Schlüssellänge:</label>
        <input
          id="kolonnen-laenge"
          type="number"
          className="w-16 p-1 rounded bg-white/10 text-white"
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          min={1}
          max={30}
        />
        <button type="button" onClick={analyse} className="btn btn-sm">
          Buchstaben zählen
        </button>
      </div>
      {result.length > 0 && (
        <div className="mt-4">
          <div className="font-bold mb-1">Häufigste Buchstaben pro Kolonne:</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {result.map((letter, i) => (
              <div key={i} className="text-white">
                Kolonne {i + 1}: <span className="font-bold">{letter ?? "–"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
