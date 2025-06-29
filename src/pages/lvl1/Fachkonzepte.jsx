import React from "react";
import ShiftTool from '../components/tools/ShiftTool';
import WeiterButton from "../components/WeiterButton";

export default function Fachkonzepte() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 heading-style">Fachkonzepte</h1>

      <div className="space-y-6 text-style">
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Das Caesar-Verfahren</h2>
          <p>
            Der römische Staatsmann und Feldherr Julius Caesar (* 100 v. Chr. in Rom; † 44 v. Chr. in Rom) verwendete ein einfaches Verfahren zum Verschlüsseln von Nachrichten: Er ließ jeden Buchstaben im Alphabet um 3 Stellen verschieben, um eine Nachricht zu verschlüsseln.
            Dieses Vorgehen bei der Verschlüsselung nennen wir heute <strong><b>Caesar-Verfahren</b></strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Das Verschiebeverfahren</h2>
          <p>
            Caesar verwendete die <strong><b>Verschiebezahl</b></strong> 3. Das Chiffrierverfahren wird noch etwas vielseitiger, wenn man die Verschiebezahl frei wählen kann.
            Den <strong><b>Geheimtext</b></strong>-Buchstaben, der sich ergibt, wenn man den <strong><b>Klartext</b></strong>-Buchstaben „A“ verschlüsselt, nennt man den <strong><b>Schlüssel</b></strong>.
          </p>
          <p>
            Beim Verschlüsseln wird also jeder Buchstabe um die Verschiebezahl <i className="text-white">n</i> verschoben, die sich wiederum direkt aus der Position des Schlüssels <i className="text-white">s</i> im Alphabet ergibt.
            Wird das Alphabet dabei überschritten, beginnt man wieder am Anfang. Die Entschlüsselung kann auf zwei verschiedene Weisen erfolgen:
          </p>
          <ul className="list-disc list-inside ml-4">
            <li>Zurückverschieben um die Verschiebezahl <i className="text-white">n</i></li>
            <li>Verschieben um die neue Verschiebezahl <i className="text-white">n′ = (26 - n) % 26</i></li>
          </ul>
          <p>Auch hier wird beim Überschreiten des Alphabets zyklisch von hinten weitergezählt.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Die Chiffrierscheibe</h2>
          <p>
            Zur Ver- und Entschlüsselung mit dem Caesar-Verfahren kann man eine sogenannte <strong><b>Chiffrierscheibe</b></strong> verwenden.
            Dabei handelt es sich um zwei runde Scheiben auf einer gemeinsamen Achse, wobei die innere drehbar ist.
            Chiffrierscheiben sind bereits seit dem 15. Jahrhundert dokumentiert und helfen dabei, den Schlüssel visuell darzustellen.
            Sie wurden von verschiedenen Personen und Kulturen verwendet, um Nachrichten zu verschlüsseln und zu entschlüsseln - so beispielsweise im amerikanischen Bürgerkrieg in den 1860er Jahren.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Verschiebe-Tool</h2>
          <ShiftTool />
        </section>
      </div>
      <WeiterButton to="/level1/pruefung" />
    </div>
  );
}
