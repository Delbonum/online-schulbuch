const KasiskiTable = () => {
  const schluessel = "WOINWOINWOINWOINWOINWOINWOINWOINWO".split("");
  const klartext = "HABEEINENKLEINENESELIMSTALLGESEHEN".split("");
  const geheimtext = "DOJRAWVRJYTREBMAAGMYEAAGWZTTAGMUAB".split("");

  // Helfer zum Markieren bestimmter Indexbereiche
  const gruenDopplungen = [
    [16, 18], // ESE (1.Vorkommen)
    [28, 30]  // ESE (2. Vorkommen)
  ];

  const blauKlartext = [
    [4, 6],  // EIN (1. Vorkommen)
    [11, 13] // EIN (2. Vorkommen)
  ];

  const hellblauSchluesselGeheimtext = [
    [4, 6],  // EIN (1. Vorkommen)
    [11, 13] // EIN (2. Vorkommen)
  ];

  const rotGeheimtext = [
    [15, 17], // AAG (1. Vorkommen)
    [21, 23] // AAG (2. Vorkommen)
  ];

    const getCellStyle = (row, idx) => {
      let styles = [];

      // Grün für echte Dopplungen
      if (["schluessel", "klartext", "geheimtext"].includes(row)) {
        for (let [start, end] of gruenDopplungen) {
          if (idx >= start && idx <= end) styles.push("bg-green-600", "text-white", "font-bold");
        }
      }

      // Blau für nicht übereinstimmende Klartext-Dopplung
      if (row === "klartext") {
        for (let [start, end] of blauKlartext) {
          if (idx >= start && idx <= end) styles.push("bg-blue-500", "text-white", "font-bold");
        }
      }

      // Hellblau für entsprechende Schlüssel-/Geheimtextzellen
      if (["schluessel", "geheimtext"].includes(row)) {
        for (let [start, end] of hellblauSchluesselGeheimtext) {
          if (idx >= start && idx <= end) styles.push("bg-blue-300", "text-black", "font-bold");
        }
      }

      // Roter Rahmen für zufällige Geheimtext-Dopplung
      if (row === "geheimtext") {
        for (let [start, end] of rotGeheimtext) {
          if (idx === start) styles.push("border-l-2", "border-t-2", "border-b-2", "border-red-400", "text-white", "font-bold");
          else if (idx === end) styles.push("border-r-2", "border-t-2", "border-b-2", "border-red-400", "text-white", "font-bold");
          else if (idx > start && idx < end) styles.push("border-t-2", "border-b-2", "border-red-400", "text-white", "font-bold");
        }
      }

      return styles.join(" ");
    };

  const renderRow = (label, data, rowKey) => (
    <tr>
      <td className="font-semibold pr-2 text-right whitespace-nowrap">{label}</td>
      {data.map((char, idx) => (
        <td
          key={idx}
          className={`w-6 h-6 text-center ${getCellStyle(rowKey, idx)}`}
        >
          {char}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="overflow-x-auto max-w-full">
      <table className="table-fixed text-sm">
        <tbody>
          {renderRow("Schlüssel", schluessel, "schluessel")}
          {renderRow("Klartext", klartext, "klartext")}
          {renderRow("", Array(schluessel.length).fill(""), "leer")}
          {renderRow("Geheimtext", geheimtext, "geheimtext")}
        </tbody>
      </table>
    </div>
  );
};

export default KasiskiTable;
