import { ALPHABET } from "../lib/crypto";
import ScrollArea from "./ScrollArea";

/** Klartextalphabet über einem Geheimtextalphabet. */
export default function AlphabetTable({
  cipher,
  plain = ALPHABET,
  plainLabel = "Klartext",
  cipherLabel = "Geheimtext",
}) {
  return (
    <ScrollArea>
      <table className="table-auto border border-white text-center">
        <tbody>
          <tr>
            <th scope="row" className="border px-2 py-1 text-left font-semibold whitespace-nowrap">
              {plainLabel}
            </th>
            {[...plain].map((char, i) => (
              <td key={i} className="border px-2 py-1 font-semibold">
                {char}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row" className="border px-2 py-1 text-left font-semibold whitespace-nowrap">
              {cipherLabel}
            </th>
            {[...cipher].map((char, i) => (
              <td key={i} className="border px-2 py-1">
                {char}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </ScrollArea>
  );
}
