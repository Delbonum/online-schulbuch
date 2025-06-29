import React, { useState } from "react";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function TabulaRectaTool() {
  const [selected, setSelected] = useState({ row: 4, col: 6 }); // Vormarkiert (E, G)

  const handleCellClick = (rowIndex, colIndex) => {
    setSelected({ row: rowIndex, col: colIndex });
  };

  const handleHeaderClick = (type, index) => {
    if (type === "row") {
      setSelected((prev) => ({ ...prev, row: index }));
    } else if (type === "col") {
      setSelected((prev) => ({ ...prev, col: index }));
    }
  };

  return (
    <div className="mt-4 flex justify-center">
      <div className="relative">
        <div className="absolute -left-24 top-[50%] -translate-y-1/2 rotate-[-90deg] font-semibold text-center whitespace-nowrap text-red-500">
          Schlüsselbuchstabe
        </div>
        <div className="text-center mb-1 font-semibold text-yellow-500">Klartextbuchstabe</div>
        <table className="border-collapse text-center text-xs">
          <thead>
            <tr>
              <th className="w-6 h-6"></th>
              {alphabet.map((char, colIdx) => (
                <th
                  key={char}
                  className={`w-6 h-6 cursor-pointer ${selected.col === colIdx ? 'bg-yellow-500 text-black font-semibold' : 'bg-white/10'}`}
                  onClick={() => handleHeaderClick("col", colIdx)}
                >
                  {char}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alphabet.map((rowChar, rowIndex) => (
              <tr key={rowChar}>
                <th
                  className={`w-6 h-6 cursor-pointer ${selected.row === rowIndex ? 'bg-red-500 text-black font-semibold' : 'bg-white/10'}`}
                  onClick={() => handleHeaderClick("row", rowIndex)}
                >
                  {rowChar}
                </th>
                {alphabet.map((_, colIndex) => {
                  const charCode = (rowIndex + colIndex) % 26;
                  const char = alphabet[charCode];
                  const isCross = selected.row === rowIndex && selected.col === colIndex;
                  const isHighlighted = selected.row === rowIndex || selected.col === colIndex;
                  return (
                    <td
                      key={colIndex}
                      className={`w-6 h-6 border cursor-pointer ${isCross ? 'bg-blue-500 text-black font-semibold' : isHighlighted ? 'bg-blue-300 text-black font-semibold' : 'bg-white/10'}`}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {char}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-center mt-1 font-semibold text-blue-500">Geheimtextbuchstabe</div>
      </div>
    </div>
  );
}
