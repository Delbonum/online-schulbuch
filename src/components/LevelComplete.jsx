const ORDINALS = ["erste", "zweite", "dritte", "vierte", "fünfte", "sechste", "siebte", "achte", "neunte", "zehnte"];

export default function LevelComplete({ level }) {
  const ordinal = ORDINALS[level - 1] ?? `${level}.`;
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 heading-style">🎉 Glückwunsch!</h1>
      <p className="text-lg text-style">
        Du hast die Prüfung erfolgreich bestanden und das {ordinal} Kapitel deiner Zeitreise-Mission abgeschlossen.
        Weiter geht's mit der nächsten verschlüsselten Herausforderung!
      </p>
    </div>
  );
}
