import React from "react";
import { useNavigate } from "react-router-dom";

export default function ZugriffsError() {
  const navigate = useNavigate();

  return (
    <div className="text-style">
      <h1 className="text-3xl font-bold text-red-500 mb-4 heading-style">🚨 Zeitreise-Fehler</h1>
      <p className="mb-6">
        Offenbar gibt es ein Problem mit deiner Zeitmaschine. <br />
        Löse erst die Zwischenprüfung des vorangehenden Levels, um diese Seite zu öffnen.
      </p>
    </div>
  );
}
