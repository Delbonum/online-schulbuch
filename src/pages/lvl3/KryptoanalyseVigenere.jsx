import React from "react";
import ClusterTable from "./components/ClusterTable";
import useLevelGuard from "../components/LevelGuard";
import WeiterButton from "../components/WeiterButton";

export default function KryptoanalyseVigenere() {
  useLevelGuard("level2Passed");

  return (
    <div>
      <h1 className="text-2xl font-bold heading-style mb-4">Wie sicher ist die neue Chiffre?</h1>

      <div className="text-style mb-8">
        <p>
          Das Vigenère-Verfahren scheint dir ziemlich sicher zu sein – wesentlich sicherer als die monoalphabetischen Verfahren jedenfalls,
          die du zuvor kennengelernt hast. Aber ist es absolut sicher oder kann es unter Umständen immer noch geknackt werden?
        </p>

        <p className="mt-4">
          <em>'Was wäre, wenn ...'</em>, fragst du dich, <em>'... ich die Länge des Schlüsselwortes kennen würde? Könnte ich dann nicht wieder eine Häufigkeitsanalyse durchführen,
          indem ich Cluster bilde für alle Geheimtextbuchstaben, die mit dem gleichen Schlüsselbuchstaben chiffriert wurden?'</em>
        </p>

        <p className="mt-4">
          Tatsächlich: Angenommen dein Schlüssel hat vier Buchstaben – z.B. <strong>'ZEIT'</strong> – dann wird jeder fünfte Buchstabe mit dem gleichen Schlüsselbuchstaben verschlüsselt:
          Der erste, fünfte, neunte usw. mit dem Schlüsselbuchstaben <strong>'Z'</strong>; der zweite, sechste, zehnte usw. mit dem <strong>'E'</strong> und so weiter...
          Du musst also nur für jeden Schlüsselbuchstaben eine separate Häufigkeitsanalyse durchführen!
        </p>
      </div>

      <div className="bg-white/10 p-4 rounded text-sm mb-4 flex justify-center">
      <ClusterTable />
      </div>

      <WeiterButton to="/level3/kasiski" />
    </div>
  );
}
