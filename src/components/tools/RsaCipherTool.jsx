import { useState } from "react";
import { lettersOnly, lettersToNumbers, parseNumberList, rsaDecryptLetters, rsaEncryptLetters } from "../../lib/crypto";

/**
 * Ver- und Entschlüsseln mit RSA, Buchstabe für Buchstabe (A = 1 … Z = 26).
 * So bleibt der Rechenweg nachvollziehbar; echtes RSA verschlüsselt größere Blöcke.
 */
export default function RsaCipherTool({ initialModulus = 391, initialExponent = 3, initialCipher = "" }) {
  const [modulus, setModulus] = useState(String(initialModulus));
  const [exponent, setExponent] = useState(String(initialExponent));
  const [plaintext, setPlaintext] = useState("");
  const [cipher, setCipher] = useState(initialCipher);

  const n = parseInt(modulus, 10);
  const k = parseInt(exponent, 10);
  const valid = !Number.isNaN(n) && !Number.isNaN(k) && n > 26 && n <= 100000 && k >= 1;

  const encrypt = () => setCipher(rsaEncryptLetters(plaintext, k, n).join(" "));
  const decrypt = () => setPlaintext(rsaDecryptLetters(parseNumberList(cipher), k, n));

  const steps = valid ? lettersToNumbers(plaintext).slice(0, 12) : [];

  return (
    <div className="panel space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 max-w-md">
        <label className="block">
          <span className="block text-sm font-semibold text-white mb-1">Modul n</span>
          <input
            type="number"
            value={modulus}
            onChange={(e) => setModulus(e.target.value)}
            className="input-style w-full"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-semibold text-white mb-1">
            Exponent (e zum Ver-, d zum Entschlüsseln)
          </span>
          <input
            type="number"
            value={exponent}
            onChange={(e) => setExponent(e.target.value)}
            className="input-style w-full"
          />
        </label>
      </div>

      {!valid && <p className="text-red-300">Bitte gültige Zahlen eingeben (n zwischen 27 und 100000).</p>}

      <div>
        <label htmlFor="rsa-plain" className="block text-sm font-semibold text-white mb-1">
          Klartext
        </label>
        <input
          id="rsa-plain"
          type="text"
          value={plaintext}
          onChange={(e) => setPlaintext(e.target.value)}
          className="input-style w-full uppercase"
        />
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <button type="button" className="btn" onClick={encrypt} disabled={!valid || lettersOnly(plaintext) === ""}>
          ↓ verschlüsseln
        </button>
        <button
          type="button"
          className="btn"
          onClick={decrypt}
          disabled={!valid || parseNumberList(cipher).length === 0}
        >
          ↑ entschlüsseln
        </button>
      </div>

      <div>
        <label htmlFor="rsa-cipher" className="block text-sm font-semibold text-white mb-1">
          Geheimtext (Zahlen, durch Leerzeichen getrennt)
        </label>
        <textarea
          id="rsa-cipher"
          rows={3}
          value={cipher}
          onChange={(e) => setCipher(e.target.value)}
          className="input-style w-full font-mono break-all"
        />
      </div>

      {steps.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-sky-300">Rechenweg für die ersten Buchstaben</summary>
          <ul className="mt-2 space-y-1 font-mono">
            {steps.map((m, i) => (
              <li key={i}>
                {lettersOnly(plaintext)[i]} = {m} → {m}
                <sup>{k}</sup> mod {n} = {rsaEncryptLetters(lettersOnly(plaintext)[i], k, n)[0]}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
