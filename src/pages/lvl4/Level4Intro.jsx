import React from "react";
import useLevelGuard from "../components/LevelGuard";

export default function Level4Intro() {
  useLevelGuard("level3Passed");

   return (
       <>
    <div className="flex flex-col md:flex-row items-start justify-between gap-6 text-style">
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-4 heading-style">Die Reise geht (hoffentlich bald) weiter...</h1>
        <p className="mb-4">
          Lieber Zeitreisender, <br></br>
          komm bald hierher zurück. Dein Zeitreise-Team hat im Moment viel zu tun, wird dir aber an dieser Stelle bald den nächsten Auftrag hinterlegen.
        </p>
      </div>
      </div>
    </>
  );
}
