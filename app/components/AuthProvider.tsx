"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  MOCK_ACCOUNTS,
  clearSession,
  loadSession,
  saveSession,
  sessionFromAccount,
  type MockAccount,
  type Session,
} from "../lib/auth";

type AuthContextValue = {
  session: Session | null;
  hydrated: boolean;
  loginModalOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  login: (account: MockAccount) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    setSession(loadSession());
    setHydrated(true);
  }, []);

  const openLogin = useCallback(() => setLoginModalOpen(true), []);
  const closeLogin = useCallback(() => setLoginModalOpen(false), []);

  const login = useCallback((account: MockAccount) => {
    const s = sessionFromAccount(account);
    saveSession(s);
    setSession(s);
    setLoginModalOpen(false);
    window.dispatchEvent(new CustomEvent("blockbuster-session"));
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    window.dispatchEvent(new CustomEvent("blockbuster-session"));
  }, []);

  const value = useMemo(
    () => ({
      session,
      hydrated,
      loginModalOpen,
      openLogin,
      closeLogin,
      login,
      logout,
    }),
    [session, hydrated, loginModalOpen, openLogin, closeLogin, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {loginModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-title"
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-xl"
            style={{
              borderColor: "var(--card-border)",
              background: "var(--background)",
              color: "var(--foreground)",
            }}
          >
            <h2
              id="login-title"
              className="text-lg font-extrabold tracking-tight"
            >
              Choose an account
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Demo accounts — no password. Rentals are saved per account on this
              device.
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {MOCK_ACCOUNTS.map((acct) => (
                <li key={acct.id}>
                  <button
                    type="button"
                    onClick={() => login(acct)}
                    className="w-full rounded-xl border px-4 py-3 text-left transition-colors hover:bg-white/5"
                    style={{ borderColor: "var(--card-border)" }}
                  >
                    <div className="font-semibold">{acct.name}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      {acct.email}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={closeLogin}
              className="mt-4 w-full rounded-full border py-2 text-sm font-semibold"
              style={{
                borderColor: "var(--card-border)",
                color: "var(--muted)",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </AuthContext.Provider>
  );
}
