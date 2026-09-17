import DiffieHellmanTool from "../../components/tools/DiffieHellmanTool";
import ModPowTool from "../../components/tools/ModPowTool";
import ShiftTool from "../../components/tools/ShiftTool";

export default function DiffieHellman() {
  return (
    <div className="text-style space-y-6">
      <h1 className="text-2xl font-bold heading-style">Der Diffie-Hellman-Schlüsselaustausch</h1>

      <section className="space-y-3 max-w-4xl">
        <p>
          Jetzt ersetzt Hellman die Farben durch Zahlen.{" "}
          <i>
            „Die gemeinsame Farbe wird zu zwei öffentlichen Zahlen p und g. Die geheimen Farben werden zu Geheimzahlen a
            und b. Und statt zu mischen, potenzieren wir modulo p.“
          </i>
        </p>
        <ol className="list-decimal list-inside space-y-1">
          <li>
            Alice und Bob vereinbaren öffentlich eine Primzahl <b>p</b> und eine Basis <b>g</b>.
          </li>
          <li>
            Alice wählt eine Geheimzahl <b>a</b>, Bob eine Geheimzahl <b>b</b>.
          </li>
          <li>
            Alice berechnet{" "}
            <span className="font-mono text-white">
              A = g<sup>a</sup> mod p
            </span>
            , Bob berechnet{" "}
            <span className="font-mono text-white">
              B = g<sup>b</sup> mod p
            </span>
            .
          </li>
          <li>Alice schickt A an Bob, Bob schickt B an Alice – Eve liest beides mit.</li>
          <li>
            Alice berechnet{" "}
            <span className="font-mono text-white">
              K = B<sup>a</sup> mod p
            </span>
            , Bob berechnet{" "}
            <span className="font-mono text-white">
              K = A<sup>b</sup> mod p
            </span>
            .
          </li>
        </ol>
        <p>
          Beide erhalten dasselbe K, denn B<sup>a</sup> = (g<sup>b</sup>)<sup>a</sup> = g<sup>a·b</sup> = (g
          <sup>a</sup>)<sup>b</sup> = A<sup>b</sup> – und das gilt auch, wenn man zwischendurch den Rest modulo p
          bildet. Eve kennt p, g, A und B. Um K zu berechnen, bräuchte sie a oder b – also einen diskreten Logarithmus.
        </p>
      </section>

      <DiffieHellmanTool />

      <section className="space-y-3 max-w-4xl">
        <h2 className="text-xl font-semibold text-white">Deine Aufgabe</h2>
        <p>
          Zum Abschied möchte Bob dir – er hält dich für Alice – eine geheime Nachricht schicken. Ihr vereinbart
          öffentlich <b>p = 29</b> und <b>g = 2</b>. Deine Geheimzahl ist <b>a = 12</b>. Bob schickt dir die Zahl{" "}
          <b>B = 10</b>.
        </p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Welche Zahl A musst du an Bob schicken?</li>
          <li>Berechne euren gemeinsamen Schlüssel K.</li>
          <li>
            Bob hat seine Nachricht mit dem Caesar-Verfahren verschlüsselt und dabei K als Verschiebezahl verwendet:{" "}
            <strong className="text-white font-bold font-mono">NLYZZJOHEN OG GCNNYLHUWBN UG TYCNNIL</strong>
          </li>
        </ol>
        <p>
          <em>Hinweis: Notiere dir den Schlüssel K und die entschlüsselte Nachricht für die Zwischenprüfung.</em>
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Modulo-Rechner</h3>
          <ModPowTool initialBase={2} initialExponent={12} initialModulus={29} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Verschiebe-Tool</h3>
          <div className="panel">
            <ShiftTool />
          </div>
        </div>
      </div>

      <div className="panel border-l-4 border-amber-300 max-w-4xl">
        <p className="text-white font-semibold mb-1">📓 Notiz im Zeitreise-Journal</p>
        <p>
          Bei einem Abstecher nach Großbritannien erfährst du etwas Erstaunliches: Beim britischen Geheimdienst GCHQ
          hatten James Ellis, Clifford Cocks und Malcolm Williamson schon Anfang der 1970er-Jahre sehr ähnliche Ideen.
          Ihre Arbeit blieb jedoch streng geheim und wurde erst 1997 öffentlich – deshalb tragen die Verfahren heute die
          Namen der Forscher, die sie zuerst veröffentlicht haben.
        </p>
      </div>
    </div>
  );
}
