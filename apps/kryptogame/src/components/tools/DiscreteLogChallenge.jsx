import { useState } from "react";
import { modPow, powerSteps } from "../../lib/crypto";
import ScrollArea from "../ScrollArea";

/** Umkehrung ausprobieren: Für welches x gilt g^x mod p = target? */
export default function DiscreteLogChallenge({ g = 3, p = 17, target = 13 }) {
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const check = (event) => {
    event.preventDefault();
    const x = parseInt(guess, 10);
    if (Number.isNaN(x) || x < 1) {
      setFeedback({ ok: false, text: "Gib eine positive ganze Zahl ein." });
      return;
    }
    const result = modPow(g, x, p);
    setFeedback(
      result === target
        ? { ok: true, text: `Richtig: ${g}^${x} mod ${p} = ${target}.` }
        : { ok: false, text: `${g}^${x} mod ${p} = ${result} – leider nicht ${target}. Versuche es weiter!` },
    );
  };

  return (
    <div className="panel space-y-3">
      <p className="text-white">
        Finde x mit{" "}
        <b>
          {g}
          <sup>x</sup> mod {p} = {target}
        </b>
      </p>
      <form onSubmit={check} className="flex flex-wrap items-center gap-3">
        <label htmlFor="dlog-guess">x =</label>
        <input
          id="dlog-guess"
          type="number"
          min={1}
          value={guess}
          onChange={(e) => {
            setGuess(e.target.value);
            setFeedback(null);
          }}
          className="input-style w-24"
        />
        <button type="submit" className="btn btn-sm">
          Prüfen
        </button>
      </form>
      {feedback && (
        <p className={feedback.ok ? "text-green-300" : "text-red-300"} aria-live="polite">
          {feedback.text}
        </p>
      )}
      <button type="button" className="text-sm underline text-sky-300" onClick={() => setShowAll((v) => !v)}>
        {showAll ? "Tabelle ausblenden" : "Alle Möglichkeiten durchprobieren (Brute Force)"}
      </button>
      {showAll && (
        <ScrollArea>
          <table className="text-sm text-center">
            <tbody>
              <tr>
                <th scope="row" className="pr-3 text-left">
                  x
                </th>
                {powerSteps(g, p - 1, p).map((_, i) => (
                  <td key={i} className="border border-white/30 px-2 py-1">
                    {i + 1}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="pr-3 text-left whitespace-nowrap">
                  {g}
                  <sup>x</sup> mod {p}
                </th>
                {powerSteps(g, p - 1, p).map((value, i) => (
                  <td
                    key={i}
                    className={`border border-white/30 px-2 py-1 ${value === target ? "bg-green-600 text-white font-bold" : ""}`}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-white/60 mt-2">
            Die Werte springen scheinbar zufällig hin und her – es gibt kein Muster, das beim Zurückrechnen hilft.
          </p>
        </ScrollArea>
      )}
    </div>
  );
}
