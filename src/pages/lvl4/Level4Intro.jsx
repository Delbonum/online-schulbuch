export default function Level4Intro() {
  return (
    <div className="text-style space-y-4 max-w-4xl">
      <h1 className="text-2xl font-bold heading-style">Das Schlüsselproblem</h1>

      <p>
        Das One-Time-Pad lässt dich nicht los. Absolut sicher – und trotzdem kaum zu gebrauchen, solange der Schlüssel
        erst einmal heil beim Empfänger ankommen muss. Du reist ins Jahr 1970 und siehst, wie Regierungen, Militärs und
        Banken dieses Problem lösen: Kuriere mit verschlossenen Koffern voller Schlüsselbücher reisen um die ganze Welt.
        Teuer, langsam – und jeder Kurier ist ein Risiko.
      </p>

      <div className="panel border-l-4 border-sky-300">
        <p className="text-white font-semibold mb-1">Das Problem in einem Satz</p>
        <p>
          Bei allen bisherigen Verfahren brauchen Absender und Empfänger <b>denselben geheimen Schlüssel</b>. Wie aber
          vereinbaren zwei Menschen einen solchen Schlüssel, wenn sie sich nie getroffen haben und jede Nachricht
          zwischen ihnen abgehört werden kann?
        </p>
      </div>

      <p>
        Die Antwort scheint klar: gar nicht. Was über eine abgehörte Leitung geschickt wird, kennt eben auch der
        Lauscher. Doch du hast von einem Aufsatz gehört, der genau das Gegenteil behauptet. Also steigst du wieder in
        deine Zeitmaschine und reist an die Stanford University im Jahr <b>1976</b>.
      </p>

      <p>
        Dort triffst du den jungen Kryptologen <b>Whitfield Diffie</b> und den Informatikprofessor <b>Martin Hellman</b>
        . Aufbauend auf Ideen des Studenten <b>Ralph Merkle</b> haben sie gerade ihren Artikel{" "}
        <i>„New Directions in Cryptography“</i> veröffentlicht.{" "}
        <i>
          „Zwei Personen können sich über eine völlig öffentliche Leitung auf einen gemeinsamen geheimen Schlüssel
          einigen“
        </i>
        , erklärt Hellman, <i>„und wer mithört, erfährt ihn trotzdem nicht.“</i>
      </p>

      <div className="panel">
        <p className="text-white font-semibold mb-2">Die Personen, die dich ab jetzt begleiten</p>
        <ul className="space-y-1">
          <li>
            👩 <b>Alice</b> möchte Bob eine geheime Nachricht schicken.
          </li>
          <li>
            👨 <b>Bob</b> soll die Nachricht lesen können.
          </li>
          <li>
            🕵️ <b>Eve</b> (von engl. <i>eavesdropper</i>, Lauscherin) hört alles mit, was zwischen den beiden
            ausgetauscht wird.
          </li>
        </ul>
        <p className="mt-2 text-sm text-white/70">
          Diese Namen sind in der Kryptologie seit Jahrzehnten üblich – du findest sie in fast jedem Fachbuch.
        </p>
      </div>

      <p>
        <i>„Bevor ich dir die Mathematik zeige“</i>, sagt Hellman und holt ein paar Farbtöpfe aus dem Schrank,{" "}
        <i>„machen wir ein kleines Experiment.“</i>
      </p>
    </div>
  );
}
