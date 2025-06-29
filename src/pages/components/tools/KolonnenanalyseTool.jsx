import React, { useState } from "react";

const haeufigsterBuchstabe = (text) => {
  const zaehler = {};
  for (const buchstabe of text) {
    if (/[A-Z]/.test(buchstabe)) {
      zaehler[buchstabe] = (zaehler[buchstabe] || 0) + 1;
    }
  }
  let maxBuchstabe = "";
  let maxAnzahl = 0;
  for (const [buchstabe, anzahl] of Object.entries(zaehler)) {
    if (anzahl > maxAnzahl) {
      maxBuchstabe = buchstabe;
      maxAnzahl = anzahl;
    }
  }
  return maxBuchstabe;
};

export default function KolonnenanalyseTool() {
  const [geheimtext, setGeheimtext] = useState(
    "HGINEHWTEIBLUNARWPCLDWCVDDYUVNCETJIBLTFTQEVIIFFJEEHRNREQGIVNZYTLRZPUVNYIJKEMHBJKNQNKMHVOZCGXBLSCINJIMREZEKYGKIRXLLEGPVEDDWELNJIMKUMHSLHHKGCIDWTKDDVSYEHREVRFMQWEKHFJBDVHVSEYOBEKXJDAAIOUSNROVNRGIVIMHJVSBLPVNRXFAUMKGIATWJKZDXEFRSSCVNVYOUEQFBIIGVHFLCRFJGDWDYMDMEVBKMUQESWJVKZINDTHLSXOKHFEERLBRRRMFBADQNKERQJKGNPEVNDQLRMLIVEDRMOXTDMOCIDHERBDMERSGEUVIMIXLNCISJALIHVWZPUXELIMFDDMEVNRGIZFEISZMJPFZNDRTTHHJGVEQKSVIEXFJMHXXZLCINNEGISJCGEVKNHGIKDHIGVLRIOIIEJFVRRGIRUSRVIHHRBLFHREZEGSFYIBLHCATFFUIDAFCLDRWVRRGICIMKFEALIOUERGIZFEISLNCOBYNTREUARLBKMHXJYRDQTZNFIOUIDPPIEKIZXESEO"
  );
  const [laenge, setLaenge] = useState(6);
  const [haeufigste, setHaeufigste] = useState([]);

  const analysieren = () => {
    const kolonnen = Array.from({ length: laenge }, () => "");
    for (let i = 0; i < geheimtext.length; i++) {
      kolonnen[i % laenge] += geheimtext[i];
    }
    setHaeufigste(kolonnen.map(kol => haeufigsterBuchstabe(kol)));
  };

  return (
    <div className="text-sm space-y-4">
      <div>
        <label className="block mb-1">Geheimtext:</label>
        <textarea
          className="w-full p-2 rounded bg-white/10 text-white"
          value={geheimtext}
          rows={4}
          onChange={(e) => setGeheimtext(e.target.value.toUpperCase())}
        />
      </div>
      <div className="flex items-center space-x-4">
        <label>Schlüssellänge:</label>
        <input
          type="number"
          className="w-16 p-1 rounded bg-white/10 text-white"
          value={laenge}
          onChange={(e) => setLaenge(Number(e.target.value))}
          min={1}
          max={geheimtext.length}
        />
        <button
          onClick={analysieren}
          className="px-3 py-1 border border-white rounded hover:bg-white/10"
        >
          Buchstaben zählen
        </button>
      </div>
      {haeufigste.length > 0 && (
        <div className="mt-4">
          <div className="font-bold mb-1">Häufigste Buchstaben pro Kolonne:</div>
          <div className="flex flex-wrap space-x-3">
            {haeufigste.map((b, i) => (
              <div key={i} className="text-white">
                Kolonne {i + 1}: <span className="font-bold">{b}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
