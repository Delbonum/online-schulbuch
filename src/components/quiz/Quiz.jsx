import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../lib/api";
import Spinner from "../Spinner";
import TextQuestion from "./TextQuestion";
import ChoiceQuestion from "./ChoiceQuestion";
import OrderQuestion from "./OrderQuestion";

const QUESTION_COMPONENTS = {
  text: TextQuestion,
  single: ChoiceQuestion,
  multiple: ChoiceQuestion,
  order: OrderQuestion,
};

function initialAnswers(questions) {
  const answers = {};
  for (const question of questions) {
    if (question.type === "order") answers[question.id] = question.items;
    if (question.type === "multiple") answers[question.id] = [];
  }
  return answers;
}

/**
 * Zwischenprüfung eines Levels. Fragen und Bewertung kommen vom Server,
 * damit die Lösungen nicht im Browser nachgelesen werden können.
 */
export default function Quiz({ level, nextPath, intro = null }) {
  const { role, recordPassed, refresh, optionalLevels } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [evaluation, setEvaluation] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const redirectTimer = useRef(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const { quiz } = await api.quiz(level);
      setQuiz(quiz);
      setAnswers(initialAnswers(quiz.questions));
      setEvaluation(null);
    } catch (err) {
      setLoadError(err.message);
    }
  }, [level]);

  useEffect(() => {
    load();
    return () => clearTimeout(redirectTimer.current);
  }, [load]);

  const setAnswer = (id, value) => {
    setAnswers((current) => ({ ...current, [id]: value }));
    // Rückmeldung zu einer geänderten Antwort ist nicht mehr gültig
    setEvaluation((current) => {
      if (!current) return current;
      const results = { ...current.results };
      delete results[id];
      return { ...current, results, stale: true };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await api.submitQuiz(level, answers);
      const results = Object.fromEntries(response.results.map((r) => [r.task, r.correct]));
      setEvaluation({ score: response.score, passed: response.passed, results, stale: false });

      if (response.passed) {
        recordPassed(level, response.passedLevels);
        if (nextPath) {
          redirectTimer.current = setTimeout(() => navigate(nextPath), 2000);
        }
      }
    } catch (err) {
      if (err.status === 401 || err.status === 403) refresh();
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div className="text-style">
        <h1 className="text-2xl font-bold mb-4 heading-style">Zwischenprüfung</h1>
        <p role="alert" className="mb-4 text-red-300">
          Die Prüfung konnte nicht geladen werden: {loadError}
        </p>
        <button type="button" className="btn" onClick={load}>
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!quiz) return <Spinner label="Prüfung wird geladen …" />;

  const correctCount = evaluation ? Object.values(evaluation.results).filter(Boolean).length : 0;

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="text-2xl font-bold mb-2 heading-style">Zwischenprüfung</h1>
      <p className="text-style mb-6">
        Beantworte alle Aufgaben richtig, um {nextPath ? "das nächste Level freizuschalten" : "das Level abzuschließen"}
        .{role === "guest" && " Als Gast wird dein Fortschritt nur in diesem Browser gespeichert."}
      </p>

      {optionalLevels.includes(level) && (
        <p className="panel mb-6">
          Diese Prüfung ist für deine Klasse <b>freiwillig</b>: Das nächste Level ist auch ohne sie geöffnet. Du kannst
          sie trotzdem machen, um dein Wissen zu testen.
        </p>
      )}

      {intro}

      <ol className="space-y-8">
        {quiz.questions.map((question, index) => {
          const QuestionComponent = QUESTION_COMPONENTS[question.type];
          const result = evaluation?.results[question.id];
          return (
            <li key={question.id} className="text-style">
              <fieldset>
                <legend className="mb-2">
                  <span className="font-bold text-white">{index + 1}. </span>
                  {question.prompt}
                </legend>
                <QuestionComponent
                  question={question}
                  value={answers[question.id]}
                  onChange={(value) => setAnswer(question.id, value)}
                  disabled={submitting || evaluation?.passed}
                />
              </fieldset>
              {result !== undefined && (
                <p className={`mt-1 font-semibold ${result ? "text-green-400" : "text-red-400"}`}>
                  {result ? "✓ Richtig!" : "✗ Falsch."}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {!evaluation?.passed && (
        <button type="submit" className="btn mt-8" disabled={submitting}>
          {submitting ? "Wird ausgewertet …" : "Prüfung abschließen"}
        </button>
      )}

      {submitError && (
        <p role="alert" className="mt-4 text-red-300">
          {submitError}
        </p>
      )}

      {evaluation && !evaluation.stale && (
        <div
          role="status"
          className={`mt-6 p-4 rounded border ${
            evaluation.passed ? "border-green-400 bg-green-900/30" : "border-red-400 bg-red-900/30"
          }`}
        >
          {evaluation.passed ? (
            <p className="font-bold text-green-300">
              Richtig! Alle Antworten korrekt.{nextPath && " Gleich geht es weiter …"}
            </p>
          ) : (
            <p className="text-red-200">
              {correctCount} von {quiz.questions.length} Aufgaben richtig ({evaluation.score} %). Überarbeite die
              falschen Antworten und versuche es noch einmal.
            </p>
          )}
        </div>
      )}
    </form>
  );
}
