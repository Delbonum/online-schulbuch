import React, { useState } from 'react';
import ChiffreDisk from '../components/tools/ChiffreDisk';
import WeiterButton from "../components/WeiterButton";

export default function Dechiffrieren() {
  const [hintShown, setHintShown] = useState(false);

  return (
    <div className="text-style">
      <h1 className="text-2xl font-bold mb-4 heading-style">Die Chiffrierscheibe</h1>
      <p className="mb-4">
        Du hast eine Nachricht abgefangen, die Julius Caesar an einen seiner Offiziere senden wollte. Allerdings ist die Nachricht völlig unverständlich:
        <br /><strong className="text-white"><b>"CLHKW HXFK CXUXHFN!"</b></strong>
        <br /><br />
        Von einer früheren Zeitreise ins Italien des 15. Jahrhunderts hast du noch Chiffrierscheibe von Leon Battista Alberti in deiner Tasche.
        Vielleicht kann sie dir helfen, die Nachricht zu entschlüsseln.
        Diese Scheibe setzt sich aus einem äußeren und einem inneren Ring zusammen, die sich separat drehen lassen.
        Versuche mithilfe der Scheibe herauszufinden, welche Bedeutung hinter der verschlüsselten Nachricht stecken könnte!
      </p>

      <ChiffreDisk
        presetText="CLHKW HXFK CXUXHFN"
        showHint={true}
        showDecryption={hintShown}
        onHintToggle={(visible) => setHintShown(visible)}
      />
      <WeiterButton to="/level1/chiffrieren" />
    </div>
  );
}
