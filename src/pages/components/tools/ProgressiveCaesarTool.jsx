import React, { useState } from "react";

export default function ProgressiveCaesarTool() {
  const [text, setText] = useState("");
  const [startValue, setStartValue] = useState("1");
  const [rule, setRule] = useState("+1");
  const [error, setError] = useState("");

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const parseRule = (ruleString) => {
  const safeRule = ruleString.trim().match(/^[\+\-\*\/]/)
    ? `n${ruleString}`
    : ruleString;
  return new Function("n", `return (${safeRule}) % 26`);
};


  const applyProgressiveCaesar = (input, start, ruleFunc) => {
    let result = [];
    let shifts = [];
    let currentShift = parseInt(start);
    input = input.toUpperCase();

    for (let char of input) {
      if (alphabet.includes(char)) {
        const index = alphabet.indexOf(char);
        const newIndex = ((index + currentShift) % 26 + 26) % 26;
        result.push(alphabet[newIndex]);
        shifts.push(currentShift);
        currentShift = ruleFunc(currentShift);
      } else {
        result.push(char);
        shifts.push("");
      }
    }

    return { result: result.join(""), shifts };
  };

  let transformed = { result: "", shifts: [] };
  let tempError = "";
  try {
      const ruleFunc = parseRule(rule);
      transformed = applyProgressiveCaesar(text, startValue, ruleFunc);
      } catch (e) {
          tempError = "Ungültige Regel. Bitte gib eine gültige mathematische Regel ein, z. B. '+1', '*2-1'.";
          }
      if (error !== tempError) {
          setError(tempError);
          }

  return (
    <div className="mt-8 p-4 bg-white/10 rounded">
      <h2 className="text-xl font-semibold mb-4">Verschlüsseln mit progressiver Caesar-Chiffre</h2>

      <div className="mb-4">
        <label className="block font-semibold">Klartext:</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input-style w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block font-semibold">Startwert der Verschiebezahl:</label>
          <input
            type="number"
            value={startValue}
            onChange={(e) => setStartValue(e.target.value)}
            className="input-style w-full"
          />
        </div>

        <div>
          <label className="block font-semibold">Regel zur Veränderung (z. B. +1, *2, *3-1):</label>
          <input
            type="text"
            value={rule}
            onChange={(e) => setRule(e.target.value)}
            className="input-style w-full"
          />
        </div>
      </div>

      {error && (
        <div className="text-red-500 font-semibold mb-4">
          {error}
        </div>
      )}

      {text && !error && (
        <div className="mt-6">
          <div className="overflow-x-auto">
            <table className="table-fixed border-collapse text-center w-full">
              <thead>
                <tr>
                  {text.toUpperCase().split("").map((char, idx) => (
                    <th key={idx} className="px-1 text-sm font-medium">
                      {char}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {transformed.shifts.map((val, idx) => (
                    <td key={idx} className="px-1 text-xs">
                      {val !== "" ? val : " "}
                    </td>
                  ))}
                </tr>
                <tr>
                  {transformed.result.split("").map((char, idx) => (
                    <td key={idx} className="px-1 font-semibold">
                      {char}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
