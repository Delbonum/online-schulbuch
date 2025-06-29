import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useLevelGuard from "../components/LevelGuard";
import { useProgressUpdater, useAuth } from "../../auth/AuthContext";

const klartextAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const geheimtextAlphabet = "MNBVCXZLKJHGFDSAPOIUYTREWQ".split("");

const initialQuestions = [
  {
    question: "Welcher Geheimtext ergibt sich, wenn man den Klartext 'HAB DANK MEISTER ALKINDI' mit dem Schlüssel 'MNBVCXZLKJHGFDSAPOIUYTREWQ' verschlüsselt?",
    answer: "LMN VMDH FCKIUCO MGHKDVK",
    type: "input"
  },
  {
    question: "Welcher Klartext ergibt sich, wenn man mit dem gleichen Schlüssel den Geheimtext 'ZOMDVKSI' entschlüsselt?",
    answer: "GRANDIOS",
    type: "input"
  },
  {
    question: "Was bedeutet \"monoalphabetisch\" im Zusammenhang mit Chiffren?",
    options: [
      "Der Schlüssel ist ein einzelnes Zeichen",
      "Jedes Zeichen wird immer mit demselben Zeichen chiffriert",
      "Es wird mit mehreren Alphabeten gleichzeitig verschlüsselt",
      "Buchstaben werden beliebig vertauscht"
    ],
    answer: 1
  },
  {
    question: "Was versteht man unter einem Brute-Force-Angriff in der Kryptoanalyse?",
    options: [
      "Ein Angriff mit physischer Gewalt",
      "Ein automatisiertes Durchprobieren aller möglichen Schlüssel",
      "Das Überschreiben von Nachrichten",
      "Eine spezielle Entschlüsselung durch Experten"
    ],
    answer: 1
  },
  {
    question: "Was trifft auf die Häufigkeitsanalyse zu?",
    options: [
      "Sie funktioniert nur bei Zahlen",
      "Sie ist bei monoalphabetischen Verfahren hilfreich",
      "Sie basiert auf der Häufigkeit von Buchstaben im Text",
      "Sie ist immer erfolgreich"
    ],
    answer: [1, 2]
  },
  {
    question: "Welche Aussage ist falsch?",
    options: [
      "Beim Ersetzungsverfahren gibt es mehr mögliche Schlüssel als beim Verschiebeverfahren",
      "Das Ersetzungsverfahren ist schwerer zu knacken als das Caesar-Verfahren",
      "Je kürzer der Text, desto einfacher ist die Häufigkeitsanalyse",
      "Beim Dechiffrieren mit dem Ersetzungsverfahren wird jeder Buchstabe so zurückversetzt, wie er beim Chiffrieren ersetzt wurde"
    ],
    answer: 2
  }
];

export default function QuizLevel2() {
  useLevelGuard("level1Passed");
  const { user } = useAuth();
  const updateProgress = useProgressUpdater();

  const [answers, setAnswers] = useState(Array(initialQuestions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSelect = (questionIndex, value) => {
    const updated = [...answers];
    updated[questionIndex] = value;
    setAnswers(updated);
    setSubmitted(false);
  };

  const equalsIgnoringSpaces = (input, expected) =>
    input?.toUpperCase().replace(/\s+/g, '') === expected.toUpperCase().replace(/\s+/g, '');

  const allCorrect = answers.every((a, i) => {
    const q = initialQuestions[i];
    if (q.type === "input") {
      return typeof a === "string" && equalsIgnoringSpaces(a, q.answer)
    }
    if (Array.isArray(q.answer)) {
      return Array.isArray(a) && q.answer.every(ans => a.includes(ans)) && a.length === q.answer.length;
    }
    return a === q.answer;
  });

  const isMultiCorrect = (user, correct) =>
  Array.isArray(user) &&
  user.length === correct.length &&
  correct.every((val) => user.includes(val));

  const details = initialQuestions.map((q, i) => {
  const a = answers[i];
  const correct =
    q.type === "input"
      ? typeof a === "string" && equalsIgnoringSpaces(a, q.answer)
      : Array.isArray(q.answer)
        ? isMultiCorrect(a, q.answer)
        : a === q.answer;

      return {
        task: i + 1,
        correct,
        answer: a
      };
    });

    const handleSubmit = async () => {
      setSubmitted(true);

      const correctCount = answers.reduce((count, a, i) => {
        const q = initialQuestions[i];
        const correct =
          q.type === "input"
            ? typeof a === "string" && equalsIgnoringSpaces(a, q.answer)
            : Array.isArray(q.answer)
              ? isMultiCorrect(a, q.answer)
              : a === q.answer;
        return correct ? count + 1 : count;
      }, 0);

      const score = Math.round((correctCount / initialQuestions.length) * 100);

      // Prüfungsverlauf speichern
      if (user?.role === "student") {
        await fetch(`http://localhost:3001/progress/${user.username}/recordAttempt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ levelKey: "level2Passed", score, details })
        });
      }

      // Fortschritt speichern & weiterleiten bei Erfolg
      if (score === 100) {
        updateProgress("level2Passed");
        setTimeout(() => navigate("/level2/abschluss"), 1000);
      }
    };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 heading-style">Zwischenprüfung</h1>

      <div className="mb-6 text-style">
        <p className="font-semibold mb-2">Schlüsselalphabet:</p>
        <table className="table-auto border border-white mb-4">
          <thead>
            <tr>
              {klartextAlphabet.map((char, i) => (
                <th key={i} className="border px-2 py-1">{char}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {geheimtextAlphabet.map((char, i) => (
                <td key={i} className="border px-2 py-1">{char}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {initialQuestions.map((q, index) => (
        <div key={index} className="mb-6">
          <p className="mb-2 text-style"><span className="font-bold">{index + 1}. </span>{q.question.replace(/^\d+\.\s*/, '')}</p>

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
                  type={Array.isArray(q.answer) ? "checkbox" : "radio"}
                  name={`question-${index}`}
                  value={i}
                  checked={Array.isArray(q.answer) ? answers[index]?.includes(i) : answers[index] === i}
                  onChange={(e) => {
                    if (Array.isArray(q.answer)) {
                      const newAnswers = answers[index] ? [...answers[index]] : [];
                      if (e.target.checked) {
                        newAnswers.push(i);
                      } else {
                        const pos = newAnswers.indexOf(i);
                        if (pos !== -1) newAnswers.splice(pos, 1);
                      }
                      handleSelect(index, newAnswers);
                    } else {
                      handleSelect(index, i);
                    }
                  }}
                  className="mr-2"
                />
                {option}
              </label>
            ))
          )}

          {submitted && q.type !== "input" && !Array.isArray(q.answer) && (
            <p className={answers[index] === q.answer ? "text-green-500" : "text-red-500"}>
              {answers[index] === q.answer ? "Richtig!" : "Falsch."}
            </p>
          )}

          {submitted && Array.isArray(q.answer) && (
              <p className={isMultiCorrect(answers[index], q.answer) ? "text-green-500" : "text-red-500"}>
                {isMultiCorrect(answers[index], q.answer) ? "Richtig!" : "Falsch."}
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
