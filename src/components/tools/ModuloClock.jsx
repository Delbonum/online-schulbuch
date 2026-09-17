import { useState } from "react";
import { mod } from "../../lib/crypto";

/** Rechnen mit Rest als Uhr: n mod m zeigt auf eine von m Positionen. */
export default function ModuloClock() {
  const [number, setNumber] = useState(17);
  const [modulus, setModulus] = useState(12);

  const m = Math.max(2, Math.min(30, modulus || 2));
  const n = Math.max(0, Math.min(9999, number || 0));
  const rest = mod(n, m);
  const quotient = Math.floor(n / m);

  const radius = 110;
  const position = (i) => {
    const angle = (i / m) * 2 * Math.PI - Math.PI / 2;
    return [150 + radius * Math.cos(angle), 150 + radius * Math.sin(angle)];
  };
  const [hx, hy] = position(rest);

  return (
    <div className="panel flex flex-col md:flex-row gap-6 items-center">
      <svg viewBox="0 0 300 300" className="w-full max-w-[280px]" role="img" aria-label={`${n} mod ${m} = ${rest}`}>
        <circle cx="150" cy="150" r={radius + 25} fill="rgba(255,255,255,0.05)" stroke="white" strokeWidth="2" />
        <line
          x1="150"
          y1="150"
          x2={150 + (hx - 150) * 0.75}
          y2={150 + (hy - 150) * 0.75}
          stroke="deepskyblue"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="150" cy="150" r="5" fill="deepskyblue" />
        {Array.from({ length: m }, (_, i) => {
          const [x, y] = position(i);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="14" fill={i === rest ? "deepskyblue" : "transparent"} />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={i === rest ? "black" : "white"}
                fontSize="13"
              >
                {i}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="space-y-4 w-full max-w-sm">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm font-semibold text-white mb-1">Zahl n</span>
            <input
              type="number"
              min={0}
              max={9999}
              value={number}
              onChange={(e) => setNumber(Number(e.target.value))}
              className="input-style w-full"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-semibold text-white mb-1">Modul m (2–30)</span>
            <input
              type="number"
              min={2}
              max={30}
              value={modulus}
              onChange={(e) => setModulus(Number(e.target.value))}
              className="input-style w-full"
            />
          </label>
        </div>
        <p className="text-lg text-white">
          {n} = {quotient} · {m} + <span className="text-sky-300 font-bold">{rest}</span>
        </p>
        <p className="text-lg">
          also:{" "}
          <span className="text-white font-bold">
            {n} mod {m} = {rest}
          </span>
        </p>
        <p className="text-sm text-white/70">
          Der Zeiger läuft {n}-mal eine Position weiter und beginnt nach {m} Schritten wieder bei 0 – so wie eine Uhr
          nach 12 Stunden.
        </p>
      </div>
    </div>
  );
}
