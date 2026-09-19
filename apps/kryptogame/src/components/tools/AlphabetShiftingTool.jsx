import { useState } from "react";
import {
  ALPHABET,
  caesar,
  guessCaesarShift,
  letterCounts,
  mod,
  mostFrequentLetter,
  shiftedAlphabet,
} from "../../lib/crypto";
import FrequencyBars from "../FrequencyBars";
import ScrollArea from "../ScrollArea";

/** Brute Force beim Verschiebeverfahren: alle 26 Schlüssel durchprobieren. */
export default function AlphabetShiftingTool({ initialText = "" }) {
  const [text, setText] = useState(initialText);
  const [shift, setShift] = useState(0);
  const [showFrequencies, setShowFrequencies] = useState(false);

  const cipherAlphabet = shiftedAlphabet(shift);
  const guessedShift = guessCaesarShift(text);

  return (
    <div className="mb-8">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-2 text-black rounded mb-2"
        rows={2}
        aria-label="Geheimtext"
      />
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-2">
        <button
          type="button"
          onClick={() => setShift(mod(shift - 1, 26))}
          className="px-2 py-1 border rounded"
          aria-label="Vorheriger Schlüssel"
        >
          ⬅
        </button>
        <div className="text-center min-w-0">
          <div>
            <strong>Schlüssel:</strong> {ALPHABET[shift]}
          </div>
          <div>
            <strong>Verschiebezahl:</strong> {shift}
          </div>
          <ScrollArea>
            <table className="table-fixed text-sm border mt-2">
              <tbody>
                <tr>
                  {[...ALPHABET].map((char) => (
                    <th key={char} className="border w-7 h-7">
                      {char}
                    </th>
                  ))}
                </tr>
                <tr>
                  {[...cipherAlphabet].map((char, i) => (
                    <td key={i} className="border text-center w-7 h-7">
                      {char}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </ScrollArea>
        </div>
        <button
          type="button"
          onClick={() => setShift(mod(shift + 1, 26))}
          className="px-2 py-1 border rounded"
          aria-label="Nächster Schlüssel"
        >
          ➡
        </button>
      </div>
      <div className="panel text-sm mb-4" aria-live="polite">
        {caesar(text.toUpperCase(), -shift)}
      </div>
      <button type="button" onClick={() => setShowFrequencies(!showFrequencies)} className="btn mb-2">
        Buchstabenhäufigkeit {showFrequencies ? "ausblenden" : "anzeigen"}
      </button>
      {showFrequencies && guessedShift !== null && (
        <div className="flex flex-wrap items-start gap-4">
          <FrequencyBars counts={letterCounts(text)} />
          <div className="text-sm max-w-lg panel">
            Häufigster Buchstabe: <strong>{mostFrequentLetter(text)}</strong>
            <br />
            Abstand zu 'E': <strong>{guessedShift}</strong>
            <br />
            Vermuteter Schlüssel: <strong>{ALPHABET[guessedShift]}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
