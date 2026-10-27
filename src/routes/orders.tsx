import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/app/DataTable";
import { EmptyState, ErrorState, PageHeader, RequireApi, StatusBadge, TableSkeleton } from "@/components/app/states";
import { fmtNum, fmtTime, pick } from "@/lib/format";
import { api, isApiConfigured } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/order";
import { PortfolioPicker, useSelectedPortfolio } from "@/components/app/PortfolioPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

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
  const { session, ready } = useAuth();
  const { id, setId } = useSelectedPortfolio();
  const [status, setStatus] = useState("ALL");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const qc = useQueryClient();
  const valid = !id || (/^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0);
  const q = useQuery({ queryKey: ["orders", id, status, session?.token], queryFn: () => api.orders(id, status === "ALL" ? "" : status), enabled: ready && !!session?.token && valid && isApiConfigured(), refetchInterval: 5_000 });
  const cancel = useMutation({ mutationFn: api.cancelOrder, onSuccess: () => {
    qc.invalidateQueries({ queryKey: ["orders"] }); qc.invalidateQueries({ queryKey: ["portfolio"] }); setCancelId(null); toast.success("Cancellation request completed");
  } });
  const rows = q.data ?? [];
  return (
    <>
      <PageHeader title="Orders" description="Place orders from any instrument page in Markets." actions={<Button asChild><Link to="/markets">New order</Link></Button>} />
      <RequireApi>
      <div className="mb-5 flex flex-wrap items-end gap-3"><PortfolioPicker id={id} onChange={setId} allowAll /><div className="space-y-1.5"><p className="text-sm font-medium">Status</p><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-48" aria-label="Order status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All statuses</SelectItem>{ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div></div>
      {!ready ? <TableSkeleton /> : !session?.token ? <EmptyState title="Sign in to view orders"><Button asChild className="mt-4"><Link to="/login">Sign in</Link></Button></EmptyState> : !valid ? <EmptyState title="Enter a positive integer portfolio ID" /> : q.isPending ? <TableSkeleton /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : <div className="mb-8">
        <DataTable
          key={`${id}-${status}`}
          rows={rows}
          emptyTitle="No orders match these filters"
          csvName="orders"
          columns={[
            { key: "order_id", label: "Order ID", value: (r) => pick(r, "order_id", "id") },
            { key: "at", label: "Created", value: (r) => pick(r, "created_at", "ts", "at"), render: (r) => fmtTime(pick(r, "created_at", "ts", "at")) },
            { key: "symbol", label: "Instrument", value: (r) => pick(r, "symbol", "instrument_id") },
            { key: "side", render: (r) => <span className={r["side"] === "BUY" ? "text-gain" : "text-loss"}>{String(r["side"])}</span> },
            { key: "qty", label: "Qty", align: "right", value: (r) => pick(r, "qty", "quantity"), render: (r) => fmtNum(pick(r, "qty", "quantity")) },
            { key: "type", value: (r) => pick(r, "type", "order_type") },
            { key: "status", render: (r) => <StatusBadge status={String(r["status"])} /> },
            { key: "cancel", label: "Action", render: (r) => {
              const oid = pick(r, "order_id", "id");
              return oid != null && ["NEW", "ACCEPTED", "PARTIALLY_FILLED"].includes(String(r["status"]).toUpperCase()) ? <Button variant="outline" size="sm" disabled={cancel.isPending} onClick={() => { cancel.reset(); setCancelId(String(oid)); }}>Cancel</Button> : "—";
            } },
          ]}
        />
      </div>}
      </RequireApi>
      <Dialog open={cancelId !== null} onOpenChange={(open) => { if (!open && !cancel.isPending) setCancelId(null); }}><DialogContent><DialogHeader><DialogTitle>Cancel order {cancelId}?</DialogTitle><DialogDescription>Only the unfilled quantity can be cancelled. The backend checks the latest order status.</DialogDescription></DialogHeader>
        {cancel.error && <p role="alert" className="text-sm text-loss">{cancel.error.message}</p>}
        <div className="flex justify-end gap-2"><Button variant="outline" disabled={cancel.isPending} onClick={() => setCancelId(null)}>Keep order</Button><Button disabled={cancel.isPending} onClick={() => { if (cancelId) cancel.mutate(cancelId); }}>{cancel.isPending ? "Cancelling…" : "Confirm cancellation"}</Button></div>
      </DialogContent></Dialog>
    </>
  );
}
