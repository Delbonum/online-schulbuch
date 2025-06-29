import React from "react";

export default function ClusterTable() {
  const zeilen = [
    { label: "Schlüssel", content: "ZEITZEITZEITZEITZEIT" },
    { label: "Klartext", content: "W...I...R...V...N..." },
    { label: "", content: ".I...C...I...I...E.." },
    { label: "", content: "..E...H...S...G...R." },
    { label: "", content: "...S...E...T...E...E" },
  ];

  const geheimtextZeile = {
    label: "Geheimtext",
    content: "VMMLHGPXQMAMUMOXMIZX",
  };

  const clusterSpalte = ["Cluster", "Z", "E", "I", "T", ""];

  return (
    <div className="overflow-x-auto mb-8">
      <table className="table-fixed border-collapse mx-auto text-center [&_td]:min-w-[1.75rem]">
        <tbody>
          {zeilen.map((zeile, idx) => (
            <tr key={idx}>
              <td className="font-semibold pr-4 text-right">{zeile.label}</td>
              {zeile.content.split("").map((char, i) => (
                <td key={i}>{char === "." ? "" : char}</td>
              ))}
              <td className="pl-6 font-bold text-white">
                {clusterSpalte[idx] || ""}
              </td>
            </tr>
          ))}
          <tr>
            <td></td>
            {Array(geheimtextZeile.content.length)
              .fill("|")
              .map((_, i) => (
                <td key={i}>|</td>
              ))}
            <td></td>
          </tr>
          <tr>
            <td className="font-semibold pr-4 text-right">
              {geheimtextZeile.label}
            </td>
            {geheimtextZeile.content.split("").map((char, i) => (
              <td key={i}>{char}</td>
            ))}
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
