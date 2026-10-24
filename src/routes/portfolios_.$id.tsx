import { createFileRoute } from "@tanstack/react-router";
import { DataTable } from "@/components/app/DataTable";
import { ErrorState, PageHeader, RequireApi, StatCard, TableSkeleton } from "@/components/app/states";
import { cashOf, positionsOf, usePortfolio } from "@/hooks/use-portfolio-data";
import { fmtINR, pick } from "@/lib/format";
import { holdingCols } from "./index";

export const Route = createFileRoute("/portfolios_/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Portfolio ${params.id} · Stock Portfolio Management` },
      { name: "description", content: "Holdings, cash and allocation for this portfolio." },
      { property: "og:title", content: `Portfolio ${params.id}` },
      { property: "og:description", content: "Holdings, cash and allocation for this portfolio." },
    ],
  }),
  component: PortfolioDetail,
});

function PortfolioDetail() {
  const { id } = Route.useParams();
  const p = usePortfolio(id);
  const cash = cashOf(p.data);
  return (
    <>
      <PageHeader title={String(pick(p.data, "name", "portfolio_name") ?? `Portfolio ${id}`)} description={`ID ${id}`} />
      <RequireApi>
        {p.isLoading ? <TableSkeleton /> : p.error ? <ErrorState error={p.error} onRetry={() => p.refetch()} /> : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Cash balance" value={fmtINR(pick(cash, "balance", "cash_balance"))} />
              <StatCard label="Reserved" value={fmtINR(pick(cash, "reserved", "reserved_amount"))} />
              <StatCard label="Available" value={fmtINR(pick(cash, "available", "available_balance"))} />
              <StatCard label="Market value" value={fmtINR(pick(p.data, "market_value", "total_market_value"))} />
            </div>
            <DataTable rows={positionsOf(p.data)} columns={holdingCols()} emptyTitle="No holdings" csvName={`portfolio-${id}-holdings`} />
          </>
        )}
      </RequireApi>
    </>
  );
}
