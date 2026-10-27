import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LineChart } from "lucide-react";
import { DataTable } from "@/components/app/DataTable";
import {
  ErrorState,
  PageHeader,
  RequireApi,
  StatCard,
  TableSkeleton,
} from "@/components/app/states";
import { cashOf, positionsOf, usePortfolio } from "@/hooks/use-portfolio-data";
import { fmtINR, pick } from "@/lib/format";
import { holdingCols } from "./index";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { OrderDialog } from "@/components/app/OrderDialog";
import { toNum } from "@/lib/format";

export const Route = createFileRoute("/portfolios_/$id")({
  head: ({ params }) => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: `Portfolio ${params.id} · Stock Portfolio Management` },
      { name: "description", content: "Holdings, cash and allocation for this portfolio." },
      { property: "og:title", content: `Portfolio ${params.id} · Stock Portfolio Management` },
      { property: "og:description", content: "Holdings, cash and allocation for this portfolio." },
    ],
  }),
  component: PortfolioDetail,
});

function PortfolioDetail() {
  const { id } = Route.useParams();
  const p = usePortfolio(id);
  const cash = cashOf(p.data);
  const currency = String(pick(p.data, "base_currency") ?? "INR");
  const [amount, setAmount] = useState("100000");
  const [showDeposit, setShowDeposit] = useState(false);
  const [validation, setValidation] = useState("");
  const qc = useQueryClient();
  const deposit = useMutation({
    mutationFn: () => api.deposit(id, { amount: Number(amount), currency }, crypto.randomUUID()),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["portfolio", id] });
      setShowDeposit(false);
    },
  });
  return (
    <>
      <Button asChild variant="link" size="sm" className="mb-3 px-0">
        <Link to="/portfolios">
          <ArrowLeft />
          My Portfolios
        </Link>
      </Button>
      <PageHeader
        title={String(pick(p.data, "name", "portfolio_name") ?? `Portfolio ${id}`)}
        description={`ID ${id}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowDeposit((shown) => !shown)}>
              Add funds
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/markets">
                <LineChart />
                Markets
              </Link>
            </Button>
          </>
        }
      />
      <RequireApi>
        {p.isLoading ? (
          <TableSkeleton />
        ) : p.error ? (
          <ErrorState error={p.error} onRetry={() => p.refetch()} />
        ) : (
          <>
            {showDeposit && (
              <form
                className="mb-6 max-w-md space-y-3 rounded-lg border bg-card p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!/^\d+(\.\d{1,4})?$/.test(amount) || Number(amount) <= 0) {
                    setValidation(
                      "Enter a positive amount with at most four decimal places and no commas.",
                    );
                    return;
                  }
                  setValidation("");
                  deposit.mutate();
                }}
              >
                <div>
                  <h2 className="font-semibold">Add funds</h2>
                  <p className="text-sm text-muted-foreground">
                    Deposits use this portfolio’s base currency ({currency}).
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="deposit-amount">Amount ({currency})</Label>
                  <Input
                    id="deposit-amount"
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    disabled={deposit.isPending}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {["10000", "100000", "1000000"].map((value) => (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setAmount(value)}
                    >
                      {new Intl.NumberFormat("en-IN").format(Number(value))}
                    </Button>
                  ))}
                </div>
                {(validation || deposit.error) && (
                  <p role="alert" className="text-sm text-loss">
                    {validation || deposit.error?.message}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={deposit.isPending}
                    onClick={() => setShowDeposit(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={deposit.isPending}>
                    {deposit.isPending ? "Depositing…" : "Deposit funds"}
                  </Button>
                </div>
              </form>
            )}
            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard
                label="Cash balance"
                value={fmtINR(pick(cash, "balance", "cash_balance"))}
              />
              <StatCard
                label="Reserved"
                value={fmtINR(pick(cash, "reserved", "reserved_amount"))}
              />
              <StatCard
                label="Available"
                value={fmtINR(pick(cash, "available", "available_balance"))}
              />
              <StatCard
                label="Market value"
                value={fmtINR(pick(p.data, "market_value", "total_market_value"))}
              />
            </div>
            <DataTable
              rows={positionsOf(p.data)}
              columns={[
                ...holdingCols(),
                {
                  key: "sell",
                  label: "Action",
                  render: (row) => (
                    <OrderDialog
                      instrumentId={String(row["instrument_id"])}
                      symbol={String(row["symbol"] ?? "Instrument")}
                      price={toNum(row["last_price"])}
                      lotSize={toNum(row["lot_size"])}
                      tickSize={toNum(row["tick_size"])}
                      defaultSide="SELL"
                      trigger={
                        <Button size="sm" variant="outline">
                          Sell
                        </Button>
                      }
                    />
                  ),
                },
              ]}
              emptyTitle="No holdings"
              csvName={`portfolio-${id}-holdings`}
            />
          </>
        )}
      </RequireApi>
    </>
  );
}
