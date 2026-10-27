// Centralized client for the existing Portfolio backend API.
// The browser never talks to PostgreSQL; every call goes through VITE_API_BASE_URL.

export const API_BASE_URL: string | undefined =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/$/, "") || undefined;

export const isApiConfigured = () => Boolean(API_BASE_URL);

const TOKEN_KEY = "spms.session";

export interface StoredSession {
  token: string;
  user?: Record<string, unknown>;
  roles?: string[];
}

export function getSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function setSession(session: StoredSession | null) {
  if (typeof window === "undefined") return;
  if (session) window.sessionStorage.setItem(TOKEN_KEY, JSON.stringify(session));
  else window.sessionStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event("spms-session"));
}

export class ApiError extends Error {
  status: number;
  kind:
    | "not_configured"
    | "network"
    | "unauthorized"
    | "forbidden"
    | "not_found"
    | "validation"
    | "server";
  body: unknown;
  constructor(kind: ApiError["kind"], message: string, status = 0, body?: unknown) {
    super(message);
    this.kind = kind;
    this.status = status;
    this.body = body;
  }
}

function extractMessage(body: unknown, fallback: string): string {
  if (!body) return fallback;
  if (typeof body === "string") return body;
  const b = body as Record<string, unknown>;
  const d = b["detail"] ?? b["message"] ?? b["error"];
  if (typeof d === "string") return d;
  if (Array.isArray(d))
    return d
      .map((x) =>
        typeof x === "object" && x && "msg" in x ? String((x as { msg: unknown }).msg) : String(x),
      )
      .join("; ");
  return fallback;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  idempotencyKey?: string;
  auth?: boolean;
}

export async function apiRequest<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  if (!API_BASE_URL)
    throw new ApiError("not_configured", "Backend API is not connected. Set VITE_API_BASE_URL.");
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
  const session = getSession();
  if (opts.auth !== false && session?.token) headers["Authorization"] = `Bearer ${session.token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: opts.method ?? "GET",
      headers,
      credentials: "include",
      ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
    });
  } catch {
    throw new ApiError("network", "Could not reach the backend API. Check that it is running.");
  }

  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* keep text */
  }

  if (!res.ok) {
    if (res.status === 401) {
      if (session) setSession(null);
      throw new ApiError(
        "unauthorized",
        "Your session has expired. Please sign in again.",
        401,
        body,
      );
    }
    if (res.status === 403)
      throw new ApiError("forbidden", "You don't have permission to view this.", 403, body);
    if (res.status === 404)
      throw new ApiError("not_found", extractMessage(body, "Not found."), 404, body);
    if (res.status === 400 || res.status === 409 || res.status === 422)
      throw new ApiError(
        "validation",
        extractMessage(body, "The request was rejected."),
        res.status,
        body,
      );
    throw new ApiError(
      "server",
      extractMessage(body, `Server error (${res.status}).`),
      res.status,
      body,
    );
  }
  return body as T;
}

/** Accepts either a bare array or a common envelope ({items|data|results}). */
export function asList<T = Record<string, unknown>>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    for (const k of ["items", "data", "results", "instruments", "events", "rows"]) {
      if (Array.isArray(b[k])) return b[k] as T[];
    }
  }
  return [];
}

export const api = {
  portfolios: () => apiRequest<Portfolio[]>("/portfolios"),
  createPortfolio: (body: { name: string; base_currency?: string }) =>
    apiRequest<Portfolio>("/portfolios", { method: "POST", body }),
  deposit: (id: string, body: { amount: number; currency: string }, idempotencyKey: string) =>
    apiRequest<unknown>(`/portfolios/${encodeURIComponent(id)}/deposit`, {
      method: "POST",
      body,
      idempotencyKey,
    }),
  health: () => apiRequest<unknown>("/health", { auth: false }),
  login: (body: { username?: string; email?: string; password: string }) =>
    apiRequest<Record<string, unknown>>("/auth/login", { method: "POST", body, auth: false }),
  register: (body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>("/auth/register", { method: "POST", body, auth: false }),
  instruments: () => apiRequest<unknown>("/instruments", { auth: false }).then((b) => asList(b)),
  instrument: (id: string) =>
    apiRequest<Record<string, unknown>>(`/instruments/${encodeURIComponent(id)}`, { auth: false }),
  prices: () => apiRequest<unknown>("/prices", { auth: false }).then((b) => asList(b)),
  priceHistory: (id: string) =>
    apiRequest<unknown>(`/instruments/${encodeURIComponent(id)}/prices?limit=300`, {
      auth: false,
    }).then((b) => asList(b)),
  trades: (id: string) =>
    apiRequest<unknown>(`/portfolios/${encodeURIComponent(id)}/trades`).then((b) => asList(b)),
  ledger: (id: string) =>
    apiRequest<unknown>(`/portfolios/${encodeURIComponent(id)}/ledger`).then((b) => asList(b)),
  realizedPnl: (id: string) =>
    apiRequest<unknown>(`/portfolios/${encodeURIComponent(id)}/realized-pnl`).then((b) =>
      asList(b),
    ),
  valueHistory: (id: string) =>
    apiRequest<unknown>(`/portfolios/${encodeURIComponent(id)}/value-history?limit=500`).then((b) =>
      asList(b),
    ),
  watchlist: () => apiRequest<unknown>("/watchlist").then((b) => asList(b)),
  addToWatchlist: (instrumentId: string) =>
    apiRequest<unknown>(`/watchlist/${encodeURIComponent(instrumentId)}`, { method: "PUT" }),
  removeFromWatchlist: (instrumentId: string) =>
    apiRequest<unknown>(`/watchlist/${encodeURIComponent(instrumentId)}`, { method: "DELETE" }),
  orders: (portfolioId: string, status: string) => {
    const search = new URLSearchParams();
    if (portfolioId) search.set("portfolio_id", portfolioId);
    if (status) search.set("status", status);
    return apiRequest<unknown>(`/orders${search.size ? `?${search}` : ""}`).then((b) => asList(b));
  },
  cancelOrder: (id: string) =>
    apiRequest<unknown>(`/orders/${encodeURIComponent(id)}`, { method: "DELETE" }),
  portfolio: (id: string) =>
    apiRequest<Record<string, unknown>>(`/portfolios/${encodeURIComponent(id)}`),
  placeOrder: (body: Record<string, unknown>, idempotencyKey: string) =>
    apiRequest<Record<string, unknown>>("/orders", { method: "POST", body, idempotencyKey }),
  reconcile: () => apiRequest<unknown>("/admin/reconcile"),
  audit: () => apiRequest<unknown>("/audit").then((b) => asList(b)),
};

export interface Portfolio {
  portfolio_id: number;
  name: string;
  base_currency: string;
}
