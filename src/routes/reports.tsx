import { createFileRoute } from "@tanstack/react-router";
import { NotConnected, PageHeader, RequireApi } from "@/components/app/states";
import { PortfolioPicker, useSelectedPortfolio } from "@/components/app/PortfolioPicker";
import { PortfolioHistory } from "@/components/app/PortfolioHistory";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Reports · Stock Portfolio Management" },
      { name: "description", content: "Holdings, P&L, order and ledger reports." },
      { property: "og:title", content: "Reports · Stock Portfolio Management" },
      { property: "og:description", content: "Holdings, P&L, order and ledger reports." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { id, setId } = useSelectedPortfolio();
  return (
    <>
      <PageHeader title="Reports" description="Holdings, P&L, order and ledger reports." />
      <RequireApi>
        <div className="mb-5"><PortfolioPicker id={id} onChange={setId} /></div>
        <section className="mb-8"><h2 className="mb-3 text-base font-semibold">Realized P&L</h2><PortfolioHistory id={id} kind="realizedPnl" /></section>
      </RequireApi>
      <NotConnected feature="Portfolio value history" detail="The Portfolio API does not yet provide value history." />
    </>
  );
}
