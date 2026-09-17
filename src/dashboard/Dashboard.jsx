import { useCallback, useEffect, useState } from "react";
import { BarChart3, KeyRound, Pencil, Trash2, UserPlus, Users } from "lucide-react";
import { api } from "../lib/api";
import Spinner from "../components/Spinner";
import StudentDialog from "./StudentDialog";
import ConfirmDialog from "./ConfirmDialog";
import HistoryDialog from "./HistoryDialog";
import StatisticsDialog from "./StatisticsDialog";
import BulkCreateDialog from "./BulkCreateDialog";

export default function Dashboard() {
  const [students, setStudents] = useState(null);
  const [levels, setLevels] = useState([]);
  const [error, setError] = useState(null);
  // { type: "create" | "edit" | "delete" | "history" | "statistics", student? }
  const [dialog, setDialog] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.students();
      setStudents(data.students);
      setLevels(data.levels);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    document.title = "Dashboard – Krypto-Zeitreise";
    load();
  }, [load]);

  const replaceStudent = (student) => setStudents((current) => current.map((s) => (s.id === student.id ? student : s)));

  const closeDialog = () => setDialog(null);

  if (error) {
    return (
      <div className="text-style">
        <h1 className="text-2xl font-bold mb-4 heading-style">Lehrkräfte-Dashboard</h1>
        <p role="alert" className="text-red-300 mb-4">
          {error}
        </p>
        <button type="button" className="btn" onClick={load}>
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!students) return <Spinner />;

  return (
    <div className="text-style">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold heading-style">Lehrkräfte-Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setDialog({ type: "statistics" })} className="btn btn-sm">
            <BarChart3 size={16} aria-hidden="true" /> Statistik
          </button>
          <button type="button" onClick={() => setDialog({ type: "create" })} className="btn btn-sm">
            <UserPlus size={16} aria-hidden="true" /> Schüler/-in hinzufügen
          </button>
          <button type="button" onClick={() => setDialog({ type: "bulk" })} className="btn btn-sm">
            <Users size={16} aria-hidden="true" /> Klasse anlegen
          </button>
        </div>
      </div>

      {students.length === 0 ? (
        <p className="panel">
          Du hast noch keine Schüler/-innen angelegt. Lege Zugänge an und gib den Schüler/-innen Benutzername und
          Passwort.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-auto border border-white/30 w-full text-sm">
            <thead>
              <tr>
                <th className="border border-white/70 px-2 py-1 text-left">Benutzername</th>
                {levels.map((level) => (
                  <th key={level} className="border border-white/70 px-2 py-1">
                    Level {level}
                  </th>
                ))}
                <th className="border border-white/70 px-2 py-1">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="border border-white/40 px-2 py-1">
                    <button
                      type="button"
                      className="text-blue-300 hover:text-white underline text-left"
                      onClick={() => setDialog({ type: "history", student })}
                      title="Prüfungsverlauf anzeigen"
                    >
                      {student.username}
                    </button>
                  </td>
                  {levels.map((level) => {
                    const passed = student.passedLevels.includes(level);
                    return (
                      <td key={level} className="border border-white/40 px-2 py-1 text-center">
                        <span aria-label={passed ? "bestanden" : "nicht bestanden"}>{passed ? "✅" : "❌"}</span>
                      </td>
                    );
                  })}
                  <td className="border border-white/40 px-2 py-1 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setDialog({ type: "edit", student })}
                      className="p-1 rounded hover:bg-white/20"
                      aria-label={`${student.username} bearbeiten`}
                      title="Bearbeiten"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDialog({ type: "edit", student, focusPassword: true })}
                      className="p-1 rounded hover:bg-white/20 ml-1"
                      aria-label={`Passwort von ${student.username} ändern`}
                      title="Passwort ändern"
                    >
                      <KeyRound size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDialog({ type: "delete", student })}
                      className="p-1 rounded hover:bg-white/20 ml-1"
                      aria-label={`${student.username} löschen`}
                      title="Löschen"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialog?.type === "create" && (
        <StudentDialog
          levels={levels}
          onClose={closeDialog}
          onSaved={(student) => {
            setStudents((current) => [...current, student].sort((a, b) => a.username.localeCompare(b.username)));
            closeDialog();
          }}
        />
      )}

      {dialog?.type === "edit" && (
        <StudentDialog
          student={dialog.student}
          levels={levels}
          focusPassword={dialog.focusPassword}
          onClose={closeDialog}
          onSaved={(student) => {
            replaceStudent(student);
            closeDialog();
          }}
        />
      )}

      {dialog?.type === "delete" && (
        <ConfirmDialog
          title="Schüler/-in löschen"
          confirmLabel="Löschen"
          onClose={closeDialog}
          onConfirm={async () => {
            await api.deleteStudent(dialog.student.id);
            setStudents((current) => current.filter((s) => s.id !== dialog.student.id));
            closeDialog();
          }}
        >
          Soll <strong>{dialog.student.username}</strong> mit allen Prüfungsergebnissen wirklich gelöscht werden?
        </ConfirmDialog>
      )}

      {dialog?.type === "history" && (
        <HistoryDialog
          student={dialog.student}
          onClose={closeDialog}
          onReset={(student) => {
            replaceStudent(student);
            closeDialog();
          }}
        />
      )}

      {dialog?.type === "statistics" && <StatisticsDialog onClose={closeDialog} />}

      {dialog?.type === "bulk" && (
        <BulkCreateDialog
          onClose={closeDialog}
          onCreated={(student) =>
            setStudents((current) => [...current, student].sort((a, b) => a.username.localeCompare(b.username)))
          }
        />
      )}
    </div>
  );
}
