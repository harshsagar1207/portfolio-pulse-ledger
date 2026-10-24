const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const num = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 4 });

export const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

export const fmtINR = (v: unknown) => {
  const n = toNum(v);
  return n === null ? "—" : inr.format(n);
};
export const fmtNum = (v: unknown) => {
  const n = toNum(v);
  return n === null ? "—" : num.format(n);
};
export const fmtPct = (v: unknown) => {
  const n = toNum(v);
  return n === null ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
};
export const fmtTime = (v: unknown) => {
  if (!v) return "—";
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? String(v) : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

/** Pick the first present field among candidate names (backend schemas are not yet verified). */
export function pick(obj: Record<string, unknown> | undefined | null, ...keys: string[]): unknown {
  if (!obj) return undefined;
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  return undefined;
}

export const humanize = (k: string) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
