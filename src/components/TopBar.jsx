import { Link, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function TopBar({ onToggleMenu }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 w-full h-10 bg-black/80 text-white flex items-center justify-between px-3 z-40 text-sm">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMenu}
          className="p-1 rounded hover:bg-white/10"
          aria-label="Navigation ein- oder ausblenden"
        >
          <Menu size={20} />
        </button>
        <Link to="/" className="font-oxanium font-semibold tracking-wide hidden sm:inline">
          Krypto-Zeitreise
        </Link>
      </div>

      <nav className="flex items-center gap-2" aria-label="Benutzer">
        <span className="hidden sm:inline">
          Angemeldet als: <span className="font-semibold">{user?.username ?? "Gast"}</span>
        </span>
        <span className="hidden sm:inline text-white/40">|</span>
        {role === "teacher" && (
          <>
            <Link to="/dashboard" className="hover:text-blue-300">
              Dashboard
            </Link>
            <span className="text-white/40">|</span>
          </>
        )}
        {user ? (
          <>
            <Link to="/konto" className="hover:text-blue-300">
              Konto
            </Link>
            <span className="text-white/40">|</span>
            <button type="button" onClick={handleLogout} className="hover:text-red-400">
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="hover:text-blue-300">
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}
