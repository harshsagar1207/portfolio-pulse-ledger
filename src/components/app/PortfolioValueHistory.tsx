import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useValueHistory } from "@/hooks/use-portfolio-data";
import { fmtINR, fmtTime, toNum } from "@/lib/format";
import { EmptyState, ErrorState, TableSkeleton } from "./states";

export function PortfolioValueHistory({ id }: { id: string }) {
  const q = useValueHistory(id);
  const rows = (q.data ?? []).map((row) => ({
    ...row,
    total: toNum(row["total"]),
    cash: toNum(row["cash"]),
    holdings: toNum(row["holdings"]),
  }));
  if (!id) return <EmptyState title="Select a portfolio" />;
  if (q.isPending) return <TableSkeleton />;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!rows.length)
    return (
      <EmptyState title="Waiting for portfolio history">
        One-minute value points will appear as the portfolio is valued.
      </EmptyState>
    );
  return (
    <div className="h-72 w-full" role="img" aria-label="Portfolio total value history">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 10, right: 16, bottom: 8, left: 8 }}>
          <XAxis
            dataKey="ts"
            tickFormatter={(v) =>
              new Date(String(v)).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })
            }
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            minTickGap={60}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            width={72}
          />
          <Tooltip
            labelFormatter={fmtTime}
            formatter={(v) => fmtINR(v)}
            contentStyle={{
              background: "var(--popover)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
          <Line
            dataKey="total"
            name="Total"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={rows.length === 1}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
