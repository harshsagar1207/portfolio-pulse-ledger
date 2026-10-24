import { Link } from "@tanstack/react-router";
import { AlertTriangle, Inbox, LockKeyhole, PlugZap, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, isApiConfigured } from "@/lib/api";
import { statusTone } from "@/lib/order";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

function Panel({ icon, title, children, tone = "muted" }: { icon: ReactNode; title: string; children?: ReactNode; tone?: "muted" | "loss" | "pending" }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-12 text-center",
        tone === "loss" && "border-loss/40 bg-loss-soft",
        tone === "pending" && "border-pending/50 bg-pending-soft",
        tone === "muted" && "bg-card",
      )}
    >
      <div className="mb-3 text-muted-foreground">{icon}</div>
      <p className="font-medium">{title}</p>
      {children && <div className="mt-2 max-w-md text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function NotConnected({ feature, detail }: { feature: string; detail?: string }) {
  return (
    <Panel icon={<PlugZap className="h-6 w-6" />} title={`${feature} — not connected`} tone="pending">
      {detail ?? "No verified backend endpoint exists for this yet. It is listed as a future integration."}
    </Panel>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return <Panel icon={<Inbox className="h-6 w-6" />} title={title}>{children}</Panel>;
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const e = error instanceof ApiError ? error : null;
  if (e?.kind === "not_configured") return <ApiNotConfigured />;
  if (e?.kind === "unauthorized")
    return (
      <Panel icon={<LockKeyhole className="h-6 w-6" />} title="Session expired">
        <p>{e.message}</p>
        <Button asChild size="sm" className="mt-4"><Link to="/login">Sign in</Link></Button>
      </Panel>
    );
  if (e?.kind === "forbidden")
    return <Panel icon={<LockKeyhole className="h-6 w-6" />} title="Not authorized">{e.message}</Panel>;
  return (
    <Panel icon={<AlertTriangle className="h-6 w-6 text-loss" />} title="Something went wrong" tone="loss">
      <p>{error instanceof Error ? error.message : String(error)}</p>
      {onRetry && (
        <Button size="sm" variant="outline" className="mt-4" onClick={onRetry}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" /> Retry
        </Button>
      )}
    </Panel>
  );
}

export function ApiNotConfigured() {
  return (
    <Panel icon={<PlugZap className="h-6 w-6" />} title="Backend API not connected" tone="pending">
      Set the <code className="num rounded bg-muted px-1">VITE_API_BASE_URL</code> environment variable to your Portfolio API
      to load live account data. No sample figures are shown in its place.
    </Panel>
  );
}

export function RequireApi({ children }: { children: ReactNode }) {
  return isApiConfigured() ? <>{children}</> : <ApiNotConfigured />;
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 rounded-lg border bg-card p-4">
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
    </div>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-pending/50 bg-pending-soft px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide">
      <span className="h-1.5 w-1.5 rounded-full bg-pending" /> Demo / Simulated data
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
        tone === "pending" && "bg-pending-soft text-foreground",
        tone === "gain" && "bg-gain-soft text-gain",
        tone === "loss" && "bg-loss-soft text-loss",
        tone === "muted" && "bg-muted text-muted-foreground",
      )}
    >
      {String(status ?? "—").replace(/_/g, " ")}
    </span>
  );
}

export function Delta({ value, children }: { value: number | null; children: ReactNode }) {
  return (
    <span className={cn("num", value === null ? "text-muted-foreground" : value > 0 ? "text-gain" : value < 0 ? "text-loss" : "")}>
      {children}
    </span>
  );
}

export function StatCard({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "gain" | "loss" }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("num mt-2 text-xl font-semibold", tone === "gain" && "text-gain", tone === "loss" && "text-loss")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
