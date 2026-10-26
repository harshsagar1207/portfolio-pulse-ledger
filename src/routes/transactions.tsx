import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, RequireApi } from "@/components/app/states";
import { PortfolioPicker, useSelectedPortfolio } from "@/components/app/PortfolioPicker";
import { PortfolioHistory } from "@/components/app/PortfolioHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Transactions · Stock Portfolio Management" },
      { name: "description", content: "Executed trades and cash-ledger history." },
      { property: "og:title", content: "Transactions · Stock Portfolio Management" },
      { property: "og:description", content: "Executed trades and cash-ledger history." },
    ],
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { id, setId } = useSelectedPortfolio();
  return (
    <>
      <PageHeader title="Transactions" description="Executed trades and cash-ledger history." />
      <RequireApi>
        <div className="mb-5"><PortfolioPicker id={id} onChange={setId} /></div>
        <Tabs defaultValue="trades"><TabsList className="mb-4"><TabsTrigger value="trades">Executed trades</TabsTrigger><TabsTrigger value="ledger">Cash ledger</TabsTrigger></TabsList>
          <TabsContent value="trades"><PortfolioHistory id={id} kind="trades" /></TabsContent>
          <TabsContent value="ledger"><PortfolioHistory id={id} kind="ledger" /></TabsContent>
        </Tabs>
      </RequireApi>
    </>
  );
}
