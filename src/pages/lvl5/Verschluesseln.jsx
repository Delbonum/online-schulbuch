import RsaCipherTool from "../../components/tools/RsaCipherTool";

export default function Verschluesseln() {
  return (
    <>
      <h1>Ver- und Entschlüsseln mit RSA</h1>

      <p>
        Jetzt wird gerechnet. Zuerst wird jeder Buchstabe zu einer Zahl: <b>A = 1</b>, <b>B = 2</b>, …, <b>Z = 26</b>.
        Dann gilt für jede Zahl m:
      </p>

      <ul>
        <li>
          Verschlüsseln mit dem öffentlichen Schlüssel: <b>c = mᵉ mod n</b>
        </li>
        <li>
          Entschlüsseln mit dem privaten Schlüssel:{" "}
          <b>
            m = c<sup>d</sup> mod n
          </b>
        </li>
      </ul>

      <p>
        Das ist dieselbe modulare Potenz wie in Level 4 – nur dass hier zwei verschiedene Exponenten zusammengehören.
        Rivest rechnet ein Beispiel mit dem Schlüsselpaar aus dem letzten Abschnitt vor (n = 391, e = 3, d = 235):
      </p>

      <div className="panel">
        <p className="font-mono">
          H = 8 → 8<sup>3</sup> mod 391 = 512 mod 391 = <b className="text-white">121</b>
        </p>
        <p className="font-mono">
          zurück: 121<sup>235</sup> mod 391 = <b className="text-white">8</b> = H
        </p>
      </div>

      <RsaCipherTool initialModulus={391} initialExponent={3} />

      <section>
        <h2>Deine Aufgabe</h2>
        <p>
          Du gibst Rivest deinen öffentlichen Schlüssel <b>(e = 3, n = 391)</b>. Kurz darauf erreicht dich seine
          Antwort:
        </p>
        <p className="panel font-mono text-white">180 358 125 216 216 125 7 268 242 1 27 121 180</p>
        <p>
          Entschlüssele die Nachricht mit deinem privaten Schlüssel <b>d = 235</b>. Trage dazu die Zahlen in das
          Werkzeug oben ein, setze den Exponenten auf 235 und klicke auf „entschlüsseln“.
        </p>
        <p>
          <em>Hinweis: Notiere dir die entschlüsselte Nachricht für die Zwischenprüfung.</em>
        </p>
      </section>

      <div className="panel border-l-4 border-amber-300">
        <p className="text-white font-semibold mb-1">📓 Notiz im Zeitreise-Journal</p>
        <p>
          Buchstabe für Buchstabe zu verschlüsseln ist bequem, aber unsicher: Gleiche Buchstaben ergeben immer dieselbe
          Zahl – eine Häufigkeitsanalyse wie in Level 2 würde funktionieren. Echtes RSA verschlüsselt deshalb große
          Blöcke und mischt Zufallsdaten unter. Und weil RSA langsam ist, wird damit meist nur ein Schlüssel für ein
          schnelles symmetrisches Verfahren übertragen.
        </p>
      </div>
    </>
  );
}
