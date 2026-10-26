import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortfolioIds } from "@/hooks/use-portfolio-data";
import { useState } from "react";

export function useSelectedPortfolio() {
  const { ids } = usePortfolioIds();
  const [selected, setSelected] = useState<string | null>(null);
  return { id: selected ?? ids[0] ?? "", setId: setSelected };
}

export function PortfolioPicker({ id, onChange, allowAll = false }: { id: string; onChange: (id: string) => void; allowAll?: boolean }) {
  const { ids } = usePortfolioIds();
  return <div className="w-full max-w-xs space-y-1.5">
    <Label htmlFor="history-portfolio">Portfolio ID</Label>
    <Input id="history-portfolio" list="saved-portfolios" inputMode="numeric" value={id} onChange={(e) => onChange(e.target.value)} placeholder={allowAll ? "All portfolios" : "Enter portfolio ID"} />
    <datalist id="saved-portfolios">{ids.map((v) => <option key={v} value={v} />)}</datalist>
  </div>;
}