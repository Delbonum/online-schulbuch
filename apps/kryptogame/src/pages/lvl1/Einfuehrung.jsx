import timemachine from "../../img/timemachine.webp";
import roemer from "../../img/roemer.webp";

export default function Einfuehrung() {
  return (
    <>
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 text-style">
        {/* Linkes Bild: Zeitmaschine */}
        <div className="flex-shrink-0 w-full md:w-1/5">
          <img loading="lazy" src={timemachine} alt="Zeitmaschine" className="illustration" />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold mb-4 heading-style">Willkommen beim Krypto-Zeitkommando</h1>
          <p className="mb-6">
            Du bist Teil einer geheimen Organisation, die durch die Zeit reist, um die Menschheit vor
            Kommunikationschaos und Datenmanipulation zu schützen. In deiner ersten Mission wirst du ins Jahr 50 v. Chr.
            geschickt. Dein Auftrag: Finde und entschlüssele eine wichtige Nachricht von Julius Caesar, die auf dem
            Schlachtfeld verloren gegangen ist. Verwende dazu die Methoden der klassischen Kryptologie und beweise dein
            Können in interaktiven Aufgaben und Prüfungen. Nur wer die verschlüsselten Botschaften versteht, kann
            Geschichte schreiben!
          </p>
        </div>

        <div className="flex-shrink-0 w-full md:w-1/4">
          <br></br>
          <img loading="lazy" src={roemer} alt="Römer" className="illustration" />
        </div>
      </div>
    </>
  );
}
