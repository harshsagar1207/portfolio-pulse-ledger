import { createFileRoute } from "@tanstack/react-router";
import { NotConnected, PageHeader } from "@/components/app/states";

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
  return (
    <>
      <PageHeader title="Transactions" description="Executed trades and cash-ledger history." />
      <NotConnected feature="Trade & cash-ledger history" detail="No verified endpoint lists trades or ledger entries yet. Executed trades will appear here once exposed." />
    </>
  );
}
