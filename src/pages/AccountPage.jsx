import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";

export default function AccountPage() {
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className="max-w-sm text-style">
      <h1 className="text-2xl font-bold mb-2 heading-style">Konto</h1>
      <p className="mb-6">
        Angemeldet als <span className="highlight">{user.username}</span> (
        {user.role === "teacher" ? "Lehrkraft" : "Schüler/-in"})
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
    </div>
  );
}
