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
  googleLogin: (idToken: string) => Promise<{ isNewUser: boolean }>;
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

  // Restore session on mount — fetch user profile if token exists
  useEffect(() => {
    (async () => {
      const token = await TokenStorage.getAccess();
      if (!token) {
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }
      try {
        const user = await AuthApi.getMe();
        setState((s) => ({ ...s, user, isLoading: false, isLoggedIn: true }));
      } catch {
        await TokenStorage.clear();
        setState((s) => ({ ...s, isLoading: false }));
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await AuthApi.login(email, password);
    setState((s) => ({ ...s, user, isLoggedIn: true }));
  }, []);

  const googleLogin = useCallback(async (idToken: string) => {
    // AuthApi.googleLogin persists tokens to AsyncStorage before returning.
    const { user, isNewUser } = await AuthApi.googleLogin(idToken);
    setState((s) => ({ ...s, user, isLoggedIn: true }));
    return { isNewUser };
  }, []);

  const logout = useCallback(async () => {
    await AuthApi.logout();
    setState({ user: null, isLoading: false, isLoggedIn: false, pendingEmail: null });
  }, []);

  const setPendingEmail = useCallback((email: string | null) => {
    setState((s) => ({ ...s, pendingEmail: email }));
  }, []);

  return (
    <Ctx.Provider value={{ ...state, login, googleLogin, logout, setPendingEmail }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
