import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3, Briefcase, Building2, FileText, Gauge, Landmark, LineChart, ListOrdered, LogIn, LogOut,
  Receipt, Rocket, Settings, ShieldCheck, Star, ScrollText,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { isApiConfigured } from "@/lib/api";
import { DemoBadge } from "@/components/app/states";
import { Button } from "@/components/ui/button";

const main = [
  { title: "Dashboard", url: "/", icon: Gauge },
  { title: "My Portfolios", url: "/portfolios", icon: Briefcase },
  { title: "Markets", url: "/markets", icon: LineChart },
  { title: "Watchlist", url: "/watchlist", icon: Star },
  { title: "Orders", url: "/orders", icon: ListOrdered },
  { title: "Transactions", url: "/transactions", icon: Receipt },
] as const;
const assets = [
  { title: "Mutual Funds", url: "/funds", icon: Building2 },
  { title: "Bonds", url: "/bonds", icon: Landmark },
  { title: "IPOs", url: "/ipos", icon: Rocket },
  { title: "Reports", url: "/reports", icon: BarChart3 },
] as const;

function NavGroup({ label, items }: { label: string; items: ReadonlyArray<{ title: string; url: string; icon: typeof Gauge }> }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/50">{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((it) => (
            <SidebarMenuItem key={it.url}>
              <SidebarMenuButton asChild tooltip={it.title} isActive={it.url === "/" ? path === "/" : path.startsWith(it.url)}>
                <Link to={it.url}><it.icon /><span>{it.title}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return <SidebarProvider><ShellContent>{children}</ShellContent></SidebarProvider>;
}

function ShellContent({ children }: { children: ReactNode }) {
  const { session, hasRole, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { setOpenMobile } = useSidebar();
  useEffect(() => { setOpenMobile(false); }, [path, setOpenMobile]);
  const pageName = [...main, ...assets, { title: "Settings", url: "/settings" }].find((item) => item.url === "/" ? path === "/" : path.startsWith(item.url))?.title ?? "Portfolio";
  const restricted = [
    ...(hasRole("auditor", "admin", "administrator") ? [{ title: "Audit Logs", url: "/audit", icon: ScrollText }] : []),
    ...(hasRole("admin", "administrator") ? [{ title: "Administration", url: "/admin", icon: ShieldCheck }] : []),
  ];
  return (
      <div className="flex min-h-screen w-full">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:p-3">Skip to content</a>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <div className="leading-tight group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-semibold text-sidebar-primary">Portfolio</p>
                <p className="text-[11px] text-sidebar-foreground/60">Indian markets</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <NavGroup label="Overview" items={main} />
            <NavGroup label="Assets & reports" items={assets} />
            {restricted.length > 0 && <NavGroup label="Restricted" items={restricted} />}
            <NavGroup label="Account" items={[{ title: "Settings", url: "/settings", icon: Settings }]} />
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                {session ? (
                  <SidebarMenuButton tooltip="Sign out" onClick={() => { signOut(); navigate({ to: "/login", replace: true }); }}>
                    <LogOut /><span>Sign out</span>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton asChild tooltip="Sign in"><Link to="/login"><LogIn /><span>Sign in</span></Link></SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur">
            <SidebarTrigger />
            <span className="hidden text-sm font-medium sm:block">{pageName}</span>
            <div className="ml-auto flex items-center gap-3">
              <DemoBadge />
              <span className={`hidden text-xs md:block ${isApiConfigured() ? "text-gain" : "text-muted-foreground"}`}>
                {isApiConfigured() ? "● API configured" : "○ API not connected"}
              </span>
              {!session && <Button asChild variant="outline" size="sm"><Link to="/login">Sign in</Link></Button>}
            </div>
          </header>
          <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">{children}</main>
          <footer className="flex flex-wrap justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground md:px-8"><span>Portfolio · Indian markets</span><span>Demo environment · No exchange execution</span></footer>
        </div>
      </div>
  );
}
