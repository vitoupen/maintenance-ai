import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as authService from "../services/auth.js";

// Thin React wrapper around services/auth.js so components can react to
// login/logout without re-reading localStorage manually.
export function useAuth() {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getCurrentUser());

  const login = useCallback((username, password) => {
    const result = authService.login(username, password);
    if (result.success) {
      setUser(result.user);
      navigate("/admin");
    }
    return result;
  }, [navigate]);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    navigate("/login");
  }, [navigate]);

  return {
    user,
    role: user?.role ?? null,
    isAuthenticated: Boolean(user),
    login,
    logout,
  };
}
