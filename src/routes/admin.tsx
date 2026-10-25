import { createFileRoute } from "@tanstack/react-router";
import { autoColumns, DataTable } from "@/components/app/DataTable";
import { ErrorState, PageHeader, RequireApi, TableSkeleton } from "@/components/app/states";
import { useReconcile } from "@/hooks/use-portfolio-data";
import { asList } from "@/lib/api";
import { humanize } from "@/lib/format";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administration · Stock Portfolio Management" },
      { name: "description", content: "System reconciliation results." },
      { property: "og:title", content: "Administration · Stock Portfolio Management" },
      { property: "og:description", content: "System reconciliation results." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const q = useReconcile();
  const list = asList(q.data);
  const obj = !list.length && q.data && typeof q.data === "object" ? (q.data as Record<string, unknown>) : null;
  return (
    <>
      <PageHeader title="Administration" description="Reconciliation of cash and positions. Access is enforced by the backend." />
      <RequireApi>
        {q.isLoading ? <TableSkeleton /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : obj ? (
          <dl className="rounded-lg border bg-card">
            {Object.entries(obj).map(([k, v]) => (
              <div key={k} className="flex flex-wrap justify-between gap-3 border-b px-4 py-2 text-sm last:border-0">
                <dt className="text-muted-foreground">{humanize(k)}</dt>
                <dd className="num min-w-0 max-w-full break-words">{typeof v === "object" ? <pre className="overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(v, null, 2)}</pre> : String(v)}</dd>
              </div>
            ))}
          </dl>
        ) : <DataTable rows={list} columns={autoColumns(list)} csvName="reconciliation" emptyTitle="No reconciliation discrepancies" />}
      </RequireApi>
    </>
  );
}
