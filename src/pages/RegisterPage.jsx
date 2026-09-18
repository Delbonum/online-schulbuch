import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

const FIELDS = [
  ["fullName", "Vor- und Nachname", "text", "name"],
  ["school", "Schule", "text", "organization"],
  ["city", "Ort", "text", "address-level2"],
  ["email", "E-Mail-Adresse", "email", "email"],
  ["username", "Gewünschter Benutzername", "text", "username"],
  ["password", "Passwort (mind. 6 Zeichen)", "password", "new-password"],
];

/** Registrierung für Lehrkräfte. Ein Konto entsteht erst nach der Freigabe durch das Master-Konto. */
export default function RegisterPage() {
  const [values, setValues] = useState({ fullName: "", school: "", city: "", email: "", username: "", password: "" });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const update = (field) => (event) => setValues({ ...values, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.register(values);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-style py-8">
        <h1 className="text-2xl font-bold mb-4 heading-style">Registrierung übermittelt</h1>
        <p className="mb-4">
          Danke! Deine Anfrage wird geprüft. Sobald sie freigegeben ist, bekommst du eine E-Mail an{" "}
          <span className="highlight">{values.email}</span> und kannst dich mit deinem Benutzernamen anmelden.
        </p>
        <Link to="/login" className="btn">
          Zur Anmeldung
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto text-style py-8">
      <h1 className="text-2xl font-bold mb-2 heading-style">Als Lehrkraft registrieren</h1>
      <p className="mb-6 text-sm">
        Lehrkräfte können Klassen und Zugänge für ihre Schüler/-innen anlegen und deren Fortschritt sehen. Jede
        Registrierung wird von Hand freigegeben, das kann ein bis zwei Tage dauern.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {FIELDS.map(([field, label, type, autoComplete]) => (
          <div key={field}>
            <label htmlFor={`register-${field}`} className="block mb-1">
              {label}
            </label>
            <input
              id={`register-${field}`}
              type={type}
              value={values[field]}
              onChange={update(field)}
              autoComplete={autoComplete}
              className="input-style w-full"
              required
              minLength={field === "password" ? 6 : undefined}
            />
          </div>
        ))}

        {error && (
          <p role="alert" className="text-red-300 text-sm bg-red-900/40 border border-red-400/50 rounded p-2">
            {error}
          </p>
        )}

        <button type="submit" className="btn w-full" disabled={submitting}>
          {submitting ? "Wird gesendet …" : "Registrierung abschicken"}
        </button>
      </form>

      <p className="mt-6 text-sm text-white/70">
        Du hast schon ein Konto?{" "}
        <Link to="/login" className="underline hover:text-white">
          Zur Anmeldung
        </Link>
      </p>
    </div>
  );
}
