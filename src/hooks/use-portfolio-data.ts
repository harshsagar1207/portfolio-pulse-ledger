import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api, isApiConfigured } from "@/lib/api";
import { pick, toNum } from "@/lib/format";

// Reads are client-only: the session token lives in the browser, so these do not run during SSR.
const enabled = () => typeof window !== "undefined" && isApiConfigured();

export const POLL_MS = 30_000;

export type Row = Record<string, unknown>;

export function useInstruments() {
  return useQuery({ queryKey: ["instruments"], queryFn: api.instruments, enabled: enabled(), refetchInterval: POLL_MS });
}
export function usePortfolio(id: string | null) {
  return useQuery({ queryKey: ["portfolio", id], queryFn: () => api.portfolio(id!), enabled: enabled() && !!id });
}
export function useAudit() {
  return useQuery({ queryKey: ["audit"], queryFn: api.audit, enabled: enabled() });
}
export function useReconcile() {
  return useQuery({ queryKey: ["reconcile"], queryFn: api.reconcile, enabled: enabled() });
}
export function useHealth() {
  return useQuery({ queryKey: ["health"], queryFn: api.health, enabled: enabled(), refetchInterval: 60_000, retry: false });
}

export const inst = {
  id: (r: Row) => String(pick(r, "instrument_id", "id") ?? ""),
  symbol: (r: Row) => String(pick(r, "symbol", "ticker", "code") ?? "—"),
  name: (r: Row) => String(pick(r, "name", "instrument_name", "scheme_name") ?? "—"),
  cls: (r: Row) => String(pick(r, "asset_class", "instrument_type", "type", "category") ?? "").toUpperCase(),
  exchange: (r: Row) => String(pick(r, "exchange", "exchange_code") ?? "—"),
  sector: (r: Row) => String(pick(r, "sector", "industry") ?? "—"),
  price: (r: Row) => toNum(pick(r, "latest_price", "last_price", "price", "nav", "ltp")),
  prev: (r: Row) => toNum(pick(r, "prev_close", "previous_close", "close")),
  ts: (r: Row) => pick(r, "price_ts", "latest_price_at", "price_time", "updated_at", "as_of"),
  tradable: (r: Row) => pick(r, "is_tradable", "tradable", "is_active"),
};

export const matchesClass = (r: Row, ...keys: string[]) => {
  const c = inst.cls(r);
  return keys.some((k) => c.includes(k));
};

const PKEY = "spms.portfolioIds";
export function usePortfolioIds() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    try { setIds(JSON.parse(localStorage.getItem(PKEY) ?? "[]")); } catch { /* ignore */ }
  }, []);
  const save = (next: string[]) => { setIds(next); localStorage.setItem(PKEY, JSON.stringify(next)); };
  return {
    ids,
    add: (id: string) => !ids.includes(id) && save([...ids, id]),
    remove: (id: string) => save(ids.filter((x) => x !== id)),
  };
}

/** Extract a positions array from a portfolio payload. */
export function positionsOf(p: Row | undefined): Row[] {
  if (!p) return [];
  for (const k of ["positions", "holdings", "items"]) if (Array.isArray(p[k])) return p[k] as Row[];
  return [];
}
export function cashOf(p: Row | undefined): Row | undefined {
  if (!p) return undefined;
  const c = pick(p, "cash", "cash_account", "cash_balance");
  if (c && typeof c === "object") return c as Row;
  return p;
}
