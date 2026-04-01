export type MockAccount = {
  id: string;
  name: string;
  email: string;
};

/** Pre-made demo accounts (no password — pick one to sign in). */
export const MOCK_ACCOUNTS: MockAccount[] = [
  { id: "acct-alex", name: "Alex Chen", email: "alex.chen@example.com" },
  { id: "acct-jordan", name: "Jordan Miles", email: "jordan.miles@example.com" },
  { id: "acct-sam", name: "Sam Rivera", email: "sam.rivera@example.com" },
];

const SESSION_KEY = "blockbuster:session:v1";

export type Session = {
  userId: string;
  name: string;
  email: string;
};

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    if (
      typeof o.userId !== "string" ||
      typeof o.name !== "string" ||
      typeof o.email !== "string"
    ) {
      return null;
    }
    return { userId: o.userId, name: o.name, email: o.email };
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function sessionFromAccount(account: MockAccount): Session {
  return {
    userId: account.id,
    name: account.name,
    email: account.email,
  };
}
