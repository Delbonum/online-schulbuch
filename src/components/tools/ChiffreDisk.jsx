import { useRef, useState } from "react";
import { ALPHABET, caesar, mod } from "../../lib/crypto";

const STEP = 360 / 26;

/**
 * Chiffrierscheibe nach Alberti: äußerer Ring = Klartext (weiß), innerer Ring = Geheimtext (blau).
 *
 * @param {string} presetText Geheimtext, dessen Entschlüsselung angezeigt werden kann
 * @param {"always"|"afterHint"|"never"} revealDecryption wann die Entschlüsselung sichtbar ist
 * @param {boolean} showHint Tipp-Button anzeigen
 */
export default function ChiffreDisk({
  presetText = "",
  presetShift = 0,
  showHint = false,
  revealDecryption = "always",
}) {
  const [shift, setShift] = useState(presetShift);
  const [hintVisible, setHintVisible] = useState(false);
  const svgRef = useRef(null);
  const dragging = useRef(false);

  const updateFromPointer = (event) => {
    if (!dragging.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = rect.top + rect.height / 2 - event.clientY;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    setShift(mod(Math.round(angle / STEP), 26));
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      setShift((s) => mod(s + 1, 26));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      setShift((s) => mod(s - 1, 26));
    }
  };

  const decryptionVisible =
    presetText && (revealDecryption === "always" || (revealDecryption === "afterHint" && hintVisible));

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="w-full max-w-[500px] aspect-square">
        <svg
          ref={svgRef}
          viewBox="0 0 500 500"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full touch-none select-none cursor-grab focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 rounded-full"
          role="slider"
          tabIndex={0}
          aria-label="Chiffrierscheibe – innere Scheibe drehen"
          aria-valuemin={0}
          aria-valuemax={25}
          aria-valuenow={shift}
          aria-valuetext={`A entspricht ${ALPHABET[shift]}`}
          onKeyDown={handleKeyDown}
          onPointerDown={(event) => {
            dragging.current = true;
            event.currentTarget.setPointerCapture?.(event.pointerId);
          }}
          onPointerMove={updateFromPointer}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
        >
          <g transform="translate(250,250) scale(1,-1)">
            <circle cx="0" cy="0" r="220" fill="transparent" stroke="white" strokeWidth="2" />
            <circle cx="0" cy="0" r="180" fill="transparent" stroke="gray" strokeWidth="1" />
            {[...ALPHABET].map((char, i) => (
              <text
                key={char}
                textAnchor="middle"
                transform={`rotate(${-i * STEP}, 0, 0) translate(0, 195) scale(1,-1)`}
                style={{ fill: "white" }}
              >
                {char}
              </text>
            ))}
            {[...ALPHABET].map((char, i) => (
              <text
                key={`${char}-inner`}
                textAnchor="middle"
                transform={`rotate(${shift * STEP - i * STEP}, 0, 0) translate(0, 150) scale(1,-1)`}
                style={{ fill: "deepskyblue" }}
              >
                {char}
              </text>
            ))}
          </g>
        </svg>
      </div>

      <div className="mt-4 w-full max-w-sm">
        <div className="mb-4 space-y-1 text-white">
          <div>
            <span className="font-bold">Stellung:</span> A ↔ {ALPHABET[shift]}
          </div>
          <div>
            <span className="font-bold">Verschiebezahl:</span> {shift}
          </div>
          <div>
            <span className="font-bold">Schlüssel:</span> {ALPHABET[shift]}
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="25"
          value={shift}
          onChange={(e) => setShift(Number(e.target.value))}
          className="w-full"
          aria-label="Verschiebezahl"
        />

        {showHint && (
          <button type="button" onClick={() => setHintVisible((v) => !v)} className="btn mt-4">
            {hintVisible ? "Tipp ausblenden" : "Tipp einblenden"}
          </button>
        )}

        {showHint && hintVisible && (
          <div className="mt-2 p-4 bg-white/10 text-white border border-white rounded-lg">
            <p>
              <b>TIPP:</b> Stelle die Scheibe so ein, dass unter dem weißen "A" das blaue "D" zu sehen ist.
              <br />
              Dann ordne jedem Buchstaben aus dem verschlüsselten Geheimtext (blau) einen Klartextbuchstaben (weiß) zu.
            </p>
          </div>
        )}

        {decryptionVisible && (
          <div className="mt-4">
            <p className="block text-white font-bold">Entschlüsselung:</p>
            <p className="mt-2 bg-white text-black rounded p-2" aria-live="polite">
              {caesar(presetText.toUpperCase(), -shift)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
