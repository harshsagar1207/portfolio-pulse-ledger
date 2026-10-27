import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/app/DataTable";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  RequireApi,
  TableSkeleton,
} from "@/components/app/states";
import { useWatchlist } from "@/hooks/use-portfolio-data";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmtINR, fmtTime } from "@/lib/format";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Watchlist · Stock Portfolio Management" },
      { name: "description", content: "Track instruments you follow." },
      { property: "og:title", content: "Watchlist · Stock Portfolio Management" },
      { property: "og:description", content: "Track instruments you follow." },
    ],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const { session, ready } = useAuth();
  const q = useWatchlist();
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: api.removeFromWatchlist,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  });
  return (
    <>
      <PageHeader title="Watchlist" description="Track instruments you follow." />
      <RequireApi>
        {!ready ? (
          <TableSkeleton />
        ) : !session?.token ? (
          <EmptyState title="Sign in to use your watchlist">
            <Button asChild className="mt-4">
              <Link to="/login">Sign in</Link>
            </Button>
          </EmptyState>
        ) : q.isPending ? (
          <TableSkeleton />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : (
          <DataTable
            rows={q.data ?? []}
            csvName="watchlist"
            emptyTitle="Your watchlist is empty"
            columns={[
              {
                key: "symbol",
                label: "Symbol",
                render: (r) => <span className="font-medium">{String(r["symbol"] ?? "—")}</span>,
              },
              { key: "name", label: "Name" },
              { key: "exchange", label: "Exchange" },
              { key: "asset_class", label: "Class" },
              {
                key: "last_price",
                label: "Latest",
                align: "right",
                render: (r) => fmtINR(r["last_price"]),
              },
              {
                key: "price_ts",
                label: "As of",
                render: (r) => (
                  <span className="text-xs text-muted-foreground">{fmtTime(r["price_ts"])}</span>
                ),
              },
              {
                key: "remove",
                label: "",
                render: (r) => {
                  const id = String(r["instrument_id"]);
                  return (
                    <Button
                      aria-label={`Remove ${r["symbol"] ?? id} from watchlist`}
                      variant="ghost"
                      size="icon"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(id)}
                    >
                      <Star className="h-4 w-4 fill-current" />
                    </Button>
                  );
                },
              },
            ]}
          />
        )}
      </RequireApi>
    </>
  );
}
