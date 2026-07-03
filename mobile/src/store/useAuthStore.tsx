import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AuthApi, AuthUser, TokenStorage } from "../lib/apiClient";

interface AuthState {
  user:          AuthUser | null;
  isLoading:     boolean;
  isLoggedIn:    boolean;
  pendingEmail:  string | null; // email awaiting verification
}

interface AuthCtx extends AuthState {
  login:    (email: string, password: string) => Promise<void>;
  logout:   () => Promise<void>;
  setPendingEmail: (email: string | null) => void;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user:         null,
    isLoading:    true,
    isLoggedIn:   false,
    pendingEmail: null,
  });

  // Restore session on mount
  useEffect(() => {
    TokenStorage.getAccess().then((token) => {
      setState((s) => ({ ...s, isLoading: false, isLoggedIn: !!token }));
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await AuthApi.login(email, password);
    setState((s) => ({ ...s, user, isLoggedIn: true }));
  }, []);

  const logout = useCallback(async () => {
    await AuthApi.logout();
    setState({ user: null, isLoading: false, isLoggedIn: false, pendingEmail: null });
  }, []);

  const setPendingEmail = useCallback((email: string | null) => {
    setState((s) => ({ ...s, pendingEmail: email }));
  }, []);

  return (
    <Ctx.Provider value={{ ...state, login, logout, setPendingEmail }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
