import { useMemo, useState } from "react";
import { lettersOnly, repeatedSequences } from "../../lib/crypto";

/** Kasiski-Test: Abstände wiederholter Trigramme gegen eine vermutete Schlüssellänge prüfen. */
export default function SchluessellaengenTool({ initialText = "" }) {
  const [text, setText] = useState(initialText);
  const [length, setLength] = useState(6);

  const safeLength = Math.max(1, length || 1);
  const repeats = useMemo(() => repeatedSequences(text, 3), [text]);
  const matching = repeats.filter((r) => r.distance % safeLength === 0).length;

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="kasiski-text" className="block font-semibold mb-1 text-white">
          Geheimtext:
        </label>
        <textarea
          id="kasiski-text"
          rows={5}
          className="w-full p-2 rounded bg-black/20 text-white"
          value={text}
          onChange={(e) => setText(lettersOnly(e.target.value))}
        />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label htmlFor="kasiski-laenge" className="font-semibold text-white">
          Zu prüfende Schlüssellänge:
        </label>
        <input
          id="kasiski-laenge"
          type="number"
          min={1}
          max={30}
          className="w-16 p-1 rounded bg-black/20 text-white"
          value={length}
          onChange={(e) => setLength(parseInt(e.target.value, 10) || 1)}
        />
      </div>
      <div className="overflow-auto max-h-64 bg-white/10 rounded p-2 text-sm">
        <table className="w-full text-white">
          <thead>
            <tr className="text-left">
              <th className="pr-4">Trigramm</th>
              <th className="pr-4">1. Position</th>
              <th className="pr-4">2. Position</th>
              <th className="pr-4">Abstand</th>
              <th className="pr-4">passt zu Schlüssellänge {safeLength}</th>
            </tr>
          </thead>
          <tbody>
            {repeats.map((entry, i) => {
              const fits = entry.distance % safeLength === 0;
              return (
                <tr key={i} className={fits ? "text-green-400" : "text-red-400"}>
                  <td className="pr-4 font-mono">{entry.sequence}</td>
                  <td className="pr-4">{entry.first}</td>
                  <td className="pr-4">{entry.second}</td>
                  <td className="pr-4">{entry.distance}</td>
                  <td className="pr-4">{fits ? "✓" : "✗"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-white">
        {matching} passende Paare / {repeats.length - matching} nicht passend
      </p>
    </div>
  );
}
