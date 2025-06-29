import React from "react";
import WeiterButton from "../components/WeiterButton";
import useLevelGuard from "../components/LevelGuard";
import alKindiImage from "../../img/alkindi.png";

export default function Chiffrieren() {
  useLevelGuard("level1Passed");

  const klartext = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const geheimtext = "QWERTZUIOPASDFGHJKLYXCVBNM".split("");

  return (
    <>
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 text-style">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-4 heading-style">Al-Kindi erklärt das Ersetzungsverfahren</h1>
          <p className="mb-4">
            <i>"Sieh her, Fremder"</i>, sagt Al-Kindi zu dir, nachdem du dich vorgestellt und dein Anliegen erläutert hast.
            <i>"Das Ersetzungsverfahren ist eine mächtige Methode der Verschlüsselung. Es ersetzt jeden Buchstaben durch einen anderen, basierend auf einem geheimen Schlüsselalphabet."</i>
          </p>
          <p className="mb-4">
            <i>"Während das Caesar-Verfahren einfach nur Buchstaben verschiebt, ersetzt das Ersetzungsverfahren jeden Buchstaben durch einen anderen – und das nicht mehr mit einem festen Abstand, sondern ganz nach einem geheimen Schlüsselalphabet.
            Der Schlüssel ist damit auch nicht mehr nur ein einzelner Buchstabe, sondern ein ganzes Alphabet, das die Zuordnung der Buchstaben bestimmt.
            Es sind also auch viel mehr mögliche Schlüssel denkbar, als beim Caesar-Verfahren - nämlich alle Permutationen des Alphabets. Das macht 26 Fakultät, ergibt ... Undenkbar viele! Über 400 Trilliarden!
            Beim Verschiebeverfahren sind nur 26 verschiedene Schlüssel möglich, selbst wenn wir die Verschiebezahl 0 miteinbeziehen."</i>
          </p>
          <p className="mb-4">
              <i>"Lass mich ein Beispiel geben."</i> Al-Kindi nimmt ein Blatt Papier und schreibt auf...
          </p>
        </div>

        <div className="flex-shrink-0 w-full md:w-1/3">
          <img
            src={alKindiImage}
            alt="Al-Kindi erklärt"
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      <div className="overflow-x-auto mt-8 text-style">
        <h2 className="text-xl font-bold mb-2 heading-style">Klartext- und Geheimtextalphabet</h2>
        <table className="table-auto border border-white mb-4">
          <thead>
            <tr>
              {klartext.map((char, i) => (
                <th key={i} className="border px-2 py-1">{char}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {geheimtext.map((char, i) => (
                <td key={i} className="border px-2 py-1">{char}</td>
              ))}
            </tr>
          </tbody>
        </table>

        <p className="mb-6">
          <i>
            „Nimm das Wort <b>VERTRAUEN</b>. Mit unserem Alphabet ergibt sich: <br />
            <b>V → C</b>, <b>E → T</b>, <b>R → G</b>, <b>T → B</b>, <b>R → G</b>, <b>A → Q</b>, <b>U → L</b>, <b>E → T</b>, <b>N → H</b>. <br />
            Geheimtext: <strong className="text-white font-bold">CTGBGQLTH</strong>“
          </i>
        </p>
      </div>

      <WeiterButton to="/level2/dechiffrieren" />
    </>
  );
}
