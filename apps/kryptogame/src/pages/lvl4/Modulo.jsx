import ModuloClock from "../../components/tools/ModuloClock";
import ModPowTool from "../../components/tools/ModPowTool";
import DiscreteLogChallenge from "../../components/tools/DiscreteLogChallenge";

export default function Modulo() {
  return (
    <div className="text-style space-y-6">
      <h1 className="text-2xl font-bold heading-style">Rechnen im Kreis</h1>

      <section className="space-y-3">
        <p>
          Diffie greift zur Kreide.{" "}
          <i>„Du kennst die Rechenoperation schon, die wir brauchen – sie steckt in jeder Uhr.“</i> Wenn es jetzt 9 Uhr
          ist, ist es in 5 Stunden nicht 14, sondern 2 Uhr (auf einer 12-Stunden-Uhr). Man zählt im Kreis und beginnt
          nach 12 wieder von vorn.
        </p>
        <p>
          Mathematisch heißt das <b>Rechnen modulo m</b>: Von einer Zahl interessiert nur der <b>Rest</b>, der bei der
          Division durch m übrig bleibt. Man schreibt <span className="text-white font-mono">14 mod 12 = 2</span>.
          Übrigens hast du das schon bei Caesar benutzt: Wer über Z hinaus verschiebt, landet wieder bei A – das ist
          Rechnen modulo 26.
        </p>
      </section>

      <ModuloClock />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Potenzieren mit Rest</h2>
        <p>
          <i>„Und jetzt kommt der Trick“</i>, sagt Diffie. Man nimmt eine Basis g, potenziert sie mit einem Exponenten x
          und bildet den Rest modulo einer Primzahl p:{" "}
          <span className="text-white font-mono">
            g<sup>x</sup> mod p
          </span>
          . Das lässt sich schnell ausrechnen – auch von Hand, wenn man nach jeder Multiplikation sofort den Rest
          bildet.
        </p>
      </section>

      <ModPowTool />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Und jetzt rückwärts!</h2>
        <p>
          Oben hast du gesehen: 3<sup>4</sup> mod 17 = 13. Stell dir vor, du kennst nur das Ergebnis 13 sowie g = 3 und
          p = 17. Kannst du den Exponenten herausfinden? Versuche es, ohne nach oben zu schauen:
        </p>
      </section>

      <DiscreteLogChallenge g={3} p={17} target={13} />

      <div className="panel border-l-4 border-sky-300">
        <p className="text-white font-semibold mb-1">Eine mathematische Einwegfunktion</p>
        <p>
          Den Exponenten zu einem Ergebnis zu finden, nennt man den <b>diskreten Logarithmus</b>. Ein schnelles
          Verfahren dafür ist nicht bekannt – im Prinzip bleibt nur das Durchprobieren. Bei p = 17 geht das in Sekunden.
          In der Praxis verwendet man aber Primzahlen mit über 600 Dezimalstellen. Dann würden selbst alle Computer der
          Welt zusammen länger rechnen, als das Universum alt ist.
        </p>
      </div>
    </div>
  );
}
