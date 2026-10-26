import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderDialog } from "@/components/app/OrderDialog";
import { DemoBadge, EmptyState, ErrorState, PageHeader, RequireApi, StatCard, TableSkeleton } from "@/components/app/states";
import { inst, useInstrument } from "@/hooks/use-portfolio-data";
import { fmtINR, fmtTime, humanize, toNum } from "@/lib/format";
import { PriceChart } from "@/components/app/PriceChart";

export const Route = createFileRoute("/markets_/$id")({
  head: ({ params }) => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: `Instrument ${params.id} · Stock Portfolio Management` },
      { name: "description", content: "Latest price and details for an instrument." },
      { property: "og:title", content: `Instrument ${params.id} · Stock Portfolio Management` },
      { property: "og:description", content: "Latest price and details for an instrument." },
    ],
  }),
  component: InstrumentDetail,
});

function InstrumentDetail() {
  const { id } = Route.useParams();
  const q = useInstrument(id);
  const r = q.data;
  const tradable = r ? inst.tradable(r) !== false && !inst.cls(r).includes("INDEX") : false;
  return (
    <><Button asChild variant="link" size="sm" className="mb-3 px-0"><Link to="/markets"><ArrowLeft />Markets</Link></Button><RequireApi>
      {q.isLoading ? <TableSkeleton /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : !r ? <EmptyState title="Instrument not found" /> : (
        <>
          <PageHeader title={inst.symbol(r)} description={`${inst.name(r)} · ${inst.cls(r) || "—"} · ${inst.exchange(r)}`}
            actions={tradable && (
              <>
                <OrderDialog instrumentId={id} symbol={inst.symbol(r)} price={inst.price(r)} lotSize={toNum(r["lot_size"])} tickSize={toNum(r["tick_size"])} defaultSide="BUY" trigger={<Button>Buy</Button>} />
                <OrderDialog instrumentId={id} symbol={inst.symbol(r)} price={inst.price(r)} lotSize={toNum(r["lot_size"])} tickSize={toNum(r["tick_size"])} defaultSide="SELL" trigger={<Button variant="outline">Sell</Button>} />
              </>
            )} />
          <div className="mb-6 grid gap-3 md:grid-cols-3">
            <StatCard label="Latest price" value={fmtINR(inst.price(r))} hint={<>As of {fmtTime(inst.ts(r))} · <DemoBadge /></>} />
          </div>
          {q.priceError && <p role="alert" className="mb-4 text-sm text-loss">Live price updates unavailable; showing the last received price.</p>}
          <div className="mb-6 rounded-lg border bg-card">
            <dl className="grid divide-y sm:grid-cols-2 sm:divide-y-0">
              {Object.entries(r).filter(([, v]) => v !== null && typeof v !== "object").map(([k, v]) => (
                <div key={k} className="flex min-w-0 justify-between gap-4 border-b px-4 py-2 text-sm">
                  <dt className="text-muted-foreground">{humanize(k)}</dt><dd className="num min-w-0 break-words text-right">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <PriceChart id={id} />
        </>
      )}
    </RequireApi></>
  );
}
