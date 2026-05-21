import React, { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the entire app.
 * Reads persisted session from localStorage on first load.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("cm_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("cm_token") || null);

  /** Called after a successful login or register */
  const login = useCallback((userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem("cm_user", JSON.stringify(userData));
    localStorage.setItem("cm_token", jwt);
  }, []);

  /** Clears session from state and storage */
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("cm_user");
    localStorage.removeItem("cm_token");
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook for consuming auth state inside any component */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
