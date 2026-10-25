import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader, RequireApi } from "@/components/app/states";
import { usePortfolioIds } from "@/hooks/use-portfolio-data";
import { api } from "@/lib/api";

export const Route = createFileRoute("/portfolios")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "My Portfolios · Stock Portfolio Management" },
      { name: "description", content: "Open and inspect your portfolios." },
      { property: "og:title", content: "My Portfolios · Stock Portfolio Management" },
      { property: "og:description", content: "Open and inspect your portfolios." },
    ],
  }),
  component: Portfolios,
});

function Portfolios() {
  const { ids, add, remove } = usePortfolioIds();
  const [v, setV] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = v.trim();
    if (!id || busy) return;
    setBusy(true); setError(null);
    try { await api.portfolio(id); add(id); setV(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Portfolio could not be opened."); }
    finally { setBusy(false); }
  };
  return (
    <>
      <PageHeader title="My Portfolios" description="Saved portfolio IDs · holdings and cash" />
      <RequireApi>
        <form className="mb-3 flex max-w-md gap-2" onSubmit={openPortfolio}>
          <Input placeholder="Portfolio ID" value={v} onChange={(e) => setV(e.target.value)} aria-label="Portfolio ID" disabled={busy} required />
          <Button type="submit" disabled={busy || !v.trim()}>{busy ? "Opening…" : "Open"}</Button>
        </form>
        {error && <p role="alert" className="mb-4 text-sm text-loss">{error}</p>}
        {ids.length ? (
          <div className="divide-y rounded-lg border bg-card">
            {ids.map((id, i) => (
              <div key={id} className="flex items-center gap-3 px-4 py-3">
                <Link to="/portfolios/$id" params={{ id }} className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                  <span className="num min-w-0 break-all font-medium">#{id}</span>
                  {i === 0 && <span className="rounded bg-accent px-1.5 text-[11px]">Dashboard default</span>}
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </Link>
                <Button variant="ghost" size="icon" aria-label={`Remove ${id}`} onClick={() => remove(id)}><X className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        ) : <EmptyState title="No portfolios opened">Enter a portfolio ID you own. The backend enforces ownership.</EmptyState>}
      </RequireApi>
    </>
  );
}
