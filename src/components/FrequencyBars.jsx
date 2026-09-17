import { sortedCounts } from "../lib/crypto";

/**
 * Balkendiagramm der Buchstabenhäufigkeiten.
 * `counts`: { Buchstabe: Wert } – wird absteigend sortiert dargestellt.
 */
export default function FrequencyBars({ counts, unit = "", label = "Buchstabenhäufigkeit" }) {
  const entries = sortedCounts(counts);
  const max = Math.max(1, ...entries.map(([, value]) => value));

  if (entries.length === 0) {
    return <p className="text-sm text-white/60">Keine Buchstaben vorhanden.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1.5 mt-2 text-xs items-end min-w-max" role="img" aria-label={label}>
        {entries.map(([char, value]) => (
          <div key={char} className="text-center" title={`${char}: ${value}${unit}`}>
            <div className="bg-sky-300/60 mx-auto w-3" style={{ height: `${Math.max(2, (value / max) * 100)}px` }} />
            <div>{char}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
