import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { requiredLevel } from "../lib/progress";

const GUEST_PROGRESS_KEY = "kryptogame.guestPassedLevels";

const AuthContext = createContext(null);

function readGuestProgress() {
  try {
    const stored = JSON.parse(localStorage.getItem(GUEST_PROGRESS_KEY));
    return Array.isArray(stored) ? stored.filter(Number.isInteger) : [];
  } catch {
    return [];
  }
}

function writeGuestProgress(levels) {
  try {
    localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(levels));
  } catch {
    // Speichern nicht möglich (z. B. privater Modus) – Fortschritt gilt dann nur bis zum Neuladen
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestPassed, setGuestPassed] = useState(readGuestProgress);

  const refresh = useCallback(async () => {
    try {
      const { user } = await api.me();
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Überbleibsel der alten Version, die Benutzerdaten im localStorage abgelegt hat
    try {
      localStorage.removeItem("user");
    } catch {
      // ignorieren
    }
    refresh();
  }, [refresh]);

  const login = useCallback(async (username, password) => {
    const { user } = await api.login(username, password);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const role = user?.role ?? "guest";
  const passedLevels = useMemo(
    () => (role === "student" ? user.passedLevels : role === "guest" ? guestPassed : []),
    [role, user, guestPassed],
  );

  const hasPassed = useCallback((level) => passedLevels.includes(level), [passedLevels]);

  const isUnlocked = useCallback(
    (level) => {
      if (role === "teacher") return true;
      const required = requiredLevel(level);
      return required === null || passedLevels.includes(required);
    },
    [role, passedLevels],
  );

  /** Nach einer bestandenen Prüfung aufrufen. `serverLevels` kommt bei Schüler/-innen vom Server. */
  const recordPassed = useCallback(
    (level, serverLevels) => {
      if (role === "student" && serverLevels) {
        setUser((current) => ({ ...current, passedLevels: serverLevels }));
      } else if (role === "guest") {
        setGuestPassed((current) => {
          const next = [...new Set([...current, level])].sort((a, b) => a - b);
          writeGuestProgress(next);
          return next;
        });
      }
    },
    [role],
  );

  const value = useMemo(
    () => ({ user, role, loading, login, logout, refresh, passedLevels, hasPassed, isUnlocked, recordPassed }),
    [user, role, loading, login, logout, refresh, passedLevels, hasPassed, isUnlocked, recordPassed],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth muss innerhalb von <AuthProvider> verwendet werden.");
  return context;
}
