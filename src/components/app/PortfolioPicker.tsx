import { Label } from "@/components/ui/label";
import { usePortfolioIds } from "@/hooks/use-portfolio-data";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, isApiConfigured } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function useSelectedPortfolio() {
  const { ids } = usePortfolioIds();
  const [selected, setSelected] = useState<string | null>(null);
  return { id: selected ?? ids[0] ?? "", setId: setSelected };
}

export function PortfolioPicker({
  id,
  onChange,
  allowAll = false,
}: {
  id: string;
  onChange: (id: string) => void;
  allowAll?: boolean;
}) {
  const { session, ready } = useAuth();
  const q = useQuery({
    queryKey: ["portfolios", session?.token],
    queryFn: api.portfolios,
    enabled: ready && !!session?.token && isApiConfigured(),
    retry: false,
  });
  useEffect(() => {
    if (!id && q.data?.[0] && !allowAll) onChange(String(q.data[0].portfolio_id));
  }, [allowAll, id, onChange, q.data]);
  if (!ready || q.isPending)
    return (
      <div className="w-full max-w-xs space-y-1.5">
        <Label>Portfolio</Label>
        <div className="h-9 animate-pulse rounded-md bg-muted" />
      </div>
    );
  if (!session?.token)
    return <p className="text-sm text-muted-foreground">Sign in to select a portfolio.</p>;
  if (q.error)
    return (
      <p role="alert" className="text-sm text-loss">
        {q.error.message}
      </p>
    );
  return (
    <div className="w-full max-w-xs space-y-1.5">
      <Label htmlFor="history-portfolio">Portfolio</Label>
      <Select
        value={id || (allowAll ? "__all__" : undefined)}
        onValueChange={(value) => onChange(value === "__all__" ? "" : value)}
      >
        <SelectTrigger id="history-portfolio" aria-label="Portfolio">
          <SelectValue placeholder="Select portfolio" />
        </SelectTrigger>
        <SelectContent>
          {allowAll && <SelectItem value="__all__">All portfolios</SelectItem>}
          {q.data?.map((p) => (
            <SelectItem key={p.portfolio_id} value={String(p.portfolio_id)}>
              {p.name} · {p.base_currency}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!q.data?.length && <p className="text-xs text-muted-foreground">No portfolios available.</p>}
    </div>
  );
}
