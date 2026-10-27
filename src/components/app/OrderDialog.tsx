import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, isApiConfigured } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Link } from "@tanstack/react-router";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderPortfolioActions } from "./OrderPortfolioActions";
import { fmtINR, pick } from "@/lib/format";
import { createOrderSchema, orderPayload, type OrderInput } from "@/lib/order";
import type { z } from "zod";
import { StatusBadge } from "./states";
import { cn } from "@/lib/utils";

export interface SubmittedOrder { order_id: string; status: string; symbol: string; side: string; quantity: number; at: string; message?: string | undefined }

const SKEY = "spms.sessionOrders";
export const loadSessionOrders = (): SubmittedOrder[] => {
  try { return JSON.parse(sessionStorage.getItem(SKEY) ?? "[]"); } catch { return []; }
};
const saveOrder = (o: SubmittedOrder) => { try { sessionStorage.setItem(SKEY, JSON.stringify([o, ...loadSessionOrders()].slice(0, 50))); } catch { /* Receipt remains visible even if browser storage is unavailable. */ } };

export function OrderDialog({ instrumentId, symbol, price, lotSize, tickSize, currency = "INR", defaultSide = "BUY", trigger }: {
  instrumentId: string; symbol: string; price: number | null; lotSize?: number | null; tickSize?: number | null; currency?: string; defaultSide?: "BUY" | "SELL"; trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<OrderInput | null>(null);
  const [result, setResult] = useState<SubmittedOrder | null>(null);
  const idemKey = useRef<string>(crypto.randomUUID());
  const { session, ready } = useAuth();
  const portfolios = useQuery({ queryKey: ["portfolios"], queryFn: api.portfolios, enabled: open && ready && !!session && isApiConfigured(), retry: false });
  const [action, setAction] = useState<"create" | "deposit" | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const qc = useQueryClient();

  const schema = createOrderSchema(lotSize, tickSize);
  const form = useForm<z.input<typeof schema>, unknown, OrderInput>({
    resolver: zodResolver(schema),
    defaultValues: { portfolio_id: "", instrument_id: instrumentId, side: defaultSide, order_type: "MARKET", quantity: lotSize ?? 1 },
  });
  const v = form.watch();
  useEffect(() => {
    const list = portfolios.data;
    if (open && list && !list.some((p) => String(p.portfolio_id) === selectedId)) {
      setSelectedId(list[0] ? String(list[0].portfolio_id) : "");
    }
  }, [open, portfolios.data, selectedId]);
  useEffect(() => { form.setValue("portfolio_id", selectedId); }, [selectedId, form]);
  const selected = portfolios.data?.find((p) => String(p.portfolio_id) === selectedId);
  const values = confirm ?? v;
  const unit = values.order_type === "LIMIT" ? Number(values.limit_price) : price;
  const est = unit && Number(values.quantity) > 0 ? unit * Number(values.quantity) : null;

  const m = useMutation({
    mutationFn: (o: OrderInput) =>
      api.placeOrder(
        orderPayload(o),
        idemKey.current,
      ),
    onSuccess: (res, o) => {
      const rec: SubmittedOrder = {
        order_id: String(pick(res, "order_id", "id") ?? "—"),
        status: String(pick(res, "status", "state") ?? "UNKNOWN"),
        symbol, side: o.side, quantity: o.quantity, at: new Date().toISOString(),
        message: pick(res, "message", "reject_reason") as string | undefined,
      };
      saveOrder(rec);
      setResult(rec);
      setConfirm(null);
      idemKey.current = crypto.randomUUID();
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["portfolio-history"] });
      toast.success(`Order ${rec.order_id} ${rec.status.toLowerCase()}`);
    },
    onError: (e) => {
      setConfirm(null);
      toast.error(e instanceof ApiError ? e.message : "Order could not be submitted");
    },
  });

  const reset = (o: boolean) => {
    if (!o && (m.isPending || actionBusy)) return;
    setOpen(o);
    if (!o) { setResult(null); setConfirm(null); setAction(null); m.reset(); }
  };

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-h-[90dvh] overflow-y-auto" onInteractOutside={(e) => { if (m.isPending || actionBusy) e.preventDefault(); }} onEscapeKeyDown={(e) => { if (m.isPending || actionBusy) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>Order · {symbol}</DialogTitle>
          <DialogDescription>Demo portfolio system — orders are not routed to NSE or BSE.</DialogDescription>
        </DialogHeader>

        {!ready ? <p className="text-sm text-muted-foreground">Loading…</p> : !session ? (
          <Button asChild><Link to="/login">Sign in to place orders</Link></Button>
        ) : !isApiConfigured() ? <p role="alert" className="text-sm text-loss">Portfolio service is not connected.</p>
        : portfolios.isPending ? <p className="text-sm text-muted-foreground">Loading portfolios…</p>
        : portfolios.error ? <div className="space-y-3"><p role="alert" className="text-sm text-loss">{portfolios.error.message}</p><Button variant="outline" onClick={() => portfolios.refetch()}>Retry</Button></div>
        : action ? <OrderPortfolioActions mode={action} portfolioId={selectedId} currency={currency} onBusy={setActionBusy}
          onBack={() => setAction(null)} onCreated={(p) => { setSelectedId(String(p.portfolio_id)); setAction(null); }} />
        : !portfolios.data?.length ? <div className="space-y-4"><h3 className="font-semibold">Create your first portfolio</h3><Button className="w-full" onClick={() => setAction("create")}>+ New portfolio</Button></div>
        : result ? (
          <div className="space-y-3">
            <div className="rounded-md border p-4 text-sm">
              <p>Order ID <span className="num font-semibold">{result.order_id}</span></p>
              <p className="mt-2 flex items-center gap-2">Status <StatusBadge status={result.status} /></p>
              {result.message && <p className="mt-2 text-muted-foreground">{result.message}</p>}
            </div>
            <p className="text-xs text-muted-foreground">Accepted orders are filled separately by the matching engine. Check the portfolio for executed trades.</p>
            <Button className="w-full" onClick={() => reset(false)}>Done</Button>
          </div>
        ) : confirm ? (
          <div className="space-y-4 text-sm">
            <p>Confirm <b>{confirm.side}</b> {confirm.quantity} × {symbol} ({confirm.order_type}{confirm.order_type === "LIMIT" ? ` @ ${fmtINR(confirm.limit_price)}` : ""}) in portfolio <span className="font-semibold break-words">{selected?.name}</span>?</p>
            <p className="text-muted-foreground">Estimated value: <span className="num">{fmtINR(est)}</span> (excludes charges)</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" disabled={m.isPending} onClick={() => setConfirm(null)}>Back</Button>
              <Button className="flex-1" disabled={m.isPending} onClick={() => m.mutate(confirm)}>{m.isPending ? "Submitting…" : "Submit order"}</Button>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={form.handleSubmit((o) => setConfirm(o))}>
            <input type="hidden" {...form.register("instrument_id")} />
            <input type="hidden" {...form.register("portfolio_id")} />
            {m.error && <p role="alert" className="text-sm text-loss">{m.error.message}</p>}
            <div className="grid grid-cols-2 gap-2">
              {(["BUY", "SELL"] as const).map((s) => (
                <Button variant="outline" type="button" key={s} aria-pressed={v.side === s} onClick={() => form.setValue("side", s)}
                  className={cn("rounded-md border py-2 text-sm font-medium", v.side === s && (s === "BUY" ? "border-gain bg-gain-soft text-gain" : "border-loss bg-loss-soft text-loss"))}>
                  {s}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["MARKET", "LIMIT"] as const).map((t) => (
                <Button variant="outline" type="button" key={t} aria-pressed={v.order_type === t} onClick={() => { form.setValue("order_type", t); if (t === "MARKET") form.setValue("limit_price", undefined); }}
                  className={cn("rounded-md border py-1.5 text-xs font-medium", v.order_type === t && "border-primary bg-accent")}>{t}</Button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order-portfolio">Portfolio</Label>
              <Select value={selectedId} onValueChange={(value) => { if (value === "new") setAction("create"); else setSelectedId(value); }}>
                <SelectTrigger id="order-portfolio"><SelectValue placeholder="Select portfolio" /></SelectTrigger>
                <SelectContent>
                  {portfolios.data.map((p) => <SelectItem key={p.portfolio_id} value={String(p.portfolio_id)}>{p.name} · {p.base_currency}</SelectItem>)}
                  <SelectItem value="new">+ New portfolio</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.portfolio_id && <p className="text-xs text-loss">{form.formState.errors.portfolio_id.message}</p>}
              <Button type="button" variant="link" size="sm" className="px-0" disabled={!selected} onClick={() => setAction("deposit")}>Add funds</Button>
            </div>
            <Field label="Quantity" error={form.formState.errors.quantity?.message}><Input inputMode="decimal" {...form.register("quantity")} /></Field>
            {lotSize && <p className="text-xs text-muted-foreground">Lot size: {lotSize}</p>}
            {v.order_type === "LIMIT" && (
              <Field label="Limit price (₹)" error={form.formState.errors.limit_price?.message}><Input inputMode="decimal" {...form.register("limit_price", { setValueAs: (value: unknown) => value === "" ? undefined : value })} />{tickSize && <span className="text-xs text-muted-foreground">Tick size: {tickSize}</span>}</Field>
            )}
            <div className="flex justify-between rounded-md bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground">Estimated value</span><span className="num font-medium">{fmtINR(est)}</span>
            </div>
            <Button type="submit" className="w-full" disabled={!selected}>Review order</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="block space-y-1.5"><span>{label}</span>{children}</Label>
      {error && <p className="text-xs text-loss">{error}</p>}
    </div>
  );
}
