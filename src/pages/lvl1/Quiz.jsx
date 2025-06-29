import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProgressUpdater, useAuth } from "../../auth/AuthContext";

const initialQuestions = [
  {
    question: "Welcher Geheimtext ergibt sich, wenn man den Klartext \"SCHLACHT VERLOREN\" mit dem Schlüssel 'D' verschlüsselt?",
    answer: "VFKODFKW YHUORUHQ",
    type: "input"
  },
  {
    question: "Was macht das Caesar-Verschiebeverfahren?",
    options: [
      "Ersetzt jeden Buchstaben durch ein zufälliges Symbol",
      "Vertauscht Buchstaben in zufälliger Reihenfolge",
      "Verschiebt Buchstaben um eine feste Anzahl im Alphabet",
      "Komprimiert Text auf binäre Zahlen"
    ],
    answer: 2
  },
  {
    question: "Welche Eigenschaft hat der Schlüssel beim Caesar-Verfahren?",
    options: [
      "Er muss eine Primzahl sein",
      "Er besteht aus einem Buchstaben",
      "Er ist ein Passwort mit mindestens 8 Zeichen",
      "Er ergibt die Anzahl der Buchstaben im Text"
    ],
    answer: 1
  },
  {
    question: "Wie kann man eine Caesar-Verschlüsselung wieder entschlüsseln?",
    options: [
      "Durch Spiegelung der Buchstaben",
      "Durch Addition des Schlüssels",
      "Durch Rückverschiebung (negative Verschiebezahl) bzw. positive Verschiebung um (26 - Verschiebezahl) mod 26",
      "Gar nicht – sie ist nicht entschlüsselbar"
    ],
    answer: 2
  },
  {
    question: "Welchen Zusammenhang gibt es zwischen Verschiebezahl und Schlüssel?",
    options: [
      "Verschiebt man den Buchstaben 'A' um die Verschiebezahl, erhält man den Schlüssel",
      "Der Schlüssel und die Verschiebezahl sind identisch",
      "Die Verschiebezahl ergibt sich aus dem Inversen der Schlüsselstelle im Alphabet",
      "Es gibt keinen Zusammenhang, da der Schlüssel zufällig ist"
    ],
    answer: 0
  },
  {
    question: "Welche Aussage ist falsch?",
    options: [
      "Wenn man den Schlüssel 'A' verwendet, sind Klartext und Geheimtext identisch",
      "Betrachtet man den Index des Schlüssels im Alphabet, ergibt sich die Verschiebezahl",
      "Caesar hat das Verschiebeverfahren in der Regel mit dem Schlüssel 'D' verwendet",
      "Bei einer Verschiebung über die Alphabetgrenzen hinaus, wird wieder in die andere Richtung verschoben"
    ],
    answer: 3
  }
];

export default function QuizLevel1() {
  const { user } = useAuth();
  const updateProgress = useProgressUpdater();

  const [answers, setAnswers] = useState(Array(initialQuestions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSelect = (questionIndex, value) => {
  const updated = [...answers];
  updated[questionIndex] = value;
  setAnswers(updated);
  setSubmitted(false); // Feedback zurücksetzen, wenn eine Antwort geändert wird
};

  const equalsIgnoringSpaces = (input, expected) =>
    input?.toUpperCase().replace(/\s+/g, '') === expected.toUpperCase().replace(/\s+/g, '');

  const allCorrect = answers.every((a, i) => {
    const q = initialQuestions[i];
    if (q.type === "input") {
      return typeof a === "string" && equalsIgnoringSpaces(a, q.answer)
    }
    return a === q.answer;
  });

    const details = initialQuestions.map((q, i) => {
      const a = answers[i];
      const correct = q.type === "input"
        ? typeof a === "string" && equalsIgnoringSpaces(a, q.answer)
        : a === q.answer;

      return {
        task: i + 1,
        correct,
        answer: a
      };
    });

  const handleSubmit = async () => {
      setSubmitted(true);

      // Berechne Score in Prozent
      const correctCount = answers.reduce((count, a, i) => {
        const q = initialQuestions[i];
        const correct = q.type === "input"
          ? typeof a === "string" && equalsIgnoringSpaces(a, q.answer)
          : a === q.answer;
        return correct ? count + 1 : count;
      }, 0);

      const score = Math.round((correctCount / initialQuestions.length) * 100);

      // Verlaufsaufzeichnung (nur wenn Schüler)
      if (user?.role === "student") {
        await fetch(`http://localhost:3001/progress/${user.username}/recordAttempt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            levelKey: "level1Passed",
            score,
            details
          })
        });
      }

      // Wenn bestanden → Fortschritt setzen + weiterleiten
      if (score === 100) {
        updateProgress("level1Passed");
        setTimeout(() => navigate("/level1/abschluss"), 1000);
      }
    };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 heading-style">Zwischenprüfung</h1>

      {initialQuestions.map((q, index) => (
        <div key={index} className="mb-6">
          <p className="mb-2 text-style"><span className="font-bold">{index + 1}. </span>{q.question.replace(/^\d+\.\s*/, '')}
          </p>

          {q.type === "input" ? (
            <>
              <input
                type="text"
                value={answers[index] || ""}
                onChange={(e) => handleSelect(index, e.target.value)}
                className="input-style w-full"
              />
              {submitted && (
                <p className={
                  equalsIgnoringSpaces(answers[index], q.answer)
                    ? "text-green-500"
                    : "text-red-500"
                }>
                  {equalsIgnoringSpaces(answers[index], q.answer)
                    ? "Richtig!"
                    : "Falsch."}
                </p>
              )}
            </>
          ) : (
            q.options.map((option, i) => (
              <label key={i} className="block text-style">
                <input
                  type="radio"
                  name={`question-${index}`}
                  value={i}
                  checked={answers[index] === i}
                  onChange={() => handleSelect(index, i)}
                  className="mr-2"
                />
                {option}
              </label>
            ))
          )}
          {submitted && q.type !== "input" && (
            <p className={
              answers[index] === q.answer ? "text-green-500" : "text-red-500"
            }>
              {answers[index] === q.answer ? "Richtig!" : "Falsch."}
            </p>
          )}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="mt-4 px-4 py-2 border border-white text-white rounded hover:bg-white hover:text-black transition"
      >
        Prüfung abschließen
      </button>

      {submitted && allCorrect && (
        <p className="text-green-500 font-bold mt-4 text-style">
          Richtig! Alle Antworten korrekt.
        </p>
      )}
    </div>
  );
}
