import RsaKeyTool from "../../components/tools/RsaKeyTool";

export default function FachkonzepteLvl5() {
  return (
    <>
      <h1>Fachkonzepte</h1>

      <section>
        <h2>Symmetrisch und asymmetrisch</h2>
        <p>
          Bei <b>symmetrischen Verfahren</b> (Caesar, Ersetzung, Vigenère, One-Time-Pad) nutzen beide Seiten denselben
          geheimen Schlüssel. Bei <b>asymmetrischen Verfahren</b> gehört zu jeder Person ein <b>Schlüsselpaar</b>: ein
          öffentlicher Schlüssel zum Verschlüsseln, den jede und jeder kennen darf, und ein privater Schlüssel zum
          Entschlüsseln, der geheim bleibt. Damit entfällt das Schlüsselaustauschproblem.
        </p>
      </section>

      <section>
        <h2>Faktorisierung als Einwegfunktion</h2>
        <p>
          Zwei große Primzahlen zu multiplizieren ist einfach; ein großes Produkt wieder in seine Primfaktoren zu
          zerlegen, ist selbst mit sehr viel Rechenleistung praktisch unmöglich. Auf dieser Asymmetrie beruht die
          Sicherheit von RSA.
        </p>
      </section>

      <section>
        <h2>Das RSA-Verfahren</h2>
        <ol>
          <li>
            Primzahlen p und q wählen, <b>n = p · q</b> berechnen.
          </li>
          <li>
            <b>φ(n) = (p − 1)(q − 1)</b> berechnen.
          </li>
          <li>
            Öffentlichen Exponenten <b>e</b> teilerfremd zu φ(n) wählen.
          </li>
          <li>
            Privaten Exponenten <b>d</b> mit <b>(e · d) mod φ(n) = 1</b> bestimmen.
          </li>
          <li>
            Verschlüsseln: <b>c = mᵉ mod n</b> · Entschlüsseln:{" "}
            <b>
              m = c<sup>d</sup> mod n
            </b>
          </li>
        </ol>
        <p>
          Öffentlicher Schlüssel: (e, n). Privater Schlüssel: (d, n). Benannt ist das Verfahren nach Ron Rivest, Adi
          Shamir und Leonard Adleman, die es 1977 veröffentlichten.
        </p>
      </section>

      <section>
        <h2>Digitale Signatur</h2>
        <p>
          Die beiden Schlüssel lassen sich auch vertauscht einsetzen: Wer eine Nachricht mit seinem <b>privaten</b>{" "}
          Schlüssel verschlüsselt, erzeugt eine <b>digitale Signatur</b>. Jede und jeder kann sie mit dem öffentlichen
          Schlüssel prüfen und weiß dann, dass die Nachricht wirklich von dieser Person stammt und unverändert ist.
          Damit lässt sich auch der Man-in-the-Middle-Angriff aus Level 4 verhindern.
        </p>
      </section>

      <section>
        <h2>In der Praxis</h2>
        <p>
          RSA ist deutlich langsamer als symmetrische Verfahren. Deshalb wird es meist nur genutzt, um einen Schlüssel
          für ein schnelles symmetrisches Verfahren zu übertragen oder um Signaturen und Zertifikate zu erzeugen – etwa
          bei jedem Aufruf einer Webseite über HTTPS. Sichere Schlüssel haben heute mindestens 2048 Bit, das entspricht
          über 600 Dezimalstellen.
        </p>
      </section>

      <section>
        <h2>Schlüssel-Werkzeug</h2>
        <RsaKeyTool />
      </section>
    </>
  );
}
