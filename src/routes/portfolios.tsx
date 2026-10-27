import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  RequireApi,
  TableSkeleton,
} from "@/components/app/states";
import { usePortfolioIds } from "@/hooks/use-portfolio-data";
import { api, isApiConfigured } from "@/lib/api";
import { useAuth } from "@/lib/auth";

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
  const { session, ready } = useAuth();
  const q = useQuery({
    queryKey: ["portfolios", session?.token],
    queryFn: api.portfolios,
    enabled: ready && !!session?.token && isApiConfigured(),
  });
  useEffect(() => {
    q.data?.forEach((portfolio) => add(String(portfolio.portfolio_id)));
  }, [q.data]);
  return (
    <>
      <PageHeader title="My Portfolios" description="Your named portfolios, holdings and cash" />
      <RequireApi>
        {!ready ? (
          <TableSkeleton />
        ) : !session?.token ? (
          <EmptyState title="Sign in to view your portfolios">
            <Button asChild className="mt-4">
              <Link to="/login">Sign in</Link>
            </Button>
          </EmptyState>
        ) : q.isPending ? (
          <TableSkeleton />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : q.data?.length ? (
          <div className="divide-y rounded-lg border bg-card">
            {q.data.map((portfolio, i) => {
              const id = String(portfolio.portfolio_id);
              return (
                <div key={id} className="flex items-center gap-3 px-4 py-3">
                  <Link
                    to="/portfolios/$id"
                    params={{ id }}
                    className="flex min-w-0 flex-1 flex-wrap items-center gap-3"
                  >
                    <span className="min-w-0 break-words font-medium">{portfolio.name}</span>
                    <span className="text-xs text-muted-foreground">{portfolio.base_currency}</span>
                    {i === 0 && (
                      <span className="rounded bg-accent px-1.5 text-[11px]">
                        Dashboard default
                      </span>
                    )}
                    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${id}`}
                    onClick={() => remove(id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No portfolios yet">
            Create one while placing an order, then return here to see it by name.
          </EmptyState>
        )}
      </RequireApi>
    </>
  );
}
