import { useMemo, useState } from "react";
import { modPow, primitiveRoots } from "../../lib/crypto";
import ScrollArea from "../ScrollArea";

const PRIMES = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

const randomSecret = (p) => 2 + Math.floor(Math.random() * (p - 3));

function Power({ base, exp, p, result }) {
  return (
    <span className="font-mono whitespace-nowrap">
      {base}
      <sup>{exp}</sup> mod {p} = <b className="text-white">{result}</b>
    </span>
  );
}

/** Interaktiver Diffie-Hellman-Schlüsselaustausch mit kleinen Zahlen. */
export default function DiffieHellmanTool() {
  const [p, setP] = useState(23);
  const roots = useMemo(() => primitiveRoots(p), [p]);
  const [g, setG] = useState(5);
  const [a, setA] = useState(6);
  const [b, setB] = useState(15);

  const clamp = (value) => Math.max(2, Math.min(p - 2, value || 2));
  const secretA = clamp(a);
  const secretB = clamp(b);
  const generator = roots.includes(g) ? g : roots[0];

  const A = modPow(generator, secretA, p);
  const B = modPow(generator, secretB, p);
  const keyAlice = modPow(B, secretA, p);
  const keyBob = modPow(A, secretB, p);

  const changePrime = (value) => {
    setP(value);
    const newRoots = primitiveRoots(value);
    if (!newRoots.includes(g)) setG(newRoots[0]);
    setA((current) => Math.min(current, value - 2));
    setB((current) => Math.min(current, value - 2));
  };

  return (
    <div className="panel space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="block text-sm font-semibold text-white mb-1">Primzahl p (öffentlich)</span>
          <select value={p} onChange={(e) => changePrime(Number(e.target.value))} className="input-style w-full">
            {PRIMES.map((prime) => (
              <option key={prime} value={prime}>
                {prime}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm font-semibold text-white mb-1">Basis g (öffentlich)</span>
          <select value={generator} onChange={(e) => setG(Number(e.target.value))} className="input-style w-full">
            {roots.map((root) => (
              <option key={root} value={root}>
                {root}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm font-semibold text-white mb-1">Alices Geheimzahl a</span>
          <div className="flex gap-2">
            <input
              type="number"
              min={2}
              max={p - 2}
              value={a}
              onChange={(e) => setA(Number(e.target.value))}
              className="input-style w-full"
            />
            <button type="button" className="btn btn-sm" onClick={() => setA(randomSecret(p))} title="Zufällig wählen">
              🎲
            </button>
          </div>
        </label>
        <label className="block">
          <span className="block text-sm font-semibold text-white mb-1">Bobs Geheimzahl b</span>
          <div className="flex gap-2">
            <input
              type="number"
              min={2}
              max={p - 2}
              value={b}
              onChange={(e) => setB(Number(e.target.value))}
              className="input-style w-full"
            />
            <button type="button" className="btn btn-sm" onClick={() => setB(randomSecret(p))} title="Zufällig wählen">
              🎲
            </button>
          </div>
        </label>
      </div>
      <p className="text-xs text-white/60">
        Geheimzahlen zwischen 2 und {p - 2}. Als Basis sind nur Primitivwurzeln von {p} wählbar – ihre Potenzen
        durchlaufen alle Zahlen von 1 bis {p - 1}.
      </p>

      <ScrollArea>
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="text-white">
              <th className="p-2">Schritt</th>
              <th className="p-2">Alice (geheim)</th>
              <th className="p-2 bg-red-900/30">Öffentlich – Eve liest mit</th>
              <th className="p-2">Bob (geheim)</th>
            </tr>
          </thead>
          <tbody className="align-top">
            <tr className="border-t border-white/10">
              <td className="p-2">1. Vereinbaren</td>
              <td className="p-2" />
              <td className="p-2 bg-red-900/20 font-mono">
                p = {p}, g = {generator}
              </td>
              <td className="p-2" />
            </tr>
            <tr className="border-t border-white/10">
              <td className="p-2">2. Geheimzahl wählen</td>
              <td className="p-2 font-mono">a = {secretA}</td>
              <td className="p-2 bg-red-900/20" />
              <td className="p-2 font-mono">b = {secretB}</td>
            </tr>
            <tr className="border-t border-white/10">
              <td className="p-2">3. Berechnen</td>
              <td className="p-2">
                A = <Power base={generator} exp={secretA} p={p} result={A} />
              </td>
              <td className="p-2 bg-red-900/20" />
              <td className="p-2">
                B = <Power base={generator} exp={secretB} p={p} result={B} />
              </td>
            </tr>
            <tr className="border-t border-white/10">
              <td className="p-2">4. Austauschen</td>
              <td className="p-2">sendet A →</td>
              <td className="p-2 bg-red-900/20 font-mono">
                A = {A}, B = {B}
              </td>
              <td className="p-2">← sendet B</td>
            </tr>
            <tr className="border-t border-white/10">
              <td className="p-2">5. Schlüssel berechnen</td>
              <td className="p-2">
                K = <Power base={B} exp={secretA} p={p} result={keyAlice} />
              </td>
              <td className="p-2 bg-red-900/20 text-white/60">K wird nie gesendet</td>
              <td className="p-2">
                K = <Power base={A} exp={secretB} p={p} result={keyBob} />
              </td>
            </tr>
          </tbody>
        </table>
      </ScrollArea>

      <p className="text-green-300 font-semibold" aria-live="polite">
        {keyAlice === keyBob
          ? `✓ Beide erhalten denselben geheimen Schlüssel K = ${keyAlice}.`
          : "Die Schlüssel stimmen nicht überein."}
      </p>
    </div>
  );
}
