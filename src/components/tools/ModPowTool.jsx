import { useState } from "react";
import { powerSteps } from "../../lib/crypto";

const MAX_EXPONENT = 100;
const MAX_MODULUS = 100000;

/** Berechnet g^x mod p Schritt für Schritt: nach jeder Multiplikation wird der Rest gebildet. */
export default function ModPowTool({ initialBase = 3, initialExponent = 4, initialModulus = 17 }) {
  const [base, setBase] = useState(String(initialBase));
  const [exponent, setExponent] = useState(String(initialExponent));
  const [modulus, setModulus] = useState(String(initialModulus));

  const g = parseInt(base, 10);
  const x = parseInt(exponent, 10);
  const p = parseInt(modulus, 10);

  let error = null;
  if ([g, x, p].some(Number.isNaN)) error = "Bitte gib ganze Zahlen ein.";
  else if (g < 0) error = "Die Basis darf nicht negativ sein.";
  else if (x < 1 || x > MAX_EXPONENT) error = `Der Exponent muss zwischen 1 und ${MAX_EXPONENT} liegen.`;
  else if (p < 2 || p > MAX_MODULUS) error = `Der Modul muss zwischen 2 und ${MAX_MODULUS} liegen.`;

  const steps = error ? [] : powerSteps(g, x, p);

  const field = (id, label, value, setValue) => (
    <label htmlFor={id} className="block">
      <span className="block text-sm font-semibold text-white mb-1">{label}</span>
      <input
        id={id}
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="input-style w-full"
      />
    </label>
  );

  return (
    <div className="panel space-y-4">
      <div className="grid grid-cols-3 gap-3 max-w-md">
        {field("modpow-g", "Basis g", base, setBase)}
        {field("modpow-x", "Exponent x", exponent, setExponent)}
        {field("modpow-p", "Modul p", modulus, setModulus)}
      </div>

      {error ? (
        <p className="text-red-300">{error}</p>
      ) : (
        <>
          <p className="text-lg">
            <span className="text-white font-bold">
              {g}
              <sup>{x}</sup> mod {p} = {steps.at(-1)}
            </span>
          </p>
          <details className="text-sm">
            <summary className="cursor-pointer text-sky-300">Rechenweg anzeigen</summary>
            <p className="mt-2 mb-2 text-white/70">
              Statt die riesige Zahl {g}
              <sup>{x}</sup> auszurechnen, multipliziert man immer nur mit {g} und bildet sofort den Rest:
            </p>
            <ol className="flex flex-wrap gap-2">
              {steps.map((value, i) => (
                <li key={i} className="bg-white/10 rounded px-2 py-1 font-mono">
                  {g}
                  <sup>{i + 1}</sup> ≡ {value}
                </li>
              ))}
            </ol>
          </details>
        </>
      )}
    </div>
  );
}
