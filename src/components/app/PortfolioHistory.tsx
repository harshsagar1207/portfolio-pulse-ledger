import { useQuery } from "@tanstack/react-query";
import { api, isApiConfigured } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { DataTable, autoColumns } from "./DataTable";
import { EmptyState, ErrorState, TableSkeleton } from "./states";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Delta } from "./states";
import { fmtINR, fmtNum, toNum } from "@/lib/format";

export function PortfolioHistory({ id, kind }: { id: string; kind: "trades" | "ledger" | "realizedPnl" }) {
  const { session, ready } = useAuth();
  const valid = /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0;
  const q = useQuery({ queryKey: ["portfolio-history", kind, id, session?.token], queryFn: () => api[kind](id), enabled: ready && !!session?.token && valid && isApiConfigured(), refetchInterval: 15_000 });
  if (!ready) return <TableSkeleton />;
  if (!session?.token) return <EmptyState title="Sign in to view account history"><Button asChild className="mt-4" size="sm"><Link to="/login">Sign in</Link></Button></EmptyState>;
  if (!valid) return <EmptyState title="Select a portfolio">Enter a positive integer portfolio ID.</EmptyState>;
  if (q.isPending) return <TableSkeleton />;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const rows = q.data ?? [];
  return <DataTable key={`${kind}-${id}`} rows={rows} csvName={`portfolio-${id}-${kind}`} emptyTitle={kind === "trades" ? "No executed trades" : kind === "ledger" ? "No cash-ledger entries" : "No realized P&L yet"} columns={kind === "realizedPnl" ? [
    { key: "symbol", label: "Instrument" },
    { key: "qty", label: "Qty", align: "right", render: (r) => fmtNum(r["qty"]) },
    { key: "proceeds", align: "right", render: (r) => fmtINR(r["proceeds"]) },
    { key: "cost", align: "right", render: (r) => fmtINR(r["cost"]) },
    { key: "realized_pnl", label: "Realized P&L", align: "right", render: (r) => <Delta value={toNum(r["realized_pnl"])}>{fmtINR(r["realized_pnl"])}</Delta> },
  ] : autoColumns(rows)} />;
}