import { useState } from "react";
import { gcd, isPrime, modInverse } from "../../lib/crypto";

const PRIMES = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

/** Schlüsselerzeugung Schritt für Schritt: p, q → n, φ(n), e, d. */
export default function RsaKeyTool({ initialP = 17, initialQ = 23, initialE = 3, onKeys }) {
  const [p, setP] = useState(initialP);
  const [q, setQ] = useState(initialQ);
  const [e, setE] = useState(initialE);

  const n = p * q;
  const phi = (p - 1) * (q - 1);
  const validPrimes = isPrime(p) && isPrime(q) && p !== q;
  const coprime = validPrimes && gcd(e, phi) === 1 && e > 1 && e < phi;
  const d = coprime ? modInverse(e, phi) : null;

  const possibleE = validPrimes
    ? [3, 5, 7, 11, 13, 17, 19, 23, 29, 31].filter((c) => c < phi && gcd(c, phi) === 1)
    : [];

  const Step = ({ number, title, children }) => (
    <li className="pl-1">
      <span className="font-semibold text-white">
        {number}. {title}
      </span>
      <div className="mt-1">{children}</div>
    </li>
  );

  return (
    <div className="panel space-y-4">
      <div className="grid gap-4 sm:grid-cols-3 max-w-xl">
        <label className="block">
          <span className="block text-sm font-semibold text-white mb-1">Primzahl p</span>
          <select value={p} onChange={(ev) => setP(Number(ev.target.value))} className="input-style w-full">
            {PRIMES.map((prime) => (
              <option key={prime} value={prime}>
                {prime}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm font-semibold text-white mb-1">Primzahl q</span>
          <select value={q} onChange={(ev) => setQ(Number(ev.target.value))} className="input-style w-full">
            {PRIMES.map((prime) => (
              <option key={prime} value={prime}>
                {prime}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm font-semibold text-white mb-1">Exponent e</span>
          <select value={e} onChange={(ev) => setE(Number(ev.target.value))} className="input-style w-full">
            {possibleE.map((candidate) => (
              <option key={candidate} value={candidate}>
                {candidate}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!validPrimes ? (
        <p className="text-red-300">p und q müssen zwei verschiedene Primzahlen sein.</p>
      ) : (
        <ol className="space-y-3">
          <Step number={1} title="Modul berechnen">
            <span className="font-mono">
              n = p · q = {p} · {q} = <b className="text-white">{n}</b>
            </span>
          </Step>
          <Step number={2} title="Anzahl der teilerfremden Zahlen">
            <span className="font-mono">
              φ(n) = (p − 1) · (q − 1) = {p - 1} · {q - 1} = <b className="text-white">{phi}</b>
            </span>
          </Step>
          <Step number={3} title="Öffentlichen Exponenten wählen">
            <span className="font-mono">
              e = {e}, teilerfremd zu φ(n): ggT({e}, {phi}) = {gcd(e, phi)}
            </span>
          </Step>
          <Step number={4} title="Geheimen Exponenten bestimmen">
            <span className="font-mono">
              d mit (e · d) mod φ(n) = 1 → d = <b className="text-white">{d}</b> (denn {e} · {d} = {e * (d ?? 0)} ={" "}
              {Math.floor((e * (d ?? 0)) / phi)} · {phi} + 1)
            </span>
          </Step>
        </ol>
      )}

      {d !== null && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded border border-green-400/60 bg-green-900/20 p-3">
            <p className="font-semibold text-green-300">Öffentlicher Schlüssel (darf jeder kennen)</p>
            <p className="font-mono text-white">
              (e, n) = ({e}, {n})
            </p>
          </div>
          <div className="rounded border border-red-400/60 bg-red-900/20 p-3">
            <p className="font-semibold text-red-300">Privater Schlüssel (bleibt geheim)</p>
            <p className="font-mono text-white">
              (d, n) = ({d}, {n})
            </p>
          </div>
        </div>
      )}

      {onKeys && d !== null && (
        <button type="button" className="btn btn-sm" onClick={() => onKeys({ n, e, d })}>
          Diese Schlüssel unten übernehmen
        </button>
      )}
    </div>
  );
}
