import React, { useState } from "react";
import KasiskiTable from "./components/KasiskiTable";
import SchluessellaengenTool from '../components/tools/SchluessellaengenTool';
import KolonnenanalyseTool from '../components/tools/KolonnenanalyseTool';
import TabulaRectaTool from '../components/tools/TabulaRectaTool';
import VigenereTool from '../components/tools/VigenereTool';
import useLevelGuard from "../components/LevelGuard";
import WeiterButton from "../components/WeiterButton";
import babbage from "../../img/babbage.png";
import kasiski from "../../img/kasiski.png";

export default function Kasiski() {
  useLevelGuard("level2Passed");

  const [showTabula, setShowTabula] = useState(false);

  return (
    <div>
      <h1 className="text-2xl font-bold heading-style mb-4">Der Kasiski-Test</h1>

      <p className="mb-4">
        Du hast herausgefunden, dass Vigenère durch eine Häufigkeitsanalyse geknackt
        werden kann, wenn die Schüssellänge bekannt ist. Doch der Schlüssel ist in
        aller Regel geheim; deshalb gehst du davon aus, dass das Vigenère-Verfahren
        sehr sicher sein muss – womöglich gar absolut sicher?
      </p>

      <div className="flex flex-col md:flex-row-reverse items-start gap-4">
          <img src={babbage} alt="Babbage" className="w-40 h-auto self-start" />
          <p className="mb-4">
            Nein. Lange Zeit gilt das Verfahren zwar als unknackbar, doch schob bald lernst du jemanden kennen,
            dem es offenbar doch gelingt, die Chiffre zu knacken:
            Bei deinen weiteren Zeitreisen triffst du im 19. Jahrhundert auf den
            englischen Mathematiker Charles Babbage. Im Jahr 1854 gelingt es ihm, einen
            Vigenère-verschlüsselten Text zu entziffern – allerdings will der alte
            Wichtigtuer nicht verraten, wie er das angestellt hat.<br></br><br></br>
            <em>"Egal"</em>, sagst du dir. <em>"Was er herausgefunden hat, können auch andere
            herausfinden."</em> Und tatsächlich musst du nur weitere 9 Jahre in die Zukunft
            reisen, um dem Geheimnis auf die Spur zu kommen...
          </p>
      </div>

      <div className="flex flex-col md:flex-row items-start gap-4">
          <img src={kasiski} alt="Kasiski" className="w-40 h-auto self-start" />
          <p className="mb-4">
            Du triffst den preußischen Infanteriemajor Friedrich Wilhelm Kasiski, der ein
            Verfahren entwickelt hat, die Chiffre zu knacken. Ihm zu Ehren wird dieses
            Verfahren als <strong>Kasiski-Test</strong> bezeichnet – und tatsächlich
            handelt es sich dabei um eine Methode, bei der zunächst die Schüssellänge
            ermittelt wird. Du triffst ihn, um dir von ihm persönlich seine Strategie
            erklären zu lassen.<br></br><br></br>
            <em>"Selbstredend will ich dir weiterhelfen, Fremder"</em>, sagt Kasiski offenherzig,
            lädt dich in sein Studierzimmer ein und zeigt dir eine exemplarische Vigenère-Verschlüsselung.
          </p>
      </div>

      <div className="bg-white/10 p-4 rounded text-sm mb-4 flex justify-center">
      <KasiskiTable />
      </div>

      <p className="mb-6">
          Kasiski führt näher aus: <em>"Wie du in diesem Beispiel erkennen kannst, kann es auf verschiedene Art und Weise zu Dopplungen kommen.
              Es kann immer wieder passieren, dass <strong className="text-green-600 font-bold">ein Klartext-Abschnitt mit dem gleichen Schlüssel-Abschnitt chiffriert wird, was selbstverständlich auch zu Dopplungen im Geheimtext führt</strong>.
              Natürlich muss das nicht immer der Fall sein: <strong className="text-blue-500 font-bold">Es kann auch Dopplungen im Klartext geben, die von unterschiedlichen Schlüsselbuchstaben chiffriert werden und dann im Geheimtext nicht mehr erkennbar sind</strong>.
              Man muss auch ein bisschen aufpassen, denn manchmal kann es auch vorkommen, dass <strong className="text-red-400 font-bold">Dopplungen im Geheimtext zufällig entstehen</strong>.<br></br><br></br>
              Statistisch gesehen ist es aber so, dass ein systematischer Zusammenhang zwischen Klartext, Schlüssel und Geheimtext viel häufiger ist als zufällige Dopplungen im Geheimtext.
              Wenn du eine Dopplung im Geheimtext findest, die sich über mehrere Buchstaben erstreckt, kannst du den Abstand zwischen den Dopplungen messen.
              Wenn du mehrere solcher Abstände findest, kannst du die größten gemeinsamen Teiler dieser Abstände ermitteln und so die Schlüssellänge herausfinden.</em>
      </p>

      <p className="font-semibold mb-2">Ermittle die Schüssellänge:</p>
      <div className="bg-white/10 p-4 rounded mb-6">
      <SchluessellaengenTool />
      </div>

      <p className="mb-6">
          Wenn du die Schlüssellänge erfolgreich ermittelt hast, kannst du - genau wie du es dir vorher überlegt hast - zur Clusteranalyse übergehen:
          Dazu teilst du den Geheimtext in mehrere Kolonnen auf - und zwar so, dass jede Kolonne nur Buchstaben enthält, die mit dem gleichen Schlüsselbuchstaben chiffriert wurden.
          Anschließend kannst du für jede Kolonne die Häufigkeitsanalyse durchführen, um den Schlüssel zu ermitteln.
      </p>

      <p className="font-semibold mb-2">Häufigkeitsanalyse in Kolonnen:</p>
      <div className="bg-white/10 p-4 rounded mb-6">
      <KolonnenanalyseTool />
      </div>

      <p className="mb-6">
          Wenn du nun herausgefunden hast, welches der häufigste Buchstabe in jeder Kolonne ist, kannst du den Schlüssel ermitteln.
          Danach kannst du die Nachricht mit dem Schlüssel dechiffrieren und lesen.<br></br><br></br>
          <em>Hinweis: Notiere dir den geknackten Schlüssel zum vorgegebenen Geheimtext für die Zwischenprüfung.</em>
      </p>

    <div className="mb-6">
        <button
          className="border border-white text-white font-semibold px-4 py-2 rounded hover:bg-white/10 transition duration-200"
          onClick={() => setShowTabula(prev => !prev)}
        >
          {showTabula ? "Tabula Recta ausblenden" : "Tabula Recta einblenden"}
        </button>
      {showTabula && (
        <div className="bg-white/10 p-4 rounded text-sm mt-2">
          <TabulaRectaTool />
        </div>
      )}
    </div>

    <div className="bg-white/10 p-4 rounded text-sm mb-6">
      <VigenereTool initialGeheimtext="HGINEHWTEIBLUNARWPCLDWCVDDYUVNCETJIBLTFTQEVIIFFJEEHRNREQGIVNZYTLRZPUVNYIJKEMHBJKNQNKMHVOZCGXBLSCINJIMREZEKYGKIRXLLEGPVEDDWELNJIMKUMHSLHHKGCIDWTKDDVSYEHREVRFMQWEKHFJBDVHVSEYOBEKXJDAAIOUSNROVNRGIVIMHJVSBLPVNRXFAUMKGIATWJKZDXEFRSSCVNVYOUEQFBIIGVHFLCRFJGDWDYMDMEVBKMUQESWJVKZINDTHLSXOKHFEERLBRRRMFBADQNKERQJKGNPEVNDQLRMLIVEDRMOXTDMOCIDHERBDMERSGEUVIMIXLNCISJALIHVWZPUXELIMFDDMEVNRGIZFEISZMJPFZNDRTTHHJGVEQKSVIEXFJMHXXZLCINNEGISJCGEVKNHGIKDHIGVLRIOIIEJFVRRGIRUSRVIHHRBLFHREZEGSFYIBLHCATFFUIDAFCLDRWVRRGICIMKFEALIOUERGIZFEISLNCOBYNTREUARLBKMHXJYRDQTZNFIOUIDPPIEKIZXESEO" />
    </div>

      <WeiterButton to="/level3/onetimepad" />
    </div>
  );
}

