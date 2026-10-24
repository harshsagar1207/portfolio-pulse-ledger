import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader, RequireApi } from "@/components/app/states";
import { usePortfolioIds } from "@/hooks/use-portfolio-data";

export const Route = createFileRoute("/portfolios")({
  head: () => ({
    meta: [
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
  return (
    <>
      <PageHeader title="My Portfolios" description="The API exposes portfolios by ID. A list endpoint and portfolio creation are not yet verified." />
      <RequireApi>
        <form className="mb-6 flex max-w-md gap-2" onSubmit={(e) => { e.preventDefault(); if (v.trim()) { add(v.trim()); setV(""); } }}>
          <Input placeholder="Portfolio ID" value={v} onChange={(e) => setV(e.target.value)} aria-label="Portfolio ID" />
          <Button type="submit">Open</Button>
        </form>
        {ids.length ? (
          <div className="divide-y rounded-lg border bg-card">
            {ids.map((id, i) => (
              <div key={id} className="flex items-center gap-3 px-4 py-3">
                <Link to="/portfolios/$id" params={{ id }} className="flex flex-1 items-center gap-3">
                  <span className="num font-medium">#{id}</span>
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
