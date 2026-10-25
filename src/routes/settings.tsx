import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ErrorState, PageHeader, StatCard } from "@/components/app/states";
import { useHealth } from "@/hooks/use-portfolio-data";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { pick } from "@/lib/format";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Stock Portfolio Management" },
      { name: "description", content: "Account, session and API connection status." },
      { property: "og:title", content: "Settings · Stock Portfolio Management" },
      { property: "og:description", content: "Account, session and API connection status." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { session, roles, signOut } = useAuth();
  const h = useHealth();
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="API base URL" value={<span className="text-sm">{API_BASE_URL ?? "Not set"}</span>} />
        <StatCard label="API health" value={!API_BASE_URL ? "Not connected" : h.isPending ? "Checking…" : h.error ? "Unreachable" : h.isSuccess ? "Reachable" : "—"} tone={h.error ? "loss" : h.isSuccess ? "gain" : undefined} />
        <StatCard label="Signed in as" value={<span className="text-sm">{session ? String(pick(session.user, "username", "email") ?? "Session active") : "Not signed in"}</span>} hint={roles.length ? `Roles: ${roles.join(", ")}` : undefined} />
      </div>
      {h.error && <div className="mt-6"><ErrorState error={h.error} onRetry={() => h.refetch()} /></div>}
      {!API_BASE_URL && <section className="mt-6 border-y py-5"><h2 className="text-sm font-semibold">Portfolio API connection</h2><p className="mt-2 text-sm text-muted-foreground">The Portfolio API address has not been provided. Live account features remain unavailable.</p><p className="mt-2 break-words text-xs text-muted-foreground">Connection variable: <code className="num">VITE_API_BASE_URL</code></p></section>}
      <div className="mt-6">
        {session ? <Button variant="outline" onClick={signOut}>Sign out</Button> : <Button asChild><Link to="/login">Sign in</Link></Button>}
      </div>
    </>
  );
}
