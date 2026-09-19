export default function Level5Intro() {
  return (
    <>
      <h1>Ein Schloss, das jeder zuschnappen lassen darf</h1>

      <p>
        Mit Diffie-Hellman können sich Alice und Bob über eine offene Leitung auf einen Schlüssel einigen. Trotzdem
        bleibt eine Frage offen: Beide müssen dafür gleichzeitig mitspielen. Was ist, wenn Alice Bob einfach eine
        verschlüsselte Nachricht schicken will, ohne vorher etwas mit ihm auszuhandeln?
      </p>

      <p>
        Du stellst deine Zeitmaschine auf das Jahr <b>1977</b> und landest am Massachusetts Institute of Technology.
        Dort treffen sich drei Forscher: <b>Ron Rivest</b>, <b>Adi Shamir</b> und <b>Leonard Adleman</b>. Nach dem
        Aufsatz von Diffie und Hellman haben sie monatelang nach einem Verfahren mit zwei verschiedenen Schlüsseln
        gesucht – Rivest und Shamir schlugen Ideen vor, Adleman zerlegte sie wieder. Bis eine Idee standhielt. Nach
        ihren Anfangsbuchstaben heißt sie <b>RSA</b>.
      </p>

      <section>
        <h2>Die Idee: zwei Schlüssel statt einem</h2>
        <p>
          <i>„Stell dir einen Briefkasten mit einem Vorhängeschloss vor“</i>, erklärt Rivest.{" "}
          <i>
            „Das offene Schloss lege ich für alle sichtbar auf den Tisch. Jeder kann seinen Brief einwerfen und das
            Schloss zuschnappen lassen. Aufbekommen tut es nur, wer den Schlüssel dazu hat – und das bin nur ich.“
          </i>
        </p>
        <ul>
          <li>
            Der <b>öffentliche Schlüssel</b> darf jedem bekannt sein. Mit ihm wird verschlüsselt.
          </li>
          <li>
            Der <b>private Schlüssel</b> bleibt geheim. Nur mit ihm wird entschlüsselt.
          </li>
        </ul>
        <p>
          Man nennt solche Verfahren <b>asymmetrisch</b>, weil zum Ver- und Entschlüsseln unterschiedliche Schlüssel
          gehören. Alle bisherigen Verfahren deiner Reise waren <b>symmetrisch</b>: Dort war es derselbe Schlüssel.
        </p>
      </section>

      <p>
        <i>„Und damit das funktioniert“</i>, ergänzt Adleman,{" "}
        <i>
          „brauchen wir wieder eine Rechnung, die sich nur in eine Richtung leicht ausführen lässt. Diesmal nehmen wir
          Primzahlen.“
        </i>
      </p>
    </>
  );
}
