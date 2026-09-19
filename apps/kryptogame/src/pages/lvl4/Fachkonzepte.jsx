import ModPowTool from "../../components/tools/ModPowTool";

function Concept({ title, children }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
      {children}
    </section>
  );
}

export default function FachkonzepteLvl4() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 heading-style">Fachkonzepte</h1>

      <div className="space-y-6 text-style">
        <Concept title="Symmetrische Verfahren und das Schlüsselaustauschproblem">
          <p>
            Bei <b>symmetrischen Verfahren</b> wie Caesar, Ersetzungsverfahren, Vigenère oder One-Time-Pad verwenden
            Absender und Empfänger denselben geheimen Schlüssel. Dieser muss vorher auf einem sicheren Weg ausgetauscht
            werden. Das ist das <b>Schlüsselaustauschproblem</b>: Bei vielen Kommunikationspartnern oder großen
            Entfernungen ist ein sicherer Austausch aufwendig oder gar nicht möglich.
          </p>
        </Concept>

        <Concept title="Modulo-Rechnung">
          <p>
            <span className="font-mono text-white">a mod m</span> ist der Rest, der bei der ganzzahligen Division von a
            durch m bleibt, z. B. <span className="font-mono text-white">17 mod 5 = 2</span>, weil 17 = 3 · 5 + 2. Beim
            Rechnen modulo m bleiben alle Ergebnisse zwischen 0 und m − 1 – man rechnet „im Kreis“.
          </p>
        </Concept>

        <Concept title="Einwegfunktion und diskreter Logarithmus">
          <p>
            Eine <b>Einwegfunktion</b> ist leicht zu berechnen, aber nur mit enormem Aufwand umzukehren. Die modulare
            Potenz{" "}
            <span className="font-mono text-white">
              g<sup>x</sup> mod p
            </span>{" "}
            gilt als solche Funktion: Das Ergebnis ist schnell berechnet, aber aus Ergebnis, g und p den Exponenten x zu
            bestimmen – den <b>diskreten Logarithmus</b> – ist bei großen Primzahlen praktisch unmöglich.
          </p>
        </Concept>

        <Concept title="Diffie-Hellman-Schlüsselaustausch">
          <p className="mb-2">
            Das 1976 von Whitfield Diffie und Martin Hellman veröffentlichte Verfahren erlaubt es zwei Personen, über
            einen öffentlichen Kanal einen gemeinsamen geheimen Schlüssel zu vereinbaren:
          </p>
          <ol className="list-decimal list-inside space-y-1 mb-2">
            <li>Öffentlich: Primzahl p und Basis g vereinbaren.</li>
            <li>Geheim: Alice wählt a, Bob wählt b.</li>
            <li>
              Alice sendet A = g<sup>a</sup> mod p, Bob sendet B = g<sup>b</sup> mod p.
            </li>
            <li>
              Gemeinsamer Schlüssel: K = B<sup>a</sup> mod p = A<sup>b</sup> mod p.
            </li>
          </ol>
          <p>
            Anschließend wird K als Schlüssel für ein <b>symmetrisches</b> Verfahren genutzt. Genau so beginnt bis heute
            fast jede verschlüsselte Verbindung im Internet, etwa beim Aufruf einer Webseite über HTTPS.
          </p>
        </Concept>

        <Concept title="Grenze: Man-in-the-Middle-Angriff">
          <p>
            Diffie-Hellman schützt vor Lauschern, prüft aber nicht, <b>mit wem</b> man den Schlüssel vereinbart. Eine
            Angreiferin, die Nachrichten nicht nur mitlesen, sondern auch abfangen und verändern kann, kann sich
            unbemerkt zwischen Alice und Bob schalten und mit beiden jeweils einen eigenen Schlüssel vereinbaren.
            Dagegen helfen zusätzliche Echtheitsnachweise wie digitale Signaturen und Zertifikate.
          </p>
        </Concept>

        <Concept title="Modulo-Rechner">
          <ModPowTool />
        </Concept>
      </div>
    </div>
  );
}
