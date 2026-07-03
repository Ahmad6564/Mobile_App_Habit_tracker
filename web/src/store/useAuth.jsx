/**
 * Auth context for the web app.
 * Manages login/logout state, token lifecycle, and user session.
 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi } from "../api/auth";
import { tokenStorage } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isLoggedIn = !!user;

  // Restore session on mount
  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .getMe()
      .then((u) => setUser(u))
      .catch(() => {
        tokenStorage.clear();
      })
      .finally(() => setLoading(false));
  }, []);

  // Listen for forced logout (from token refresh failure)
  useEffect(() => {
    const handler = () => {
      setUser(null);
    };
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    const { user: u } = await authApi.login(email, password);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    setError(null);
    const data = await authApi.register(payload);
    return data;
  }, []);

  const googleLogin = useCallback(async (idToken) => {
    setError(null);
    const { user: u } = await authApi.googleLogin(idToken);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await authApi.getMe();
      setUser(u);
    } catch {
      // silently fail
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isLoggedIn,
        login,
        register,
        googleLogin,
        logout,
        refreshUser,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
