import RsaKeyTool from "../../components/tools/RsaKeyTool";

export default function Schluesselerzeugung() {
  return (
    <>
      <h1>Wie ein Schlüsselpaar entsteht</h1>

      <p>Shamir zeigt dir, wie aus zwei Primzahlen ein Schlüsselpaar wird. Die Rechnung hat vier Schritte:</p>

      <ol>
        <li>
          Zwei verschiedene Primzahlen <b>p</b> und <b>q</b> wählen und <b>n = p · q</b> berechnen.
        </li>
        <li>
          <b>φ(n) = (p − 1) · (q − 1)</b> berechnen. Diese Zahl gibt an, wie viele Zahlen unter n zu n teilerfremd sind.
        </li>
        <li>
          Einen öffentlichen Exponenten <b>e</b> wählen, der zu φ(n) teilerfremd ist.
        </li>
        <li>
          Den privaten Exponenten <b>d</b> so bestimmen, dass <b>(e · d) mod φ(n) = 1</b> gilt.
        </li>
      </ol>

      <p>Probiere verschiedene Primzahlen aus und beobachte, wie sich die Schlüssel verändern:</p>

      <RsaKeyTool />

      <section>
        <h2>Warum das sicher ist</h2>
        <p>
          Veröffentlicht werden nur <b>e</b> und <b>n</b>. Um daraus <b>d</b> zu berechnen, braucht man φ(n) – und dafür
          wiederum p und q. Die bekommt man nur durch Faktorisieren von n. Genau das ist bei großen Zahlen praktisch
          unmöglich.
        </p>
        <p>
          <i>„Denk daran“</i>, warnt Shamir,{" "}
          <i>
            „mit unseren winzigen Zahlen ist das ein Anschauungsmodell. Wer n = 391 sieht, findet p und q in Sekunden.“
          </i>
        </p>
      </section>
    </>
  );
}
