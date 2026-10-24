import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader, StatCard } from "@/components/app/states";
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
        <StatCard label="API health" value={!API_BASE_URL ? "—" : h.isLoading ? "Checking…" : h.error ? "Unreachable" : "OK"} tone={h.error ? "loss" : h.data ? "gain" : undefined} />
        <StatCard label="Signed in as" value={<span className="text-sm">{session ? String(pick(session.user, "username", "email") ?? "Session active") : "Not signed in"}</span>} hint={roles.length ? `Roles: ${roles.join(", ")}` : undefined} />
      </div>
      <div className="mt-6">
        {session ? <Button variant="outline" onClick={signOut}>Sign out</Button> : <Button asChild><Link to="/login">Sign in</Link></Button>}
      </div>
    </>
  );
}
