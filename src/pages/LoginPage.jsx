import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { firstPagePath } from "../levels";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(username.trim(), password);
      navigate(user.role === "teacher" ? "/dashboard" : firstPagePath);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-3xl font-bold mb-2 heading-style">Krypto-Zeitreise</h1>
      <p className="text-style mb-8 text-center">Melde dich an oder starte deine Zeitreise als Gast.</p>

      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
        <div>
          <label htmlFor="login-username" className="block mb-1">
            Benutzername
          </label>
          <input
            id="login-username"
            type="text"
            autoComplete="username"
            className="input-style w-full"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block mb-1">
            Passwort
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            className="input-style w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p role="alert" className="text-red-300 text-sm bg-red-900/40 border border-red-400/50 rounded p-2">
            {error}
          </p>
        )}

        <button type="submit" className="btn w-full" disabled={submitting}>
          {submitting ? "Anmelden …" : "Anmelden"}
        </button>
      </form>

      <div className="mt-6 text-sm text-white/70 text-center">
        <p className="mb-2">oder</p>
        <button type="button" onClick={() => navigate(firstPagePath)} className="underline hover:text-white transition">
          Als Gast fortfahren
        </button>
        <p className="mt-2 text-xs text-white/50">Als Gast wird dein Fortschritt nur in diesem Browser gespeichert.</p>
        <p className="mt-6">
          Du unterrichtest und möchtest Klassen anlegen?{" "}
          <Link to="/registrieren" className="underline hover:text-white">
            Als Lehrkraft registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
