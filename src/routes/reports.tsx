import { createFileRoute } from "@tanstack/react-router";
import { NotConnected, PageHeader } from "@/components/app/states";

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
  return (
    <>
      <PageHeader title="Reports" description="Holdings, P&L, order and ledger reports." />
      <NotConnected feature="Reports" detail="Value history, realized P&L, and ledger reports need endpoints that are not yet verified. Holdings can be exported as CSV from each portfolio page." />
    </>
  );
}
