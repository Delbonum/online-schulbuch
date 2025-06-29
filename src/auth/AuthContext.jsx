import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : { role: "guest", username: "Gast" };
  });

  const navigate = useNavigate();

  const login = async (username, password) => {
    try {
      const res = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) return false;

      const userData = await res.json();

      if (userData.role === "student") {
        const progressRes = await fetch(`http://localhost:3001/progress/${userData.username}`);
        if (progressRes.ok) {
          userData.progress = await progressRes.json();
        }
      }

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      navigate(userData.role === "teacher" ? "/dashboard" : "/level1/start");
      return true;
    } catch (err) {
      console.error("Login-Fehler:", err);
      return false;
    }
  };

  const loginAsGuest = () => {
    const guest = { role: "guest", username: "Gast" };
    setUser(guest);
    localStorage.setItem("user", JSON.stringify(guest));
    navigate("/level1/start");
  };

  const logout = () => {
    setUser({ role: "guest", username: "Gast" });
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loginAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useAccess() {
  const { user } = useAuth();

  return (levelKey) => {
    if (!user || user.role === "guest") {
      return localStorage.getItem(levelKey) === "true";
    }
    if (user.role === "teacher") return true;
    return !!user.progress?.[levelKey];
  };
}

export function useProgressUpdater() {
  const { user, setUser } = useAuth();

  return async (levelKey) => {
    if (user?.role === "student") {
      const updated = {
        ...user.progress,
        [levelKey]: true,
      };

      setUser((prev) => ({
        ...prev,
        progress: updated,
      }));

      try {
        await fetch(`http://localhost:3001/progress/${user.username}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [levelKey]: true, _skipHistory: true }),
        });
      } catch (err) {
        console.error("Fortschritt konnte nicht gespeichert werden:", err);
      }
    } else {
      document.cookie = `${levelKey}=passed; path=/`;
    }
  };
}
