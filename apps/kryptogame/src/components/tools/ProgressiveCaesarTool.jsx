import { useMemo, useState } from "react";
import { parseShiftRule, progressiveCaesar } from "../../lib/crypto";
import ScrollArea from "../ScrollArea";

export default function ProgressiveCaesarTool() {
  const [text, setText] = useState("");
  const [startValue, setStartValue] = useState("1");
  const [rule, setRule] = useState("+1");
  const [mode, setMode] = useState("encrypt");

  const { transformed, error } = useMemo(() => {
    try {
      const nextShift = parseShiftRule(rule);
      const start = parseInt(startValue, 10) || 0;
      return { transformed: progressiveCaesar(text, start, nextShift, mode === "decrypt"), error: null };
    } catch {
      return {
        transformed: null,
        error: "Ungültige Regel. Bitte gib eine gültige mathematische Regel ein, z. B. '+1', '*2' oder '*3-1'.",
      };
    }
  }, [text, startValue, rule, mode]);

  return (
    <div className="mt-8 panel">
      <h2 className="text-xl font-semibold mb-4">
        {mode === "encrypt" ? "Verschlüsseln" : "Entschlüsseln"} mit progressiver Caesar-Chiffre
      </h2>

      <div className="mb-4">
        <label htmlFor="progressive-mode" className="block font-semibold">
          Modus:
        </label>
        <select id="progressive-mode" value={mode} onChange={(e) => setMode(e.target.value)} className="input-style">
          <option value="encrypt">Verschlüsseln</option>
          <option value="decrypt">Entschlüsseln</option>
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="progressive-text" className="block font-semibold">
          {mode === "encrypt" ? "Klartext:" : "Geheimtext:"}
        </label>
        <input
          id="progressive-text"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input-style w-full"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="progressive-start" className="block font-semibold">
            Startwert der Verschiebezahl:
          </label>
          <input
            id="progressive-start"
            type="number"
            value={startValue}
            onChange={(e) => setStartValue(e.target.value)}
            className="input-style w-full"
          />
        </div>

        <div>
          <label htmlFor="progressive-rule" className="block font-semibold">
            Regel zur Veränderung (z. B. +1, *2, *3-1):
          </label>
          <input
            id="progressive-rule"
            type="text"
            value={rule}
            onChange={(e) => setRule(e.target.value)}
            className="input-style w-full"
          />
        </div>
      </div>

      {error && <div className="text-red-400 font-semibold mb-4">{error}</div>}

      {text && transformed && (
        <ScrollArea className="mt-6">
          <table className="border-collapse text-center">
            <tbody>
              <tr>
                <th scope="row" className="pr-3 text-left text-sm font-semibold whitespace-nowrap">
                  {mode === "encrypt" ? "Klartext" : "Geheimtext"}
                </th>
                {[...text.toUpperCase()].map((char, i) => (
                  <td key={i} className="px-1 text-sm font-medium">
                    {char}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="pr-3 text-left text-xs font-semibold whitespace-nowrap">
                  Verschiebung
                </th>
                {transformed.shifts.map((value, i) => (
                  <td key={i} className="px-1 text-xs">
                    {value ?? ""}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="pr-3 text-left text-sm font-semibold whitespace-nowrap">
                  {mode === "encrypt" ? "Geheimtext" : "Klartext"}
                </th>
                {[...transformed.result].map((char, i) => (
                  <td key={i} className="px-1 font-semibold">
                    {char}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </ScrollArea>
      )}
    </div>
  );
}
