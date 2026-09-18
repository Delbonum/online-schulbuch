import arabImage from "../../img/arab.webp";

export default function Level2Intro() {
  return (
    <>
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 text-style">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold mb-4 heading-style">Die Reise geht weiter...</h1>
          <p className="mb-4">
            Nach deiner erfolgreichen Entschlüsselung einer wichtigen Nachricht konntest du Caesar warnen. Doch die
            Spione der Gegner schlafen nicht. Leise murmelst du vor dich hin:{" "}
            <i>
              "Caesars Chiffre habe ich sehr schnell durchschaut. Die Idee ist einfach und gut - aber leider nicht
              besonders sicher. Hmm..."
            </i>
          </p>
          <p className="mb-4">
            Du machst dich auf die Suche nach einer besseren Verschlüsselungsmethode und setzt dich erneut in deine
            Zeitmaschine. Du hast schon eine Idee, wie man Caesars Verfahren noch verfeinern könnte - und tatsächlich
            findest du im 9. Jahrhundert der arabischen Welt eine interessante Abhandlung von Al-Kindi, einem der ersten
            Kryptologen der Geschichte. Verwendet wurde das Ersetzungsverfahren vermutlich schon viel früher - womöglich
            schon im alten Ägypten? - aber Al-Kindi hat es erstmals in einer für die Nachwelt zugänglichen Art und Weise
            systematisch beschrieben, erklärt und dokumentiert. Als Zeitreisender hast du Glück und kannst Al-Kindi
            persönlich treffen.
          </p>
          {/*
        <p className="mb-4">
          Während das Caesar-Verfahren einfach nur Buchstaben verschiebt, ersetzt das Ersetzungsverfahren jeden Buchstaben durch einen anderen –
        und das nicht mehr mit einem festen Abstand, sondern ganz nach einem geheimen Schlüsselalphabet.
        </p>
        */}
        </div>

        <div className="flex-shrink-0 w-full md:w-1/5">
          <br></br>
          <img loading="lazy" src={arabImage} alt="Al-Kindi und die arabische Kryptologie" className="illustration" />
        </div>
      </div>
    </>
  );
}
