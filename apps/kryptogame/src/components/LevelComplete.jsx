const ORDINALS = ["erste", "zweite", "dritte", "vierte", "fünfte", "sechste", "siebte", "achte", "neunte", "zehnte"];

export default function LevelComplete({ level, nextPath }) {
  const ordinal = ORDINALS[level - 1] ?? `${level}.`;

  return (
    <>
      <h1>🎉 Glückwunsch!</h1>
      {nextPath ? (
        <p className="text-lg">
          Du hast die Prüfung erfolgreich bestanden und das {ordinal} Kapitel deiner Zeitreise-Mission abgeschlossen.
          Weiter geht's mit der nächsten verschlüsselten Herausforderung!
        </p>
      ) : (
        <>
          <p className="text-lg">
            Du hast die letzte Prüfung bestanden und damit alle Kapitel deiner Zeitreise-Mission abgeschlossen – von
            Caesars Verschiebung bis zur Verschlüsselung mit öffentlichen Schlüsseln.
          </p>
          <p>
            Das Krypto-Zeitkommando dankt dir. Deine Zeitmaschine bleibt einsatzbereit: Die Werkzeuge auf den
            Fachkonzept-Seiten kannst du jederzeit weiter nutzen.
          </p>
        </>
      )}
    </>
  );
}
