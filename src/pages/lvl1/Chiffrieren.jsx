import React, { useState } from 'react';
import ChiffreDisk from '../components/tools/ChiffreDisk';
import WeiterButton from "../components/WeiterButton";

export default function VerschluesselnMitScheibe() {
  const [showResult, setShowResult] = useState(false);

  return (
    <div className="text-style">
      <h1 className="text-2xl font-bold mb-4 heading-style">Deine erste Verschlüsselung</h1>
      <p className="mb-4">
        Super, du konntest die Nachricht entschlüsseln:
        <br /><strong className="text-white font-bold">"ZIEHT EUCH ZURUECK!"</strong>
        <br /><br />
        Offensichtlich kam die Nachricht zu spät. Du entschließt, Caesar darüber zu benachrichtigen.
        Deine Nachricht <strong className="text-white font-bold">"SCHLACHT VERLOREN"</strong> solltest du am besten verschlüsseln, bevor du sie versendest.
        <br />Verschiebe dazu alle Buchstaben im Alphabet um <strong>3 Stellen</strong>.
        <br /><br /><em>Hinweis: Notiere dir die verschlüsselte Nachricht für die Zwischenprüfung.</em>
      </p>

      <ChiffreDisk presetShift={0} presetText="SCHLACHT VERLOREN" showDecryption={false} />
      <WeiterButton to="/level1/fachkonzepte" />
    </div>
  );
}
