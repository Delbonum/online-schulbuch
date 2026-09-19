import ColorMixingTool from "../../components/tools/ColorMixingTool";

export default function Farbmischung() {
  return (
    <div className="text-style space-y-4">
      <h1 className="text-2xl font-bold heading-style">Geheimnisse mischen</h1>

      <p>
        Hellman stellt zwei Farbtöpfe vor dich.{" "}
        <i>
          „Stell dir vor, Alice und Bob tauschen Farben per Post aus – und Eve öffnet jedes Paket. Alles, was verschickt
          wird, sieht sie. Trotzdem sollen Alice und Bob am Ende dieselbe geheime Farbe haben.“
        </i>
      </p>

      <ol className="list-decimal list-inside space-y-1">
        <li>
          Alice und Bob einigen sich <b>öffentlich</b> auf eine gemeinsame Farbe.
        </li>
        <li>
          Jede Person wählt zusätzlich eine <b>geheime Farbe</b>, die sie niemandem zeigt.
        </li>
        <li>
          Beide mischen die gemeinsame Farbe mit ihrer geheimen Farbe und schicken die Mischung an die andere Person.
        </li>
        <li>Jede Person gibt ihre eigene geheime Farbe in die erhaltene Mischung.</li>
      </ol>

      <p>Probiere es aus – wähle die Farben und beobachte, was Eve sieht:</p>

      <ColorMixingTool />

      <div className="panel border-l-4 border-sky-300">
        <p className="text-white font-semibold mb-1">Warum funktioniert das?</p>
        <p>
          Am Ende enthalten beide Töpfe genau dieselben Zutaten: die gemeinsame Farbe, Alices geheime Farbe und Bobs
          geheime Farbe – nur in unterschiedlicher Reihenfolge hinzugefügt. Eve kennt dagegen nur Mischungen. Farben zu
          mischen ist leicht, eine Mischung wieder in ihre Bestandteile zu <b>zerlegen</b> ist praktisch unmöglich.
        </p>
      </div>

      <p>
        <i>„Solche Vorgänge nennen wir Einwegfunktionen“</i>, sagt Diffie.{" "}
        <i>
          „In eine Richtung ganz einfach, zurück nahezu aussichtslos. Mit Farben kann man natürlich keine
          Computer-Nachrichten schützen. Wir brauchen eine Rechenoperation, die sich genauso verhält.“
        </i>
      </p>
    </div>
  );
}
