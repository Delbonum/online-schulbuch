import { useState } from "react";
import AlphabetShiftingTool from "../../components/tools/AlphabetShiftingTool";
import HaeufigkeitsanalyseTool from "../../components/tools/HaeufigkeitsanalyseTool";
import FrequencyBars from "../../components/FrequencyBars";
import { ALPHABET, GERMAN_FREQUENCIES, guessCaesarShift, letterCounts, mostFrequentLetter } from "../../lib/crypto";
import { CAESAR_CIPHERTEXT, SUBSTITUTION_CIPHERTEXT } from "./ciphertexts";

export default function Kryptoanalyse() {
  const [showCaesarFrequencies, setShowCaesarFrequencies] = useState(false);

  const mostFrequent = mostFrequentLetter(CAESAR_CIPHERTEXT);
  const distance = guessCaesarShift(CAESAR_CIPHERTEXT);

  return (
    <div className="text-style">
      <h1 className="text-2xl font-bold heading-style mb-4">Let's see what we have...</h1>
      <p className="mb-4">
        Du hast dir in Bagdad ein Zimmer gemietet, um über das nachzudenken, was du inzwischen gelernt hast. Das
        Verschiebeverfahren war noch nicht besonders sicher – doch wie sieht es mit dem Ersetzungsverfahren aus? Du
        beschließt, zunächst nochmal einen Blick auf das Caesar-Verfahren zu werfen...
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-bold heading-style mb-2">Kryptoanalyse beim Verschiebeverfahren</h2>
        <p>
          Du erinnerst dich daran, dass das Caesar-Verfahren nur eine Verschiebung des Alphabets ist und daher nur 26
          mögliche Schlüssel existieren. Durch Ausprobieren aller Schlüssel solltest du also jede Nachricht
          entschlüsseln können. Probiere nun für die folgende Nachricht alle 26 möglichen Schlüssel durch, um die
          Chiffre zu knacken:
        </p>
        <AlphabetShiftingTool initialText={CAESAR_CIPHERTEXT} />
        <p>
          Das Ausprobieren funktioniert problemlos, aber du erkennst, dass es auch einen systematischen Weg gibt, das
          Caesar-Verfahren zu knacken. Dafür zählst du die Häufigkeit der Buchstaben im Geheimtext und bildest die
          Buchstaben entsprechend der Häufigkeit in der Klartext-Sprache aufeinander ab. Wenn du also herausfindest,
          welche Buchstaben im Geheimtext besonders häufig vorkommen, kannst du versuchen, diese mit den häufigsten
          Buchstaben in Klartexten zu vergleichen. Am häufigsten ist im Deutschen z. B. das „E“, gefolgt von „N“, „I“,
          „S“ usw. Im Deutschen finden sich die folgenden Buchstabenhäufigkeiten:
        </p>
        <FrequencyBars counts={GERMAN_FREQUENCIES} unit=" %" label="Buchstabenhäufigkeiten im Deutschen" />
        <p className="mt-4">Nun betrachtest du nochmal die verschlüsselte Botschaft:</p>
        <div className="panel text-sm my-4">{CAESAR_CIPHERTEXT}</div>
        <button type="button" onClick={() => setShowCaesarFrequencies(!showCaesarFrequencies)} className="btn mb-2">
          Buchstabenhäufigkeit {showCaesarFrequencies ? "ausblenden" : "anzeigen"}
        </button>
        {showCaesarFrequencies && (
          <div className="flex flex-wrap items-start gap-4">
            <FrequencyBars counts={letterCounts(CAESAR_CIPHERTEXT)} />
            <div className="text-sm max-w-lg panel">
              Nun erkennst du, dass '<b>{mostFrequent}</b>' der häufigste Buchstabe ist. In der Klartext-Sprache ist '
              <b>E</b>' der häufigste Buchstabe. Zwischen beiden Buchstaben gibt es im Alphabet einen Abstand von{" "}
              <b>{distance}</b>. Dir fällt auf, dass bei der Caesar-Chiffre alle Buchstaben gleichmäßig verschoben
              werden und <b>{distance}</b> daher die Verschiebezahl sein sollte. Damit ergibt sich für ein '<b>A</b>' im
              Klartext also ein <b>{ALPHABET[distance]}</b>. Damit hast du eine Vermutung für den Schlüssel. Jetzt
              kannst du überprüfen, ob das mit dem Ergebnis der Brute Force Methode (Durchprobieren aller Möglichkeiten)
              übereinstimmt.
            </div>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold heading-style mb-2">Kryptoanalyse beim Ersetzungsverfahren</h2>
        <HaeufigkeitsanalyseTool initialText={SUBSTITUTION_CIPHERTEXT} />
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold heading-style mb-2">Vergleich der Sicherheit</h2>
        <p>
          Du hast herausgefunden: Das Caesar-Verfahren ist leicht durch Brute-Force knackbar – es gibt nur 26 mögliche
          Schlüssel. Beim Ersetzungsverfahren sind es 26! Möglichkeiten – viel zu viele zum Raten. Aber auch hier hilft
          die Häufigkeitsanalyse – aber nur, wenn der Text lang genug ist, um die Häufigkeiten repräsentativ abzubilden.
        </p>
      </section>
    </div>
  );
}
