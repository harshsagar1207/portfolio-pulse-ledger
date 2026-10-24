import { useNavigate } from "@tanstack/react-router";
import { useInstruments, matchesClass, inst, type Row } from "@/hooks/use-portfolio-data";
import { autoColumns, DataTable } from "./DataTable";
import { ErrorState, PageHeader, RequireApi, TableSkeleton, DemoBadge } from "./states";

/** Lists instruments of one asset class with whatever fields the API returns — no invented values. */
export function AssetClassPage({ title, description, classes }: { title: string; description: string; classes: string[] }) {
  const q = useInstruments();
  const navigate = useNavigate();
  const rows = (q.data ?? []).filter((r) => matchesClass(r, ...classes));
  return (
    <>
      <PageHeader title={title} description={description} actions={<DemoBadge />} />
      <RequireApi>
        {q.isLoading ? <TableSkeleton /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : (
          <DataTable
            rows={rows as Row[]}
            columns={autoColumns(rows)}
            csvName={title.toLowerCase().replace(/\s/g, "-")}
            emptyTitle={`No ${title.toLowerCase()} returned by the API`}
            onRowClick={(r) => navigate({ to: "/markets/$id", params: { id: inst.id(r) } })}
          />
        )}
      </RequireApi>
    </>
  );
}
