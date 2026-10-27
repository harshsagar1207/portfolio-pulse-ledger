import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, type Portfolio } from "@/lib/api";

export function OrderPortfolioActions({
  mode,
  portfolioId,
  currency,
  portfolioQueryKey,
  onCreated,
  onBack,
  onBusy,
}: {
  mode: "create" | "deposit";
  portfolioId: string;
  currency: string;
  portfolioQueryKey: readonly (string | undefined)[];
  onCreated: (portfolio: Portfolio) => void;
  onBack: () => void;
  onBusy: (busy: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("100000");
  const [validation, setValidation] = useState("");
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === "create")
        return api.createPortfolio({ name: name.trim(), base_currency: "INR" });
      await api.deposit(portfolioId, { amount: Number(amount), currency }, crypto.randomUUID());
      return null;
    },
    onSuccess: async (portfolio) => {
      if (portfolio) {
        qc.setQueryData<Portfolio[]>(portfolioQueryKey, (old) => [
          ...(old ?? []).filter((p) => p.portfolio_id !== portfolio.portfolio_id),
          portfolio,
        ]);
        onCreated(portfolio);
        await qc.invalidateQueries({ queryKey: ["portfolios"] });
      } else {
        await Promise.all([
          qc.invalidateQueries({ queryKey: ["portfolio"] }),
          qc.invalidateQueries({ queryKey: ["portfolio-history"] }),
        ]);
        onBack();
      }
    },
    onSettled: () => onBusy(false),
  });
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (mutation.isPending) return;
        if (
          mode === "deposit" &&
          (!/^\d+(\.\d{1,4})?$/.test(amount) ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0)
        ) {
          setValidation("Enter a positive amount with at most four decimal places and no commas.");
          return;
        }
        setValidation("");
        onBusy(true);
        mutation.mutate();
      }}
    >
      <h3 className="font-semibold">{mode === "create" ? "New portfolio" : "Add funds"}</h3>
      <div className="space-y-1.5">
        <Label htmlFor="portfolio-action-input">
          {mode === "create" ? "Portfolio name" : `Amount (${currency})`}
        </Label>
        <Input
          id="portfolio-action-input"
          autoFocus
          required
          disabled={mutation.isPending}
          inputMode={mode === "deposit" ? "decimal" : "text"}
          value={mode === "create" ? name : amount}
          onChange={(e) =>
            mode === "create" ? setName(e.target.value) : setAmount(e.target.value)
          }
        />
      </div>
      {mode === "deposit" && (
        <div className="flex flex-wrap gap-2">
          {["10000", "100000", "1000000"].map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setAmount(value)}
            >
              {new Intl.NumberFormat("en-IN").format(Number(value))}
            </Button>
          ))}
        </div>
      )}
      {(validation || mutation.error) && (
        <p role="alert" className="text-sm text-loss">
          {validation || mutation.error?.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={mutation.isPending}
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={mutation.isPending || (mode === "create" && !name.trim())}
        >
          {mutation.isPending
            ? "Saving…"
            : mode === "create"
              ? "Create portfolio"
              : "Deposit funds"}
        </Button>
      </div>
    </form>
  );
}
