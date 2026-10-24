import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { AuthLayout } from "./login";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register · Stock Portfolio Management" },
      { name: "description", content: "Create a portfolio account." },
      { property: "og:title", content: "Register · Stock Portfolio Management" },
      { property: "og:description", content: "Create a portfolio account." },
    ],
  }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const [f, setF] = useState({ username: "", email: "", password: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.password.length < 8) return setErr("Password must be at least 8 characters.");
    setErr(null); setBusy(true);
    try {
      await api.register(f);
      toast.success("Account created. Please sign in.");
      navigate({ to: "/login" });
    } catch (x) { setErr(x instanceof Error ? x.message : "Registration failed"); } finally { setBusy(false); }
  };

  return (
    <AuthLayout title="Create account">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="u">Username</Label><Input id="u" value={f.username} onChange={set("username")} required /></div>
        <div className="space-y-1.5"><Label htmlFor="e">Email</Label><Input id="e" type="email" value={f.email} onChange={set("email")} required /></div>
        <div className="space-y-1.5"><Label htmlFor="p">Password</Label><Input id="p" type="password" value={f.password} onChange={set("password")} required autoComplete="new-password" /></div>
        {err && <p className="text-sm text-loss" role="alert">{err}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Register"}</Button>
        <p className="text-center text-sm text-muted-foreground">Have an account? <Link to="/login" className="text-foreground underline">Sign in</Link></p>
      </form>
    </AuthLayout>
  );
}
