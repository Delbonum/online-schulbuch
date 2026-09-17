import FactoringChallenge from "../../components/tools/FactoringChallenge";

export default function Primzahlen() {
  return (
    <>
      <h1>Multiplizieren ist leicht, Zerlegen ist schwer</h1>

      <p>
        Adleman schreibt zwei Primzahlen an die Tafel: <b>53</b> und <b>59</b>. <i>„Multipliziere sie.“</i> Das schaffst
        du im Kopf oder in wenigen Sekunden schriftlich: 53 · 59 = 3127.
      </p>

      <p>
        <i>„Und jetzt andersherum“</i>, sagt er und wischt die beiden Primzahlen weg.{" "}
        <i>„Hier steht 3127. Welche zwei Primzahlen waren es?“</i> Probiere es selbst – ohne zurückzublättern:
      </p>

      <FactoringChallenge number={3127} />

      <section>
        <h2>Warum das die Grundlage von RSA ist</h2>
        <p>
          Das Zerlegen einer Zahl in ihre Primfaktoren heißt <b>Faktorisierung</b>. Für kleine Zahlen ist das
          Fleißarbeit, für große Zahlen ist es aussichtslos: Bei einer Zahl mit 617 Stellen – wie sie heute üblich ist –
          müsste man unvorstellbar viele Möglichkeiten durchprobieren. Multiplizieren dagegen dauert auch bei solchen
          Zahlen nur Sekundenbruchteile.
        </p>
        <p>
          Genau darauf baut RSA: Der öffentliche Schlüssel enthält das Produkt <b>n = p · q</b>. Wer p und q kennt, kann
          den privaten Schlüssel berechnen. Alle anderen müssten n faktorisieren – und daran scheitern selbst
          Rechenzentren.
        </p>
      </section>

      <div className="panel border-l-4 border-sky-300">
        <p className="text-white font-semibold mb-1">Zum Vergleich</p>
        <p>
          2009 brauchte ein Team mit hunderten Computern etwa zwei Jahre, um eine 232-stellige Zahl zu faktorisieren.
          Zahlen dieser Größe gelten seitdem als unsicher – heute übliche Schlüssel sind noch einmal deutlich größer.
        </p>
      </div>
    </>
  );
}
