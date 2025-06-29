import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccess, useAuth } from "../../auth/AuthContext";

export default function useLevelGuard(levelKey) {
  const navigate = useNavigate();
  const hasAccess = useAccess();
  const { user } = useAuth();

  useEffect(() => {
    if (user.role === "student" && user.progress === undefined) return;

    if (!hasAccess(levelKey)) {
      navigate("/zugriffsfehler");
    }
  }, [user, hasAccess, levelKey, navigate]);
}
