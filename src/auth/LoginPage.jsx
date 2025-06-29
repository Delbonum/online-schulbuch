import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const { login, loginAsGuest } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      const success = await login(username, password);  // <-- wichtig: await
      if (!success) {
        setShowModal(true);
      }
    };

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-3xl font-bold mb-4">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
          <div>
            <label className="block mb-1">Benutzername</label>
            <input
              type="text"
              className="input-style"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1">Passwort</label>
            <input
              type="password"
              className="input-style"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <button type="submit" className="button-style w-full">
            Anmelden
          </button>
        </form>

        <div className="mt-6 text-sm text-white/70 text-center">
          <p className="mb-2">oder</p>
          <button
            onClick={loginAsGuest}
            className="underline hover:text-white transition"
          >
            Als Gast fortfahren
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white text-black p-6 rounded-lg shadow-lg max-w-sm text-center">
            <p className="mb-4">
              Ungültige Eingabe! Der Benutzername oder das Passwort sind nicht
              korrekt.
            </p>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setShowModal(false)}
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </>
  );
}
