import miller from "../../img/miller.webp";
import mauborgne from "../../img/mauborgne.webp";

export default function OneTimePad() {
  return (
    <div>
      <h1 className="text-2xl font-bold heading-style mb-4">Das One-Time-Pad</h1>

      <div className="flex flex-col md:flex-row items-start gap-4">
        <img loading="lazy" src={miller} alt="Miller" className="w-60 h-auto self-start" />
        <p className="mb-4">
          Auf deiner Reise machst du einen weiteren Stopp im 19. Jahrhundert. 1882 begegnest du dem amerikanischen
          Kryptologen Frank Miller, der ein Verfahren vorschlägt, das die Sicherheit der Verschlüsselung revolutionieren
          soll. Du triffst ihn in einem kleinen Café in New York, wo er dir seine neusten Überlegungen erläutert:
          <em>
            "Die Idee ist simpel und doch äußerst wirkungsvoll: Man nutzt im Kern das Vigenère-Verfahren - aber mit
            einer entscheidenden Besonderheit! Der Schlüssel ist genauso lang wie der Klartext und wird nur ein einziges
            Mal verwendet. So wird jeder Buchstabe im Klartext mit einem zufällig gewählten Schlüsselbuchstaben
            chiffriert, was die absolute Sicherheit des Verfahrens garantiert!"
          </em>
          <br></br>
          <br></br>
          Du erkennst schnell: Tatsächlich scheint das One-Time-Pad unknackbar zu sein! Damit wird es zum ersten Mal
          möglich, Nachrichten absolut sicher zu verschlüsseln. Du freust dich über deine Entdeckung und suchst weiter
          in der Zeit, um mehr darüber zu erfahren, wo und wann dieses Verfahren tatsächlich eingesetzt wird.
        </p>
      </div>

      <div className="flex flex-col md:flex-row-reverse items-start gap-4">
        <img loading="lazy" src={mauborgne} alt="Joseph O. Mauborgne" className="w-40 h-auto self-start" />
        <p className="mb-4">
          Im 20. Jahrhundert – einer Ära, in der die verschlüsselte Kommunikation über weite Strecken hinweg immer
          bedeutsamer wird – begegnest du dem Amerikaner Joseph O. Mauborgne, der die Idee aufgreift und umsetzt. Er
          gibt dem Verfahren den Namen, unter dem es schließlich bekannt wird: Das <strong>One-Time-Pad</strong>.
          <br></br>
          <br></br>
          Du reist ins Jahr 1963 und erkennst, wie bedeutsam das Verfahren in dieser Zeit tatsächlich ist: Der
          sogenannte Heiße Draht zwischen dem Weißen Haus in Washington und dem Kreml in Moskau wird mit dem
          One-Time-Pad gesichert. Beschlossen wird die Verbindung als Lehre aus der Kuba-Krise von 1962; im August 1963
          geht sie in Betrieb. Ziel ist es, eine direkte, schnelle und sichere Kommunikation zwischen Washington und
          Moskau zu ermöglichen, um Missverständnisse und Eskalationen in Krisensituationen zu vermeiden.
        </p>
      </div>

      <p className="mb-4">
        Du bist beeindruckt von der Bedeutung des One-Time-Pads und seiner Rolle in der Geschichte der Kryptographie. Es
        ist faszinierend zu sehen, wie ein so einfaches Konzept eine so große Wirkung haben kann. Allerdings weißt du
        auch, dass die praktische Umsetzung des One-Time-Pads in der realen Welt einige Herausforderungen mit sich
        bringt. Zum Beispiel muss der Schlüssel wirklich zufällig und geheim sein, und er darf nur einmal verwendet
        werden. Außerdem siehst du eine Schwierigkeit darin, dass der Schlüssel genauso lang sein muss wie die Nachricht
        selbst, was in der Praxis oft unpraktisch ist. Ganz zu schweigen von der Herausforderung, den Schlüssel sicher
        zu übertragen... Ob sich wohl in der Zukunft weitere Methoden der Kryptologie finden, die diese Probleme lösen
        können?
      </p>
    </div>
  );
}
