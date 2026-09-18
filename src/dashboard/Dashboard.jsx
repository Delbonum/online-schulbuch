import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { BarChart3, GraduationCap, Pencil, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { api } from "../lib/api";
import Spinner from "../components/Spinner";
import StudentDialog from "./StudentDialog";
import ConfirmDialog from "./ConfirmDialog";
import HistoryDialog from "./HistoryDialog";
import StatisticsDialog from "./StatisticsDialog";
import BulkCreateDialog from "./BulkCreateDialog";
import ClassesDialog from "./ClassesDialog";
import TeachersDialog from "./TeachersDialog";
import ScrollArea from "../components/ScrollArea";

export const ALL_CLASSES = "all";
export const WITHOUT_CLASS = "none";

export default function Dashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState(null);
  const [classes, setClasses] = useState([]);
  const [levels, setLevels] = useState([]);
  const [filter, setFilter] = useState(ALL_CLASSES);
  const [error, setError] = useState(null);
  // { type: "create" | "edit" | "delete" | "history" | "statistics" | "bulk" | "classes", student? }
  const [dialog, setDialog] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.students();
      setStudents(data.students);
      setClasses(data.classes);
      setLevels(data.levels);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    document.title = "Dashboard – Krypto-Zeitreise";
    load();
  }, [load]);

  const className = useCallback((classId) => classes.find((c) => c.id === classId)?.name ?? "–", [classes]);

  const visibleStudents = useMemo(() => {
    if (filter === ALL_CLASSES) return students ?? [];
    if (filter === WITHOUT_CLASS) return (students ?? []).filter((s) => s.classId === null);
    return (students ?? []).filter((s) => s.classId === Number(filter));
  }, [students, filter]);

  const sortStudents = (list) => [...list].sort((a, b) => a.username.localeCompare(b.username, "de"));
  const addStudent = (student) => setStudents((current) => sortStudents([...current, student]));
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

  const columnCount = levels.length + (classes.length > 0 ? 3 : 2);

  return (
    <div className="text-style">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold heading-style">Lehrkräfte-Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setDialog({ type: "statistics" })} className="btn btn-sm">
            <BarChart3 size={16} aria-hidden="true" /> Statistik
          </button>
          {user?.isMaster && (
            <button type="button" onClick={() => setDialog({ type: "teachers" })} className="btn btn-sm">
              <ShieldCheck size={16} aria-hidden="true" /> Lehrkräfte
            </button>
          )}
          <button type="button" onClick={() => setDialog({ type: "classes" })} className="btn btn-sm">
            <GraduationCap size={16} aria-hidden="true" /> Klassen
          </button>
          <button type="button" onClick={() => setDialog({ type: "create" })} className="btn btn-sm">
            <UserPlus size={16} aria-hidden="true" /> Schüler/-in
          </button>
          <button type="button" onClick={() => setDialog({ type: "bulk" })} className="btn btn-sm">
            <Users size={16} aria-hidden="true" /> Klasse anlegen
          </button>
        </div>
      </div>

      {classes.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label htmlFor="class-filter" className="text-sm">
            Anzeigen:
          </label>
          <select
            id="class-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-style py-1"
          >
            <option value={ALL_CLASSES}>Alle Schüler/-innen ({students.length})</option>
            {classes.map((klass) => (
              <option key={klass.id} value={klass.id}>
                {klass.name} ({klass.studentCount})
              </option>
            ))}
            <option value={WITHOUT_CLASS}>Ohne Klasse ({students.filter((s) => s.classId === null).length})</option>
          </select>
        </div>
      )}

      {students.length === 0 ? (
        <p className="panel">
          Du hast noch keine Schüler/-innen angelegt. Lege Zugänge an und gib den Schüler/-innen Benutzername und
          Passwort.
        </p>
      ) : (
        <ScrollArea>
          <table className="table-auto border border-white/30 w-full text-sm">
            <thead>
              <tr>
                <th className="border border-white/70 px-2 py-1 text-left">Benutzername</th>
                {classes.length > 0 && <th className="border border-white/70 px-2 py-1 text-left">Klasse</th>}
                {levels.map((level) => (
                  <th key={level} className="border border-white/70 px-2 py-1">
                    Level {level}
                  </th>
                ))}
                <th className="border border-white/70 px-2 py-1">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {visibleStudents.map((student) => (
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
                  {classes.length > 0 && (
                    <td className="border border-white/40 px-2 py-1">{className(student.classId)}</td>
                  )}
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
                      title="Bearbeiten: Name, Passwort, Klasse und Level"
                    >
                      <Pencil size={16} />
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
              {visibleStudents.length === 0 && (
                <tr>
                  <td colSpan={columnCount} className="border border-white/40 px-2 py-3">
                    In dieser Klasse ist noch niemand.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      )}

      {(dialog?.type === "create" || dialog?.type === "edit") && (
        <StudentDialog
          student={dialog.student}
          levels={levels}
          classes={classes}
          defaultClassId={filter === ALL_CLASSES || filter === WITHOUT_CLASS ? null : Number(filter)}
          onClose={closeDialog}
          onSaved={(student) => {
            if (dialog.type === "create") addStudent(student);
            else replaceStudent(student);
            load();
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
            load();
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

      {dialog?.type === "teachers" && <TeachersDialog onClose={closeDialog} currentUserId={user?.id} />}

      {dialog?.type === "statistics" && (
        <StatisticsDialog classes={classes} initialClassId={filter} onClose={closeDialog} />
      )}

      {dialog?.type === "bulk" && (
        <BulkCreateDialog
          classes={classes}
          defaultClassId={filter === ALL_CLASSES || filter === WITHOUT_CLASS ? null : Number(filter)}
          onClose={() => {
            load();
            closeDialog();
          }}
          onCreated={addStudent}
        />
      )}

      {dialog?.type === "classes" && (
        <ClassesDialog
          classes={classes}
          levels={levels}
          onChange={(updated) => {
            setClasses(updated);
            load();
          }}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}
