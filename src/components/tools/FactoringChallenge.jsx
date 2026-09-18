import { useState } from "react";
import { factorSemiprime, isPrime } from "../../lib/crypto";

/** Multiplizieren ist leicht, Zerlegen ist schwer – mit Zeitmessung für den Aha-Effekt. */
export default function FactoringChallenge({ number = 3127 }) {
  const [p, setP] = useState("");
  const [q, setQ] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [startedAt] = useState(() => Date.now());
  const [solution, setSolution] = useState(null);

  const check = (event) => {
    event.preventDefault();
    const a = parseInt(p, 10);
    const b = parseInt(q, 10);
    if (Number.isNaN(a) || Number.isNaN(b)) {
      setFeedback({ ok: false, text: "Bitte zwei ganze Zahlen eingeben." });
      return;
    }
    if (a * b !== number) {
      setFeedback({ ok: false, text: `${a} · ${b} = ${a * b} – gesucht ist ${number}.` });
      return;
    }
    if (!isPrime(a) || !isPrime(b)) {
      setFeedback({ ok: false, text: "Das Produkt stimmt, aber beide Faktoren müssen Primzahlen sein." });
      return;
    }
    const seconds = Math.round((Date.now() - startedAt) / 1000);
    setFeedback({
      ok: true,
      text: `Richtig! ${a} · ${b} = ${number}. Du hast dafür etwa ${seconds} Sekunden gebraucht.`,
    });
  };

  return (
    <div className="panel space-y-3">
      <p className="text-white">
        Zerlege <b>{number}</b> in zwei Primzahlen:
      </p>
      <form onSubmit={check} className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          value={p}
          onChange={(e) => setP(e.target.value)}
          className="input-style w-24"
          aria-label="Erster Faktor"
          placeholder="p"
        />
        <span aria-hidden="true">·</span>
        <input
          type="number"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input-style w-24"
          aria-label="Zweiter Faktor"
          placeholder="q"
        />
        <span aria-hidden="true">= {number}</span>
        <button type="submit" className="btn btn-sm">
          Prüfen
        </button>
      </form>
      {feedback && (
        <p className={feedback.ok ? "text-green-300" : "text-red-300"} aria-live="polite">
          {feedback.text}
        </p>
      )}
      <button
        type="button"
        className="text-sm underline text-sky-300"
        onClick={() => setSolution(factorSemiprime(number))}
      >
        Lösung anzeigen
      </button>
      {solution && (
        <p>
          {number} = <b className="text-white">{solution[0]}</b> · <b className="text-white">{solution[1]}</b>
        </p>
      )}
    </div>
  );
}
