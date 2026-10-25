import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiNotConfigured } from "@/components/app/states";
import { api, ApiError, isApiConfigured } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Sign in · Stock Portfolio Management" },
      { name: "description", content: "Sign in to your portfolio account." },
      { property: "og:title", content: "Sign in · Stock Portfolio Management" },
      { property: "og:description", content: "Sign in to your portfolio account." },
    ],
  }),
  component: Login,
});

export function AuthLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <p className="font-semibold text-sidebar-primary">Portfolio · Indian markets</p>
        <div>
          <p className="text-3xl font-semibold leading-tight text-sidebar-primary">Equities, funds, bonds and IPOs — one ledger.</p>
          <p className="mt-3 text-sm text-sidebar-foreground/70">Demo environment with simulated prices. No orders reach a real exchange.</p>
        </div>
        <p className="num text-xs text-sidebar-foreground/50">NIFTY 50 · NIFTY BANK · SENSEX</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Button asChild variant="link" className="mb-5 px-0"><Link to="/">← Portfolio</Link></Button>
          <h1 className="mb-6 text-2xl font-semibold">{title}</h1>
          {isApiConfigured() ? children : <ApiNotConfigured />}
        </div>
      </div>
    </div>
  );
}

function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const body = await api.login(id.includes("@") ? { email: id, password: pw } : { username: id, password: pw });
      signIn(body);
      navigate({ to: "/" });
    } catch (x) {
      setErr(x instanceof ApiError && x.kind === "unauthorized" ? "Incorrect username or password." : x instanceof Error ? x.message : "Sign-in failed");
    } finally { setBusy(false); }
  };

  return (
    <AuthLayout title="Sign in">
      <form onSubmit={submit} className="space-y-4"><fieldset disabled={busy} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="id">Username or email</Label><Input id="id" value={id} onChange={(e) => setId(e.target.value)} required autoComplete="username" /></div>
        <div className="space-y-1.5"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required autoComplete="current-password" /></div>
        {err && <p className="text-sm text-loss" role="alert">{err}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
        <p className="text-center text-sm text-muted-foreground">No account? <Link to="/register" className="text-foreground underline">Register</Link></p>
      </fieldset></form>
    </AuthLayout>
  );
}
