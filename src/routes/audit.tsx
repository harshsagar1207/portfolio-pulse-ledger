import { createFileRoute } from "@tanstack/react-router";
import { autoColumns, DataTable } from "@/components/app/DataTable";
import { ErrorState, PageHeader, RequireApi, TableSkeleton } from "@/components/app/states";
import { useAudit } from "@/hooks/use-portfolio-data";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Logs · Stock Portfolio Management" },
      { name: "description", content: "Audit events for authorized users." },
      { property: "og:title", content: "Audit Logs · Stock Portfolio Management" },
      { property: "og:description", content: "Audit events for authorized users." },
    ],
  }),
  component: Audit,
});

function Audit() {
  const q = useAudit();
  return (
    <>
      <PageHeader title="Audit Logs" description="Access is enforced by the backend." />
      <RequireApi>
        {q.isLoading ? <TableSkeleton /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : (
          <DataTable rows={q.data ?? []} columns={autoColumns(q.data ?? [])} csvName="audit-events" emptyTitle="No audit events" />
        )}
      </RequireApi>
    </>
  );
}
