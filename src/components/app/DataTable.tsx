import { useMemo, useState, type ReactNode } from "react";
import { ArrowDownUp, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { humanize } from "@/lib/format";
import { EmptyState } from "./states";

export interface Column<T> {
  key: string;
  label?: string;
  render?: (row: T) => ReactNode;
  value?: (row: T) => unknown;
  align?: "right";
}

type Row = Record<string, unknown>;

export function autoColumns(rows: Row[]): Column<Row>[] {
  const keys = new Set<string>();
  rows.slice(0, 20).forEach((r) => Object.keys(r).forEach((k) => typeof r[k] !== "object" || r[k] === null ? keys.add(k) : null));
  return [...keys].map((k) => ({ key: k }));
}

export function DataTable<T extends Row>({
  rows,
  columns,
  pageSize = 15,
  emptyTitle = "Nothing here yet",
  csvName,
  onRowClick,
}: {
  rows: T[];
  columns: Column<T>[];
  pageSize?: number;
  emptyTitle?: string;
  csvName?: string;
  onRowClick?: (r: T) => void;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);

  const getVal = (c: Column<T>, r: T) => (c.value ? c.value(r) : r[c.key]);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    return [...rows].sort((a, b) => {
      const x = getVal(col, a), y = getVal(col, b);
      const nx = Number(x), ny = Number(y);
      if (Number.isFinite(nx) && Number.isFinite(ny)) return (nx - ny) * sort.dir;
      return String(x ?? "").localeCompare(String(y ?? "")) * sort.dir;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort, columns]);

  if (!rows.length) return <EmptyState title={emptyTitle} />;
  const pages = Math.ceil(sorted.length / pageSize);
  const p = Math.min(page, pages - 1);
  const view = sorted.slice(p * pageSize, (p + 1) * pageSize);

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [columns.map((c) => esc(c.label ?? humanize(c.key))).join(","), ...sorted.map((r) => columns.map((c) => esc(getVal(c, r))).join(","))].join("\n");
    const a = document.createElement("a");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    a.href = url;
    a.download = `${csvName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key} aria-sort={sort?.key === c.key ? sort.dir === 1 ? "ascending" : "descending" : "none"} className={c.align === "right" ? "text-right" : ""}>
                  <Button variant="ghost" size="sm"
                    className="h-auto px-0 text-xs font-medium uppercase tracking-wide hover:bg-transparent hover:text-foreground"
                    onClick={() => { setPage(0); setSort((s) => ({ key: c.key, dir: s?.key === c.key && s.dir === 1 ? -1 : 1 })); }}
                  >
                    {c.label ?? humanize(c.key)} <ArrowDownUp className="h-3 w-3 opacity-50" />
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {view.map((r, i) => (
              <TableRow key={i} tabIndex={onRowClick ? 0 : undefined} className={onRowClick ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" : ""} onClick={() => onRowClick?.(r)} onKeyDown={(e) => { if (onRowClick && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onRowClick(r); } }}>
                {columns.map((c) => (
                  <TableCell key={c.key} className={c.align === "right" ? "num text-right" : ""}>
                    {c.render ? c.render(r) : String(getVal(c, r) ?? "—")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
        <span>{p * pageSize + 1}–{Math.min((p + 1) * pageSize, sorted.length)} of {sorted.length}</span>
        <div className="flex items-center gap-2">
          {csvName && (
            <Button variant="ghost" size="sm" onClick={exportCsv}><Download className="mr-1 h-3.5 w-3.5" />CSV</Button>
          )}
          <Button variant="outline" size="icon" aria-label="Previous page" title="Previous page" disabled={p === 0} onClick={() => setPage(p - 1)}><ChevronLeft /></Button>
          <span aria-live="polite">{p + 1} / {pages}</span>
          <Button variant="outline" size="icon" aria-label="Next page" title="Next page" disabled={p >= pages - 1} onClick={() => setPage(p + 1)}><ChevronRight /></Button>
        </div>
      </div>
    </div>
  );
}
