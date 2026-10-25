import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/app/DataTable";
import { loadSessionOrders, type SubmittedOrder } from "@/components/app/OrderDialog";
import { NotConnected, PageHeader, StatusBadge } from "@/components/app/states";
import { fmtNum, fmtTime } from "@/lib/format";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Orders · Stock Portfolio Management" },
      { name: "description", content: "Orders submitted and their status." },
      { property: "og:title", content: "Orders · Stock Portfolio Management" },
      { property: "og:description", content: "Orders submitted and their status." },
    ],
  }),
  component: Orders,
});

function Orders() {
  const [rows, setRows] = useState<SubmittedOrder[]>([]);
  useEffect(() => setRows(loadSessionOrders()), []);
  return (
    <>
      <PageHeader title="Orders" description="Place orders from any instrument page in Markets." actions={<Button asChild><Link to="/markets">New order</Link></Button>} />
      <h2 className="mb-2 text-sm font-semibold">Submitted this session</h2>
      <p className="mb-3 text-xs text-muted-foreground">Status shown is what the backend returned at submission. Accepted orders are filled later by the matching engine.</p>
      <div className="mb-8">
        <DataTable
          rows={rows as unknown as Record<string, unknown>[]}
          emptyTitle="No orders submitted in this session"
          columns={[
            { key: "order_id", label: "Order ID", render: (r) => <span className="num">{String(r["order_id"])}</span> },
            { key: "at", label: "Created", render: (r) => fmtTime(r["at"]) },
            { key: "symbol", label: "Instrument" },
            { key: "side", render: (r) => <span className={r["side"] === "BUY" ? "text-gain" : "text-loss"}>{String(r["side"])}</span> },
            { key: "quantity", label: "Qty", align: "right", render: (r) => fmtNum(r["quantity"]) },
            { key: "status", render: (r) => <StatusBadge status={String(r["status"])} /> },
          ]}
        />
      </div>
      <NotConnected feature="Full order history & cancellation" detail="No verified endpoint lists orders or cancels them. Cancel actions will appear only once the backend exposes them." />
    </>
  );
}
