import WeiterButton from "../components/WeiterButton";
export default function Success() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 heading-style">🎉 Glückwunsch!</h1>
      <p className="text-lg text-style">
        Du hast die Prüfung erfolgreich bestanden und das dritte Kapitel deiner Zeitreise-Mission abgeschlossen.
        Weiter geht's mit der nächsten verschlüsselten Herausforderung!
      </p>
      <WeiterButton to="/level3/start" className="mt-6" />
    </div>
  );
}
