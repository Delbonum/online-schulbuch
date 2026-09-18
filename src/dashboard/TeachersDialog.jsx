import { useCallback, useEffect, useState } from "react";
import { Check, KeyRound, Trash2, X } from "lucide-react";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import { api } from "../lib/api";

const formatDate = (iso) => new Date(iso).toLocaleDateString("de-DE", { dateStyle: "medium" });

/** Nur für das Master-Konto: Lehrkräfte verwalten und Registrierungen freigeben. */
export default function TeachersDialog({ onClose, currentUserId }) {
  const [teachers, setTeachers] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ username: "", password: "" });
  const [passwordFor, setPasswordFor] = useState(null); // { id, password }
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    try {
      const [teacherData, registrationData] = await Promise.all([api.teachers(), api.registrations()]);
      setTeachers(teacherData.teachers);
      setRegistrations(registrationData.registrations);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const pending = registrations.filter((r) => r.status === "pending");
  const decided = registrations.filter((r) => r.status !== "pending");

  return (
    <Modal
      title="Lehrkräfte verwalten"
      onClose={onClose}
      size="lg"
      footer={
        <button type="button" className="btn-dialog" onClick={onClose}>
          Schließen
        </button>
      }
    >
      {error && (
        <p role="alert" className="text-sm text-red-700 mb-3">
          {error}
        </p>
      )}
      {!teachers && !error && <Spinner />}

      {teachers && (
        <>
          <section className="mb-6">
            <h3 className="font-semibold mb-2">Offene Registrierungen ({pending.length})</h3>
            {pending.length === 0 ? (
              <p className="text-sm text-gray-600">Keine offenen Anfragen.</p>
            ) : (
              <ul className="divide-y">
                {pending.map((request) => (
                  <li key={request.id} className="py-2 flex flex-wrap items-center gap-2">
                    <span className="flex-1 text-sm">
                      <strong>{request.fullName}</strong> ({request.username})
                      <br />
                      <span className="text-gray-600">
                        {request.school}, {request.city} · {request.email} · {formatDate(request.createdAt)}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="btn-dialog-primary"
                      disabled={busy}
                      onClick={() => run(() => api.decideRegistration(request.id, "approve"))}
                    >
                      <Check size={16} aria-hidden="true" /> Freigeben
                    </button>
                    <button
                      type="button"
                      className="btn-dialog-danger"
                      disabled={busy}
                      onClick={() => run(() => api.decideRegistration(request.id, "reject"))}
                    >
                      <X size={16} aria-hidden="true" /> Ablehnen
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {decided.length > 0 && (
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-blue-700">Bearbeitete Anfragen ({decided.length})</summary>
                <ul className="mt-1 space-y-1 text-gray-600">
                  {decided.map((request) => (
                    <li key={request.id}>
                      {formatDate(request.createdAt)} · {request.fullName} ({request.username}) –{" "}
                      {request.status === "approved" ? "freigegeben" : "abgelehnt"}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          <section>
            <h3 className="font-semibold mb-2">Lehrkräfte ({teachers.length})</h3>
            <ul className="divide-y">
              {teachers.map((teacher) => (
                <li key={teacher.id} className="py-2 flex flex-wrap items-center gap-2">
                  <span className="flex-1">
                    {teacher.username}
                    {teacher.isMaster && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 rounded px-1">Master</span>
                    )}
                    <span className="text-gray-500 text-sm">
                      {" "}
                      · {teacher.studentCount} {teacher.studentCount === 1 ? "Schüler/-in" : "Schüler/-innen"}
                    </span>
                  </span>

                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={teacher.isMaster}
                      disabled={busy || teacher.id === currentUserId}
                      onChange={() => run(() => api.updateTeacher(teacher.id, { isMaster: !teacher.isMaster }))}
                      aria-label={`${teacher.username} als Master-Konto`}
                    />
                    Master
                  </label>

                  <button
                    type="button"
                    className="p-1 rounded hover:bg-gray-100"
                    onClick={() => setPasswordFor({ id: teacher.id, password: "" })}
                    aria-label={`Passwort von ${teacher.username} ändern`}
                    title="Neues Passwort setzen"
                  >
                    <KeyRound size={16} />
                  </button>
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
                    disabled={teacher.id === currentUserId}
                    onClick={() => setConfirmDelete(teacher.id)}
                    aria-label={`${teacher.username} löschen`}
                    title="Löschen"
                  >
                    <Trash2 size={16} />
                  </button>

                  {passwordFor?.id === teacher.id && (
                    <div className="basis-full flex flex-wrap gap-2 items-center">
                      <input
                        type="text"
                        className="dialog-input flex-1 font-mono"
                        value={passwordFor.password}
                        onChange={(e) => setPasswordFor({ ...passwordFor, password: e.target.value })}
                        placeholder="Neues Passwort (mind. 6 Zeichen)"
                        aria-label={`Neues Passwort für ${teacher.username}`}
                      />
                      <button
                        type="button"
                        className="btn-dialog-primary"
                        disabled={busy || passwordFor.password.length < 6}
                        onClick={() =>
                          run(async () => {
                            await api.updateTeacher(teacher.id, { password: passwordFor.password });
                            setPasswordFor(null);
                          })
                        }
                      >
                        Speichern
                      </button>
                      <button type="button" className="btn-dialog" onClick={() => setPasswordFor(null)}>
                        Abbrechen
                      </button>
                    </div>
                  )}

                  {confirmDelete === teacher.id && (
                    <div className="basis-full flex flex-wrap gap-2 items-center">
                      <span className="text-sm text-red-700 flex-1">
                        {teacher.username} mit allen Klassen und Schüler/-innen löschen?
                      </span>
                      <button
                        type="button"
                        className="btn-dialog-danger"
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            await api.deleteTeacher(teacher.id);
                            setConfirmDelete(null);
                          })
                        }
                      >
                        Löschen
                      </button>
                      <button type="button" className="btn-dialog" onClick={() => setConfirmDelete(null)}>
                        Abbrechen
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <form
              className="mt-4 flex flex-wrap gap-2 items-end"
              onSubmit={(event) => {
                event.preventDefault();
                run(async () => {
                  await api.createTeacher(newTeacher.username.trim(), newTeacher.password);
                  setNewTeacher({ username: "", password: "" });
                });
              }}
            >
              <div className="flex-1 min-w-[10rem]">
                <label htmlFor="new-teacher-name" className="block text-sm font-medium mb-1">
                  Neue Lehrkraft
                </label>
                <input
                  id="new-teacher-name"
                  className="dialog-input"
                  value={newTeacher.username}
                  onChange={(e) => setNewTeacher({ ...newTeacher, username: e.target.value })}
                  placeholder="Benutzername"
                  required
                />
              </div>
              <div className="flex-1 min-w-[10rem]">
                <label htmlFor="new-teacher-password" className="block text-sm font-medium mb-1">
                  Passwort
                </label>
                <input
                  id="new-teacher-password"
                  className="dialog-input font-mono"
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                  placeholder="mind. 6 Zeichen"
                  minLength={6}
                  required
                />
              </div>
              <button type="submit" className="btn-dialog-primary" disabled={busy}>
                Anlegen
              </button>
            </form>
          </section>
        </>
      )}
    </Modal>
  );
}
