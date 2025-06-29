import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import useLevelGuard from "../components/LevelGuard";
import { useProgressUpdater, useAuth } from "../../auth/AuthContext";

const initialQuestions = [
  {
    question: "Welcher Klartext ergibt sich, wenn man den Geheimtext 'BCZIEIZWZ' mit dem Schlüsselwort 'VIGENERE' entschlüsselt?",
    answer: "GUTEREISE",
    type: "input"
  },
  {
    question: "Welchen Schlüssel hast du mithilfe des Kasiski-Tests zu dem vorgegebenen Geheimtext ermittelt?",
    answer: "ZEBRA",
    type: "input"
  },
  {
    question: "Welchen Schlüssel muss man beim Vigenère-Verfahren wählen, um eine progressive Verschiebung zu erhalten, die beim ersten Buchstaben mit der Verschiebezahl 0 startet und jeden Folgebuchstaben um eins mehr verschiebt?",
    answer: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    type: "input"
  },
  {
    question: "Welche der folgenden Aussagen treffen auf das Vigenère-Verfahren zu?",
    options: [
      "Es wird für jeden Buchstaben des Klartexts genau ein Schlüsselbuchstabe verwendet.",
      "Es handelt sich um ein polyalphabetisches Verfahren.",
      "Nutzt man das Verfahren mit einem Schlüssel, der nur aus einem Buchstaben 'A' besteht, so unterscheidet sich das Ergebnis nicht von dem einfachen Verschiebeverfahren.",
      "Bei längeren Schlüsseln kann das Verfahren mit der Tabula Recta, aber nicht mit einer Chiffrierscheibe entschlüsselt werden.",
      "Das Verfahren kann durch eine Häufigkeitsanalyse geknackt werden."
    ],
    answer: [0, 1, 2, 4]
  },
  {
    question: "Welche der folgenden Aussagen treffen auf das One-Time-Pad zu?",
    options: [
      "Das One-Time-Pad ist absolut sicher und unknackbar.",
      "Die Schlüsselbuchstaben dürfen nur ein einziges Mal verwendet werden.",
      "Das Vorgehen beim Ver- und Entschlüsseln unterscheidet sich nicht vom Vigenère-Verfahren.",
      "Beim One-Time-Pad werden vor allem sehr kurze Schlüsselworte verwendet.",
      "Die Schlüsselübertragung ist beim One-Time-Pad kein Problem, da der Schlüssel innerhalb der verschlüsselten Nachricht mitgeschickt werden kann.",
      "Verschiedene Buchstaben im Klartext können mit dem gleichen Buchstaben verschlüsselt werden."
    ],
    answer: [0, 2, 5]
  }
];

const dragDropQuestion = {
  question: "Ordne die Schritte beim Vorgehen der Kryptoanalyse (inkl. Kasiski-Test) in der richtigen Reihenfolge an:",
  steps: [
    "Häufigkeit gleicher Textabschnitte untersuchen",
    "Abstände zwischen gleichen Abschnitten bestimmen",
    "Teiler der Abstände berechnen",
    "Länge des Schlüsselwortes ermitteln",
    "Häufigkeitsanalyse in Kolonnen durchführen",
    "Schlüssel ermitteln",
    "Geheimtext entschlüsseln"
  ]
};

export default function QuizLevel3() {
  useLevelGuard("level2Passed");
  const { user } = useAuth();
  const updateProgress = useProgressUpdater();

  const [answers, setAnswers] = useState({});
  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
  const [stepOrder, setStepOrder] = useState(shuffle(dragDropQuestion.steps));
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleChange = (question, value) => {
    setAnswers({ ...answers, [question]: value });
    setSubmitted(false);
  };

  const handleMultiChange = (question, value) => {
    const current = answers[question] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setAnswers({ ...answers, [question]: updated });
    setSubmitted(false);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newOrder = [...stepOrder];
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    setStepOrder(newOrder);
    setSubmitted(false);
  };

  const isCorrect = (question, correctAnswer) => {
    const userAnswer = answers[question];
    if (Array.isArray(correctAnswer)) {
      return (
        Array.isArray(userAnswer) &&
        userAnswer.length === correctAnswer.length &&
        correctAnswer.every((ans) => userAnswer.includes(ans)) && userAnswer.every((ans) => correctAnswer.includes(ans))
      );
    }
    return userAnswer?.toUpperCase().replace(/\s+/g, '') === correctAnswer.toUpperCase().replace(/\s+/g, '');
  };

  const isStepOrderCorrect = () =>
    stepOrder.every((step, i) => step === dragDropQuestion.steps[i]);

  const details = [];

    initialQuestions.forEach((q, index) => {
      const taskNumber = index + 1;
      const a = answers[taskNumber];
      const correct = isCorrect(taskNumber, q.answer);
      details.push({
        task: taskNumber,
        correct,
        answer: a
      });
    });

    // Drag & Drop Aufgabe als letzte:
    details.push({
      task: 6,
      correct: isStepOrderCorrect(),
      answer: stepOrder
    });

  const handleSubmit = async () => {
      setAnswers({ ...answers, 6: stepOrder });
      setSubmitted(true);

      const total = initialQuestions.length + 1;
      let correct = 0;

      if (isStepOrderCorrect()) correct++;
      initialQuestions.forEach((q, index) => {
        if (isCorrect(index + 1, q.answer)) correct++;
      });

      const score = Math.round((correct / total) * 100);

      // Verlauf speichern
      if (user?.role === "student") {
        await fetch(`http://localhost:3001/progress/${user.username}/recordAttempt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ levelKey: "level3Passed", score, details })
        });
      }

      // Fortschritt speichern & weiterleiten bei 100 %
      if (score === 100) {
        updateProgress("level3Passed");
        setTimeout(() => navigate("/level3/abschluss"), 1000);
      }
    };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 heading-style">Zwischenprüfung</h1>

      {initialQuestions.map((q, index) => (
        <div key={index} className="mb-6">
          <p className="mb-2 text-style">
            <span className="font-bold">{index + 1}. </span>
            {q.question}
          </p>

          {q.type === "input" ? (
            <>
              <input
                type="text"
                className="w-full p-2 rounded bg-white/10"
                onChange={(e) => handleChange(index + 1, e.target.value)}
              />
              {submitted && (
                <p className={isCorrect(index + 1, q.answer) ? "text-green-500" : "text-red-500"}>
                  {isCorrect(index + 1, q.answer) ? "Richtig!" : "Falsch."}
                </p>
              )}
            </>
          ) : (
            q.options.map((option, i) => (
              <label key={i} className="block">
                <input
                  type="checkbox"
                  checked={answers[index + 1]?.includes(i) || false}
                  onChange={() => handleMultiChange(index + 1, i)}
                /> {option}
              </label>
            ))
          )}
          {submitted && q.options && (
            <p className={isCorrect(index + 1, q.answer) ? "text-green-500" : "text-red-500"}>
              {isCorrect(index + 1, q.answer) ? "Richtig!" : "Falsch."}
            </p>
          )}
        </div>
      ))}

      <div className="mb-6">
        <p className="mb-2 text-style">
          <span className="font-bold">6. </span>{dragDropQuestion.question}</p>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="kasiski">
            {(provided) => (
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="bg-white/10 p-2 rounded space-y-2"
              >
                {stepOrder.map((step, index) => (
                  <Draggable key={step} draggableId={step} index={index}>
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-white/20 p-2 rounded cursor-move"
                      >
                        {step}
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
        {submitted && (
          <p className={isStepOrderCorrect() ? "text-green-500" : "text-red-500"}>
            {isStepOrderCorrect() ? "Richtig!" : "Falsch."}
          </p>
        )}
      </div>

      <button
        onClick={handleSubmit}
        className="mt-4 px-4 py-2 border border-white text-white rounded hover:bg-white hover:text-black transition"
      >
        Prüfung abschließen
      </button>

      {submitted && initialQuestions.every((q, index) => isCorrect(index + 1, q.answer)) && isStepOrderCorrect() && (
        <p className="text-green-500 font-bold mt-4 text-style">
          Richtig! Alle Antworten korrekt.
        </p>
      )}
    </div>
  );
}
