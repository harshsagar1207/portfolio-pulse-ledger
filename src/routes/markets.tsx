import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/app/DataTable";
import { DemoBadge, ErrorState, PageHeader, RequireApi, TableSkeleton, Delta } from "@/components/app/states";
import { inst, useInstruments, type Row } from "@/hooks/use-portfolio-data";
import { fmtINR, fmtPct, fmtTime } from "@/lib/format";

export const Route = createFileRoute("/markets")({
  head: () => ({
    meta: [
      { title: "Markets · Stock Portfolio Management" },
      { name: "description", content: "Search Indian equities, indices, funds, bonds and IPOs." },
      { property: "og:title", content: "Markets · Stock Portfolio Management" },
      { property: "og:description", content: "Search Indian equities, indices, funds, bonds and IPOs." },
    ],
  }),
  component: Markets,
});

function Markets() {
  const q = useInstruments();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [cls, setCls] = useState("ALL");
  const [sector, setSector] = useState("ALL");
  const [exch, setExch] = useState("ALL");
  const all = q.data ?? [];
  const opts = (f: (r: Row) => string) => ["ALL", ...[...new Set(all.map(f).filter((x) => x && x !== "—"))].sort()];
  const rows = useMemo(() => all.filter((r) =>
    (cls === "ALL" || inst.cls(r) === cls) && (sector === "ALL" || inst.sector(r) === sector) && (exch === "ALL" || inst.exchange(r) === exch) &&
    (!search || `${inst.symbol(r)} ${inst.name(r)}`.toLowerCase().includes(search.toLowerCase()))), [all, cls, sector, exch, search]);

  const filters: [string, string, (v: string) => void, string[]][] = [
    ["Asset class", cls, setCls, opts(inst.cls)], ["Sector", sector, setSector, opts(inst.sector)], ["Exchange", exch, setExch, opts(inst.exchange)],
  ];

  return (
    <>
      <PageHeader title="Markets" description="Instruments and latest prices from the backend." actions={<><DemoBadge /><Button variant="outline" size="sm" onClick={() => q.refetch()}><RefreshCw className="mr-1 h-3.5 w-3.5" />Refresh</Button></>} />
      <RequireApi>
        <div className="mb-4 flex flex-wrap gap-2">
          <Input className="max-w-xs" placeholder="Search symbol or name" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" />
          {filters.map(([label, val, set, o]) => (
            <Select key={label} value={val} onValueChange={set}>
              <SelectTrigger className="w-40" aria-label={label}><SelectValue /></SelectTrigger>
              <SelectContent>{o.map((x) => <SelectItem key={x} value={x}>{x === "ALL" ? `All ${label.toLowerCase()}` : x}</SelectItem>)}</SelectContent>
            </Select>
          ))}
        </div>
        {q.isLoading ? <TableSkeleton /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : (
          <DataTable
            rows={rows}
            csvName="instruments"
            emptyTitle="No instruments match"
            onRowClick={(r) => navigate({ to: "/markets/$id", params: { id: inst.id(r) } })}
            columns={[
              { key: "symbol", value: inst.symbol, render: (r) => <span className="font-medium">{inst.symbol(r)}</span> },
              { key: "name", value: inst.name },
              { key: "class", label: "Class", value: inst.cls },
              { key: "exchange", value: inst.exchange },
              { key: "sector", value: inst.sector },
              { key: "price", label: "Latest", align: "right", value: inst.price, render: (r) => fmtINR(inst.price(r)) },
              { key: "chg", label: "Change", align: "right", value: (r) => { const p = inst.price(r), pv = inst.prev(r); return p !== null && pv ? ((p - pv) / pv) * 100 : null; },
                render: (r) => { const p = inst.price(r), pv = inst.prev(r); const c = p !== null && pv ? ((p - pv) / pv) * 100 : null; return <Delta value={c}>{fmtPct(c)}</Delta>; } },
              { key: "ts", label: "As of", value: inst.ts, render: (r) => <span className="text-xs text-muted-foreground">{fmtTime(inst.ts(r))}</span> },
            ]}
          />
        )}
      </RequireApi>
    </>
  );
}
