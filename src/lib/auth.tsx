import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSession, setSession, type StoredSession } from "./api";

interface AuthCtx {
  session: StoredSession | null;
  ready: boolean;
  roles: string[];
  hasRole: (...r: string[]) => boolean;
  signIn: (body: Record<string, unknown>) => void;
  signOut: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

function rolesFrom(body: Record<string, unknown>): string[] {
  const user = (body.user ?? {}) as Record<string, unknown>;
  const raw = body.roles ?? user.roles ?? body.role ?? user.role;
  if (Array.isArray(raw)) return raw.map((r) => String(typeof r === "object" && r ? (r as { name?: unknown }).name ?? "" : r).toLowerCase());
  if (typeof raw === "string") return [raw.toLowerCase()];
  return [];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setS] = useState<StoredSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setS(getSession());
    sync();
    setReady(true);
    window.addEventListener("spms-session", sync);
    return () => window.removeEventListener("spms-session", sync);
  }, []);

  const roles = session?.roles ?? [];
  const value: AuthCtx = {
    session,
    ready,
    roles,
    hasRole: (...r) => r.some((x) => roles.includes(x)),
    signIn: (body) => {
      const token = String(body.access_token ?? body.token ?? body.jwt ?? "");
      setSession({ token, user: (body.user as Record<string, unknown>) ?? undefined, roles: rolesFrom(body) });
    },
    signOut: () => setSession(null),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
