import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePriceHistory } from "@/hooks/use-portfolio-data";
import { fmtINR, fmtTime, toNum } from "@/lib/format";
import { EmptyState, ErrorState, TableSkeleton } from "./states";
import { DataTable } from "./DataTable";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function PriceChart({ id }: { id: string }) {
  const q = usePriceHistory(id);
  const [view, setView] = useState("chart");
  const rows: Record<string, unknown>[] = (q.data ?? []).map((r) => ({ ...r, close: toNum(r["close"]) }));
  return <section className="mt-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold">Price history</h2><p className="text-xs text-muted-foreground">1-minute candles · simulated prices</p></div><Tabs value={view} onValueChange={setView}><TabsList><TabsTrigger value="chart">Chart</TabsTrigger><TabsTrigger value="candles">OHLCV</TabsTrigger></TabsList></Tabs></div>
    {q.isPending ? <TableSkeleton /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : !rows.length ? <EmptyState title="Waiting for the first candle">One-minute price history will appear as the simulator runs.</EmptyState> : view === "chart" ? <div className="h-72 w-full" role="img" aria-label="One-minute closing prices">
      <ResponsiveContainer width="100%" height="100%"><LineChart data={rows} margin={{ top: 10, right: 16, bottom: 8, left: 8 }}><XAxis dataKey="ts" tickFormatter={(v) => new Date(String(v)).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} minTickGap={60} /><YAxis domain={["auto", "auto"]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} width={72} /><Tooltip labelFormatter={fmtTime} formatter={(v) => fmtINR(v)} contentStyle={{ background: "var(--popover)", borderColor: "var(--border)", color: "var(--foreground)" }} /><Line dataKey="close" name="Close" stroke="var(--chart-2)" strokeWidth={2} dot={rows.length === 1} isAnimationActive={false} /></LineChart></ResponsiveContainer>
    </div> : <DataTable rows={rows} csvName={`instrument-${id}-candles`} columns={[
      { key: "ts", label: "Time", render: (r) => fmtTime(r["ts"]) },
      ...["open", "high", "low", "close"].map((key) => ({ key, align: "right" as const, render: (r: Record<string, unknown>) => fmtINR(r[key]) })),
      { key: "volume", align: "right" },
    ]} />}
  </section>;
}