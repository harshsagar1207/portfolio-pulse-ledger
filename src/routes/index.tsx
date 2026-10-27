import { createFileRoute, Link } from "@tanstack/react-router";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DataTable } from "@/components/app/DataTable";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  RequireApi,
  StatCard,
  TableSkeleton,
  Delta,
} from "@/components/app/states";
import { PortfolioValueHistory } from "@/components/app/PortfolioValueHistory";
import {
  cashOf,
  inst,
  matchesClass,
  positionsOf,
  useInstruments,
  usePortfolio,
  usePortfolioIds,
  type Row,
} from "@/hooks/use-portfolio-data";
import { fmtINR, fmtNum, fmtPct, fmtTime, pick, toNum } from "@/lib/format";
import { api, isApiConfigured } from "@/lib/api";
import { ArrowUpRight, Briefcase, LineChart, ListOrdered } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Dashboard · Stock Portfolio Management" },
      {
        name: "description",
        content: "Portfolio value, cash, holdings and Indian market indices at a glance.",
      },
      { property: "og:title", content: "Dashboard · Stock Portfolio Management" },
      {
        property: "og:description",
        content: "Portfolio value, cash, holdings and Indian market indices at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function holdingCols() {
  return [
    {
      key: "symbol",
      label: "Instrument",
      value: (r: Row) => pick(r, "symbol", "instrument_symbol", "name", "instrument_id"),
    },
    {
      key: "quantity",
      label: "Qty",
      align: "right" as const,
      render: (r: Row) => fmtNum(pick(r, "quantity", "qty")),
    },
    {
      key: "avg_cost",
      label: "Avg cost",
      align: "right" as const,
      render: (r: Row) => fmtINR(pick(r, "avg_cost", "average_cost")),
    },
    {
      key: "price",
      label: "Price",
      align: "right" as const,
      render: (r: Row) => fmtINR(pick(r, "latest_price", "current_price", "price")),
    },
    {
      key: "market_value",
      label: "Value",
      align: "right" as const,
      value: (r: Row) => pick(r, "market_value", "value"),
      render: (r: Row) => fmtINR(pick(r, "market_value", "value")),
    },
    {
      key: "pnl",
      label: "Unrealized P&L",
      align: "right" as const,
      value: (r: Row) => pick(r, "unrealized_pnl", "unrealized_pl"),
      render: (r: Row) => {
        const n = toNum(pick(r, "unrealized_pnl", "unrealized_pl"));
        return (
          <Delta value={n}>
            {fmtINR(n)} {fmtPct(pick(r, "unrealized_pnl_pct", "unrealized_pct"))}
          </Delta>
        );
      },
    },
  ];
}

function Dashboard() {
  const { ids } = usePortfolioIds();
  const pid = ids[0] ?? null;
  const p = usePortfolio(pid);
  const ins = useInstruments();
  const positions = positionsOf(p.data);
  const cash = cashOf(p.data);
  const indices = (ins.data ?? []).filter((r) => matchesClass(r, "INDEX")).slice(0, 6);

  const alloc = positions
    .map((r) => ({
      name: String(pick(r, "symbol", "instrument_symbol", "instrument_id")),
      value: toNum(pick(r, "market_value", "value")) ?? 0,
    }))
    .filter((x) => x.value > 0);
  const totalMv =
    toNum(pick(p.data, "market_value", "total_market_value")) ??
    (alloc.length ? alloc.reduce((a, b) => a + b.value, 0) : null);
  const unreal = toNum(pick(p.data, "unrealized_pnl", "unrealized_pl"));
  const real = toNum(pick(p.data, "realized_pnl", "realized_pl"));
  const currency = String(pick(p.data, "base_currency") ?? "INR");
  const [fundAmount, setFundAmount] = useState("100000");
  const [fundsOpen, setFundsOpen] = useState(false);
  const [fundError, setFundError] = useState("");
  const qc = useQueryClient();
  const deposit = useMutation({
    mutationFn: () =>
      api.deposit(pid!, { amount: Number(fundAmount), currency }, crypto.randomUUID()),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["portfolio", pid] });
      setFundsOpen(false);
    },
  });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={pid ? `Portfolio ${pid}` : "Your Indian-market portfolio overview"}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/portfolios">
              <Briefcase />
              My Portfolios
            </Link>
          </Button>
        }
      />
      {!isApiConfigured() && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {["Market value", "Invested value", "Available cash", "Unrealized P&L"].map((label) => (
              <StatCard key={label} label={label} value="—" hint="Awaiting account data" />
            ))}
          </div>
          <div className="mb-8">
            <RequireApi>
              <span />
            </RequireApi>
          </div>
          <section className="mb-8">
            <h2 className="mb-3 text-base font-semibold">Workspace</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  title: "My Portfolios",
                  to: "/portfolios",
                  icon: Briefcase,
                  label: "Holdings & cash",
                },
                {
                  title: "Markets",
                  to: "/markets",
                  icon: LineChart,
                  label: "Instruments & prices",
                },
                { title: "Orders", to: "/orders", icon: ListOrdered, label: "Session submissions" },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
                  </div>
                  <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-base font-semibold">Current holdings</h2>
            <EmptyState title="Holdings unavailable">
              Your holdings will appear after the Portfolio API is connected.
            </EmptyState>
          </section>
        </>
      )}
      {isApiConfigured() && (
        <RequireApi>
          <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {ins.isLoading ? (
              <TableSkeleton rows={2} />
            ) : ins.error ? (
              <div className="col-span-full">
                <ErrorState error={ins.error} onRetry={() => ins.refetch()} />
              </div>
            ) : indices.length ? (
              indices.map((r) => {
                const pr = inst.price(r),
                  prev = inst.prev(r);
                const ch = pr !== null && prev ? ((pr - prev) / prev) * 100 : null;
                return (
                  <StatCard
                    key={inst.id(r)}
                    label={inst.name(r)}
                    value={fmtNum(pr)}
                    hint={
                      <>
                        <Delta value={ch}>{ch === null ? "change n/a" : fmtPct(ch)}</Delta>
                        <p>As of {fmtTime(inst.ts(r))}</p>
                      </>
                    }
                  />
                );
              })
            ) : (
              <p className="col-span-full text-sm text-muted-foreground">
                No index instruments returned by the API.
              </p>
            )}
          </section>

          {!pid ? (
            <EmptyState title="No portfolio selected">
              <p>Open a portfolio by its ID to load holdings and cash.</p>
              <Button asChild size="sm" className="mt-4">
                <Link to="/portfolios">Go to My Portfolios</Link>
              </Button>
            </EmptyState>
          ) : p.isLoading ? (
            <TableSkeleton />
          ) : p.error ? (
            <ErrorState error={p.error} onRetry={() => p.refetch()} />
          ) : (
            <>
              <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
                <StatCard label="Market value" value={fmtINR(totalMv)} />
                <StatCard
                  label="Invested"
                  value={fmtINR(pick(p.data, "invested", "cost_basis", "total_cost"))}
                />
                <StatCard
                  label="Available cash"
                  value={fmtINR(pick(cash, "available", "available_balance", "balance"))}
                  hint={`Reserved ${fmtINR(pick(cash, "reserved", "reserved_amount"))}`}
                />
                <StatCard
                  label="Unrealized P&L"
                  value={fmtINR(unreal)}
                  tone={unreal === null ? undefined : unreal >= 0 ? "gain" : "loss"}
                />
                <StatCard
                  label="Realized P&L"
                  value={fmtINR(real)}
                  tone={real === null ? undefined : real >= 0 ? "gain" : "loss"}
                />
              </section>
              <section className="mb-6 rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">Add funds</h2>
                    <p className="text-sm text-muted-foreground">
                      Deposit into {String(pick(p.data, "name") ?? "this portfolio")} in {currency}.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setFundsOpen((open) => !open)}>
                    Add funds
                  </Button>
                </div>
                {fundsOpen && (
                  <form
                    className="mt-4 flex flex-wrap items-end gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!/^\d+(\.\d{1,4})?$/.test(fundAmount) || Number(fundAmount) <= 0) {
                        setFundError(
                          "Enter a positive amount with at most four decimal places and no commas.",
                        );
                        return;
                      }
                      setFundError("");
                      deposit.mutate();
                    }}
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="dashboard-fund-amount">Amount ({currency})</Label>
                      <Input
                        id="dashboard-fund-amount"
                        className="w-48"
                        inputMode="decimal"
                        value={fundAmount}
                        onChange={(event) => setFundAmount(event.target.value)}
                      />
                    </div>
                    {["10000", "100000", "1000000"].map((value) => (
                      <Button
                        key={value}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFundAmount(value)}
                      >
                        {new Intl.NumberFormat("en-IN").format(Number(value))}
                      </Button>
                    ))}
                    <Button type="submit" disabled={deposit.isPending}>
                      {deposit.isPending ? "Depositing…" : "Deposit"}
                    </Button>
                    {(fundError || deposit.error) && (
                      <p role="alert" className="w-full text-sm text-loss">
                        {fundError || deposit.error?.message}
                      </p>
                    )}
                  </form>
                )}
              </section>
              <section className="mb-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-lg border bg-card p-4">
                  <p className="mb-2 text-sm font-medium">Holdings allocation</p>
                  {alloc.length ? (
                    <div className="h-56">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={alloc}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={50}
                            outerRadius={85}
                            paddingAngle={2}
                          >
                            {alloc.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => fmtINR(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="py-16 text-center text-sm text-muted-foreground">
                      No valued holdings.
                    </p>
                  )}
                </div>
                <div className="lg:col-span-2 rounded-lg border bg-card p-4">
                  <p className="mb-2 text-sm font-medium">Portfolio value over time</p>
                  <PortfolioValueHistory id={pid} />
                </div>
              </section>
              <h2 className="mb-3 text-sm font-semibold">Current holdings</h2>
              <DataTable
                rows={positions}
                columns={holdingCols()}
                emptyTitle="No holdings in this portfolio"
                pageSize={8}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Prices last refreshed{" "}
                {ins.priceUpdatedAt ? fmtTime(new Date(ins.priceUpdatedAt).toISOString()) : "—"} ·
                simulated feed
              </p>
            </>
          )}
        </RequireApi>
      )}
    </>
  );
}
