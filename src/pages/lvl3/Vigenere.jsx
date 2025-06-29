import React, { useState } from "react";
import vigenere from "../../img/vigenere2.png";
import VigenereChiffreTool from '../components/tools/VigenereChiffreTool';
import TabulaRectaTool from '../components/tools/TabulaRectaTool';
import ChiffreDisk from '../components/tools/ChiffreDisk';
import WeiterButton from "../components/WeiterButton";
import useLevelGuard from "../components/LevelGuard";

export default function Vigenere() {
  useLevelGuard("level2Passed");

    const [activeTool, setActiveTool] = useState("tabula");
  return (
    <div>
      <h1 className="text-2xl font-bold heading-style mb-4">Ein genauer Blick auf das Vigenère-Verfahren</h1>

      <div className="flex flex-col md:flex-row items-start gap-4 text-style">
        <img src={vigenere} alt="Blaise de Vigenère" className="w-80 h-auto self-start" />
        <p>
          Um sicherzugehen, dass du das Vigenère-Verfahren richtig verstanden hast, reist du einmal mehr zu Blaise de Vigenère persönlich
          und bittest ihn um eine Erläuterung: <em>"Monsieur Vigenère, können Sie mir noch einmal die Chiffre erklären, die Sie verwenden?"</em><br /><br />
          Um ihn nicht zu enttäuschen – und auch um kein Zeitreise-Chaos heraufzubeschwören, indem du Informationen aus der Zukunft in die Vergangenheit transportierst –
          verschweigst du dein Wissen darüber, dass seine Idee mit den verwürfelten Alphabeten sich nicht durchsetzen wird.<br /><br />
          <em>"Gehen wir der Einfachheit halber davon aus, dass wir nur geordnete Alphabete verwenden wie in der Tabula Recta"</em>, sagst du –
          und sparst so das entsprechende Detail aus.<br /><br />
          <em>"Langweilig",</em> kommentiert Vigenère, <em>"aber meinetwegen... Wähle zunächst ein Schlüsselwort und einen Klartext, den du verschlüsseln möchtest.
          Dann schreiben wir beides übereinander und wiederholen das Schlüsselwort so oft, bis über jedem Klartextbuchstaben ein Schlüsselbuchstabe steht."</em>
        </p>
      </div>

      <div className="my-6">
        <VigenereChiffreTool />
      </div>

      <div className="text-style mb-6">
        <em>Hinweis: Es kann sich lohnen, mit dem Tool oben verschiedene Extremwerte zu test (z. B. ein Schlüsselwort mit nur einem Buchstaben oder ein Klartext, der kürzer ist als der Schlüssel etc.).</em><br></br><br></br>
        Nun kannst du wahlweise mit der Tabula Recta oder der Chiffrierscheibe überprüfen, ob Vigenère richtig verschlüsselt hat – und ob du den Text wieder entschlüsseln kannst.
      </div>

      <div className="flex justify-center mb-4 gap-4">
          <button
          className={`px-4 py-2 rounded border ${
              activeTool === "tabula" ? "bg-white/20 text-white border-white" : "bg-transparent border-white/30 text-white/50"
              }`}
          onClick={() => setActiveTool("tabula")}
          >
          Tabula Recta
          </button>
          <button
          className={`px-4 py-2 rounded border ${
              activeTool === "disk" ? "bg-white/20 text-white border-white" : "bg-transparent border-white/30 text-white/50"
              }`}
          onClick={() => setActiveTool("disk")}
          >
          Chiffrierscheibe
          </button>
          </div>

        <div className="my-6">
          {activeTool === "tabula" ? <TabulaRectaTool /> : <ChiffreDisk />}
        </div>

        <div className="text-style mb-6">
        Zum Abschied stellt Vigenère dir noch eine Aufgabe: <em>"Versuche, den Geheimtext <strong className="text-white font-bold">'BCZIEIZWZ'</strong> zu entschlüsseln. Er wurde mit dem Schlüsselwort <strong className="text-white font-bold">'VIGENERE'</strong> verschlüsselt."</em><br></br><br></br>
        <em>Hinweis: Notiere dir die verschlüsselte Nachricht für die Zwischenprüfung.</em>
      </div>

      <WeiterButton to="/level3/kryptoanalyse" />
    </div>
  );
}
