import { useState } from "react";
import { mixColors } from "../../lib/colors";

const COMMON_COLORS = [
  { name: "Gelb", hex: "#ffd700" },
  { name: "Weiß", hex: "#f5f5f5" },
  { name: "Hellgrün", hex: "#a3e635" },
];

const SECRET_COLORS = [
  { name: "Rot", hex: "#d62828" },
  { name: "Blau", hex: "#1d4ed8" },
  { name: "Violett", hex: "#7e22ce" },
  { name: "Türkis", hex: "#0d9488" },
  { name: "Orange", hex: "#ea580c" },
  { name: "Pink", hex: "#db2777" },
  { name: "Braun", hex: "#78350f" },
  { name: "Schwarz", hex: "#111827" },
];

function Swatch({ color, label, note }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="h-10 w-10 shrink-0 rounded-full border-2 border-white/60 shadow"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="text-sm leading-tight">
        <span className="block text-white">{label}</span>
        {note && <span className="block text-white/60 text-xs">{note}</span>}
      </span>
    </div>
  );
}

function ColorPicker({ label, colors, value, onChange, name }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-white mb-1">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <label key={color.hex} className="cursor-pointer" title={color.name}>
            <input
              type="radio"
              name={name}
              className="sr-only peer"
              checked={value === color.hex}
              onChange={() => onChange(color.hex)}
            />
            <span
              className="block h-8 w-8 rounded-full border-2 border-transparent peer-checked:border-white peer-checked:ring-2 peer-checked:ring-sky-300 peer-focus-visible:ring-2 peer-focus-visible:ring-sky-300"
              style={{ backgroundColor: color.hex }}
            />
            <span className="sr-only">{color.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Farbmisch-Analogie: Gemeinsame Farbe öffentlich, geheime Farben privat, Mischen ist Einwegfunktion. */
export default function ColorMixingTool() {
  const [common, setCommon] = useState(COMMON_COLORS[0].hex);
  const [alice, setAlice] = useState(SECRET_COLORS[0].hex);
  const [bob, setBob] = useState(SECRET_COLORS[1].hex);
  const [showEve, setShowEve] = useState(false);

  const aliceMix = mixColors(common, alice);
  const bobMix = mixColors(common, bob);
  // Jede Seite gibt die eigene geheime Farbe zur Mischung der anderen Seite
  const aliceResult = mixColors(common, bob, alice);
  const bobResult = mixColors(common, alice, bob);
  const eveGuess = mixColors(common, aliceMix, bobMix);

  return (
    <div className="panel space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <ColorPicker
          label="Alices geheime Farbe"
          colors={SECRET_COLORS}
          value={alice}
          onChange={setAlice}
          name="alice"
        />
        <ColorPicker
          label="Gemeinsame Farbe (öffentlich)"
          colors={COMMON_COLORS}
          value={common}
          onChange={setCommon}
          name="common"
        />
        <ColorPicker label="Bobs geheime Farbe" colors={SECRET_COLORS} value={bob} onChange={setBob} name="bob" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left">
          <thead>
            <tr className="text-white">
              <th className="p-2 w-1/3">Alice (geheim)</th>
              <th className="p-2 w-1/3 bg-red-900/30">Öffentlich – Eve sieht alles</th>
              <th className="p-2 w-1/3">Bob (geheim)</th>
            </tr>
          </thead>
          <tbody className="align-top">
            <tr>
              <td className="p-2">
                <Swatch color={alice} label="1. Geheime Farbe" note="bleibt bei Alice" />
              </td>
              <td className="p-2 bg-red-900/20">
                <Swatch color={common} label="1. Gemeinsame Farbe" note="offen vereinbart" />
              </td>
              <td className="p-2">
                <Swatch color={bob} label="1. Geheime Farbe" note="bleibt bei Bob" />
              </td>
            </tr>
            <tr>
              <td className="p-2">
                <Swatch color={aliceMix} label="2. Gemeinsam + Alices Farbe" note="wird an Bob geschickt →" />
              </td>
              <td className="p-2 bg-red-900/20 space-y-2">
                <Swatch color={aliceMix} label="2. Mischung von Alice" />
                <Swatch color={bobMix} label="2. Mischung von Bob" />
              </td>
              <td className="p-2">
                <Swatch color={bobMix} label="2. Gemeinsam + Bobs Farbe" note="← wird an Alice geschickt" />
              </td>
            </tr>
            <tr>
              <td className="p-2">
                <Swatch color={aliceResult} label="3. Bobs Mischung + Alices Farbe" note="gemeinsames Geheimnis" />
              </td>
              <td className="p-2 bg-red-900/20 text-sm text-white/70">3. Das Ergebnis wird nie verschickt.</td>
              <td className="p-2">
                <Swatch color={bobResult} label="3. Alices Mischung + Bobs Farbe" note="gemeinsames Geheimnis" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-green-300 font-semibold" aria-live="polite">
        {aliceResult === bobResult
          ? "✓ Alice und Bob haben genau dieselbe Farbe – ohne dass sie jemals verschickt wurde."
          : "Die Farben unterscheiden sich."}
      </p>

      <div>
        <button type="button" className="btn btn-sm" onClick={() => setShowEve((v) => !v)}>
          {showEve ? "Eves Versuch ausblenden" : "Was kann Eve tun?"}
        </button>
        {showEve && (
          <div className="mt-3 flex flex-wrap items-center gap-6">
            <Swatch
              color={eveGuess}
              label="Eve mischt alles, was sie gesehen hat"
              note="gemeinsame Farbe + beide Mischungen"
            />
            <Swatch color={aliceResult} label="Das Geheimnis von Alice und Bob" />
            <p className="text-sm max-w-md">
              Eves Mischung enthält die gemeinsame Farbe dreimal statt einmal – sie trifft das Geheimnis nicht. Um es zu
              erhalten, müsste sie eine Mischung wieder in ihre Bestandteile zerlegen. Genau das ist praktisch
              unmöglich.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
