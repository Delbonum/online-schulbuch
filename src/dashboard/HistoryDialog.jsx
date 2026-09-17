import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import { api } from "../lib/api";

const formatTime = (iso) => new Date(iso).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });

const formatAnswer = (answer) => {
  if (answer === null || answer === undefined || answer === "") return "–";
  if (Array.isArray(answer)) {
    // Reihenfolge-Aufgaben: Texte; Mehrfachauswahl: Optionsnummern (ab 1)
    return answer.every((a) => typeof a === "number") ? answer.map((a) => a + 1).join(", ") : answer.join(" → ");
  }
  return typeof answer === "number" ? `Option ${answer + 1}` : `„${answer}“`;
};

function entryClass(entry) {
  if (entry.manual === "freigeschaltet") return "text-green-700 italic";
  if (entry.manual === "gesperrt") return "text-red-700 italic";
  if (entry.score === 100) return "text-green-700 font-semibold";
  return "";
}

/** Prüfungsverlauf einer Schülerin / eines Schülers mit Detailansicht und Zurücksetzen. */
export default function HistoryDialog({ student, onClose, onReset }) {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .studentHistory(student.id)
      .then((data) => setHistory(data.history))
      .catch((err) => setError(err.message));
  }, [student.id]);

  const reset = async () => {
    setBusy(true);
    try {
      const { student: updated } = await api.resetStudent(student.id);
      onReset(updated);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const levels = history ? Object.keys(history) : [];

  const footer = selected ? (
    <button type="button" onClick={() => setSelected(null)} className="btn-dialog">
      Zurück
    </button>
  ) : confirmReset ? (
    <>
      <span className="text-sm text-red-700 mr-auto self-center">Fortschritt und Verlauf wirklich löschen?</span>
      <button type="button" onClick={() => setConfirmReset(false)} className="btn-dialog">
        Abbrechen
      </button>
      <button type="button" onClick={reset} className="btn-dialog-danger" disabled={busy}>
        Zurücksetzen
      </button>
    </>
  ) : (
    <>
      <button type="button" onClick={() => setConfirmReset(true)} className="btn-dialog-danger mr-auto">
        Fortschritt zurücksetzen
      </button>
      <button type="button" onClick={onClose} className="btn-dialog">
        Schließen
      </button>
    </>
  );

  return (
    <Modal title={`Verlauf: ${student.username}`} onClose={onClose} footer={footer} size="lg">
      {error && (
        <p role="alert" className="text-red-700 mb-2">
          {error}
        </p>
      )}
      {!history && !error && <Spinner />}

      {selected ? (
        <div>
          <p className="text-sm text-gray-600 mb-3">
            Level {selected.level} · {formatTime(selected.entry.timestamp)} · {selected.entry.score} % richtig
          </p>
          <ul className="text-sm space-y-1">
            {selected.entry.details.map((detail) => (
              <li key={detail.task}>
                Aufgabe {detail.task}: {detail.correct ? "✔️ richtig" : "❌ falsch"}
                <span className="ml-2 text-gray-600">Antwort: {formatAnswer(detail.answer)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        history &&
        (levels.length === 0 ? (
          <p className="text-gray-600">Noch keine Prüfungsversuche.</p>
        ) : (
          levels.map((level) => (
            <section key={level} className="mb-4">
              <h3 className="font-semibold mb-1">Level {level}</h3>
              <ul className="text-sm space-y-1">
                {history[level].map((entry, i) => (
                  <li key={i} className={entryClass(entry)}>
                    {formatTime(entry.timestamp)} –{" "}
                    {entry.manual ? `manuell ${entry.manual}` : `${entry.score} % richtig`}
                    {!entry.manual && entry.details?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelected({ level, entry })}
                        className="ml-2 text-blue-600 underline text-xs"
                      >
                        Details
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))
        ))
      )}
    </Modal>
  );
}
