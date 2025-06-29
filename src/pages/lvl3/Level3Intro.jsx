import React, { useState } from "react";
import ProgressiveCaesarTool from '../components/tools/ProgressiveCaesarTool';
import useLevelGuard from "../components/LevelGuard";
import WeiterButton from "../components/WeiterButton";

export default function Level3Intro() {
  useLevelGuard("level2Passed");

  return (
    <div>
      <h1 className="text-2xl font-bold heading-style mb-4">Grübeleien über gesammelte Erkenntnisse</h1>

      <div className="space-y-4 text-style">
        <p>
          Nachdem du bereits Verschiebe- und Ersetzungsverfahren gemeistert hast, grübelst du selbst über ein neues Konzept:
        </p>

        <p className="italic">
          „Was wäre, wenn man ähnlich wie bei dem Verschiebeverfahren vorgeht, aber die Verschiebezahl bei jedem Buchstaben nach einem bestimmten, festen Muster verändert? Zum Beispiel bei jedem neuen Buchstaben +1 oder -2 oder *3-1? Das müsste doch sicherer sein! Dann hätte man ein <strong>polyalphabetisches Verfahren</strong>, das statt nur einem festen Geheimtextalphabet für verschiedene Buchstaben unterschiedliche Alphabete verwendet.“
        </p>

        <p>
          Dein Verfahren könnte man als <strong>progressive Caesar-Chiffre</strong> bezeichnen. Du experimentierst ein bisschen mit deiner Idee herum und tatsächlich: Es gelingt dir, Texte zu verschlüsseln und zu entschlüsseln, indem du die Verschiebezahl bei jedem Buchstaben nach einem festen Muster veränderst.
        </p>

        <ProgressiveCaesarTool />

        <p>
          Um zu überprüfen, ob deine Idee irgendwann auch tatsächlich verwendet wird, steigst du wieder in deine Zeitmaschine und reist noch ein Stückchen weiter in die Zukunft...
        </p>

      </div>

      <div className="mt-6">
        <WeiterButton to="/level3/historie" />
      </div>
    </div>
  );
}
