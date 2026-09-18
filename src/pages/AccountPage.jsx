import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";

export default function AccountPage() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isTeacher = user.role === "teacher";

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (next !== repeat) {
      setStatus({ error: true, message: "Die neuen Passwörter stimmen nicht überein." });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      await api.changePassword(current, next);
      setStatus({ error: false, message: "Dein Passwort wurde geändert." });
      setCurrent("");
      setNext("");
      setRepeat("");
    } catch (err) {
      setStatus({ error: true, message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (event) => {
    event.preventDefault();
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteAccount(deletePassword);
      await refresh();
      navigate("/login", { replace: true });
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-md text-style">
      <h1 className="text-2xl font-bold mb-2 heading-style">Konto</h1>
      <p className="mb-6">
        Angemeldet als <span className="highlight">{user.username}</span> ({isTeacher ? "Lehrkraft" : "Schüler/-in"})
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg heading-style">Passwort ändern</h2>
        {[
          ["account-current", "Aktuelles Passwort", current, setCurrent, "current-password"],
          ["account-new", "Neues Passwort (mind. 6 Zeichen)", next, setNext, "new-password"],
          ["account-repeat", "Neues Passwort wiederholen", repeat, setRepeat, "new-password"],
        ].map(([id, label, value, setValue, autoComplete]) => (
          <div key={id}>
            <label htmlFor={id} className="block mb-1">
              {label}
            </label>
            <input
              id={id}
              type="password"
              className="input-style w-full"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoComplete={autoComplete}
              required
            />
          </div>
        ))}

        {status && (
          <p role="status" className={status.error ? "text-red-300" : "text-green-300"}>
            {status.message}
          </p>
        )}

        <button type="submit" className="btn" disabled={submitting}>
          Passwort ändern
        </button>
      </form>

      <section className="mt-12 border border-red-400/50 rounded p-4">
        <h2 className="text-lg heading-style text-red-300">Konto löschen</h2>
        <p className="mt-2 text-sm">
          {isTeacher ? (
            <>
              Dein Konto wird endgültig gelöscht – zusammen mit{" "}
              <b>allen Klassen, Zugängen deiner Schüler/-innen und deren Prüfungsergebnissen</b>. Das lässt sich nicht
              rückgängig machen.
            </>
          ) : (
            <>
              Dein Konto und dein gesamter Fortschritt werden endgültig gelöscht. Das lässt sich nicht rückgängig
              machen.
            </>
          )}
        </p>

        {!showDelete ? (
          <button
            type="button"
            className="btn btn-sm mt-3 border-red-400 text-red-300"
            onClick={() => setShowDelete(true)}
          >
            Konto löschen …
          </button>
        ) : (
          <form onSubmit={handleDelete} className="mt-3 space-y-3">
            <div>
              <label htmlFor="account-delete-password" className="block mb-1 text-sm">
                Zur Bestätigung dein Passwort
              </label>
              <input
                id="account-delete-password"
                type="password"
                className="input-style w-full"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {deleteError && (
              <p role="alert" className="text-red-300 text-sm">
                {deleteError}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn btn-sm border-red-400 text-red-300" disabled={deleting}>
                {deleting ? "Wird gelöscht …" : "Endgültig löschen"}
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setShowDelete(false);
                  setDeletePassword("");
                  setDeleteError(null);
                }}
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
