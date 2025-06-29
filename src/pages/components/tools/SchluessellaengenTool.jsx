import { useState, useEffect } from "react";

export default function SchluessellaengenTool() {
  const [geheimtext, setGeheimtext] = useState("HGINEHWTEIBLUNARWPCLDWCVDDYUVNCETJIBLTFTQEVIIFFJEEHRNREQGIVNZYTLRZPUVNYIJKEMHBJKNQNKMHVOZCGXBLSCINJIMREZEKYGKIRXLLEGPVEDDWELNJIMKUMHSLHHKGCIDWTKDDVSYEHREVRFMQWEKHFJBDVHVSEYOBEKXJDAAIOUSNROVNRGIVIMHJVSBLPVNRXFAUMKGIATWJKZDXEFRSSCVNVYOUEQFBIIGVHFLCRFJGDWDYMDMEVBKMUQESWJVKZINDTHLSXOKHFEERLBRRRMFBADQNKERQJKGNPEVNDQLRMLIVEDRMOXTDMOCIDHERBDMERSGEUVIMIXLNCISJALIHVWZPUXELIMFDDMEVNRGIZFEISZMJPFZNDRTTHHJGVEQKSVIEXFJMHXXZLCINNEGISJCGEVKNHGIKDHIGVLRIOIIEJFVRRGIRUSRVIHHRBLFHREZEGSFYIBLHCATFFUIDAFCLDRWVRRGICIMKFEALIOUERGIZFEISLNCOBYNTREUARLBKMHXJYRDQTZNFIOUIDPPIEKIZXESEO");
  const [laenge, setLaenge] = useState(6);
  const [analyse, setAnalyse] = useState([]);

  const findeTrigramme = () => {
    const ergebnisse = [];
    const trigrammMap = {};

    for (let i = 0; i < geheimtext.length - 2; i++) {
      const trigramm = geheimtext.substring(i, i + 3);
      if (trigrammMap[trigramm]) {
        trigrammMap[trigramm].push(i);
      } else {
        trigrammMap[trigramm] = [i];
      }
    }

    Object.entries(trigrammMap).forEach(([trigramm, positionen]) => {
      if (positionen.length >= 2) {
        for (let i = 0; i < positionen.length - 1; i++) {
          const pos1 = positionen[i];
          const pos2 = positionen[i + 1];
          const abstand = pos2 - pos1;
          ergebnisse.push({
            trigramm,
            pos1,
            pos2,
            abstand,
            passend: abstand % laenge === 0,
          });
        }
      }
    });

    setAnalyse(ergebnisse);
  };

  useEffect(() => {
    findeTrigramme();
  }, [laenge]);

  return (
    <div>
      <div className="mb-4">
        <label className="block font-semibold mb-1 text-white">Geheimtext:</label>
        <textarea
          rows={5}
          className="w-full p-2 rounded bg-black/20 text-white"
          value={geheimtext}
          onChange={(e) => setGeheimtext(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
        />
      </div>
      <div className="mb-4 flex items-center gap-4">
        <label className="font-semibold text-white">Zu prüfende Schlüssellänge:</label>
        <input
          type="number"
          className="w-16 p-1 rounded bg-black/20 text-white"
          value={laenge}
          onChange={(e) => setLaenge(parseInt(e.target.value) || 1)}
        />
        <button
          className="ml-4 px-4 py-1 bg-white/20 text-white rounded hover:bg-white/30"
          onClick={findeTrigramme}
        >
          Abstände ermitteln
        </button>
      </div>
      <div className="overflow-auto max-h-64 bg-white/10 rounded p-2 text-sm">
        <table className="w-full text-white">
          <thead>
            <tr className="text-left">
              <th className="pr-4">Trigramm</th>
              <th className="pr-4">1. Position</th>
              <th className="pr-4">2. Position</th>
              <th className="pr-4">Abstand</th>
              <th className="pr-4">passt zu Schlüssellänge {laenge}</th>
            </tr>
          </thead>
          <tbody>
            {analyse.map((eintrag, i) => (
              <tr key={i} className={eintrag.passend ? "text-green-400" : "text-red-400"}>
                <td className="pr-4">{eintrag.trigramm}</td>
                <td className="pr-4">{eintrag.pos1}</td>
                <td className="pr-4">{eintrag.pos2}</td>
                <td className="pr-4">{eintrag.abstand}</td>
                <td className="pr-4">{eintrag.passend ? "✓" : "✗"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-white">
        {analyse.filter(e => e.passend).length} passende Paare / {analyse.filter(e => !e.passend).length} nicht passend
      </p>
    </div>
  );
}
