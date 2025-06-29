import React from "react";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";

export default function TopBar() {
  const { user, logout } = useAuth();

  const isGuest = user?.role === "guest";
  const username = user?.username || "Gast";

  return (
    <div className="fixed top-0 left-0 w-full h-6 bg-black/70 text-white flex items-center justify-end px-4 z-50 text-sm">
        <div className="flex items-center space-x-2">
          {!isGuest ? (
            <>
              <button onClick={logout} className="hover:text-red-400">
                Logout
              </button>

              {user?.role === "teacher" && (
                <>
                  <span>|</span>
                  <Link to="/dashboard" className="hover:text-blue-300">
                    Dashboard
                  </Link>
                </>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-300">
                Login
              </Link>
            </>
          )}
          <span>|</span>
          <span>
            Angemeldet als: <span className="font-semibold">{username}</span>
          </span>
        </div>
    </div>
  );
}
