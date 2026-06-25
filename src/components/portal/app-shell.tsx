import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Sparkles,
  Users,
  Activity,
  FileText,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/lib/use-profile";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/app", label: "Command Center", icon: LayoutDashboard, exact: true },
  { to: "/app/engines", label: "Revenue Engines", icon: Sparkles },
  { to: "/app/customers", label: "Customers", icon: Users },
  { to: "/app/activity", label: "Activity", icon: Activity },
  { to: "/app/reports", label: "Reports", icon: FileText },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data } = useProfile();

  const handleSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const businessName = data?.profile?.business?.name ?? "Your business";
  const ownerName = data?.profile?.full_name ?? "—";
  const initials = ownerName
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="px-6 pt-7 pb-8">
          <Link to="/app" className="inline-flex items-center gap-2">
            <span className="editorial-h1 text-xl tracking-tight text-foreground">KOLVAX</span>
          </Link>
          <p className="mt-4 text-xs uppercase tracking-wider text-ink-faint">Account</p>
          <p className="mt-1 text-sm font-medium text-foreground truncate">{businessName}</p>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors " +
                  (active
                    ? "bg-secondary text-foreground font-medium"
                    : "text-ink-soft hover:bg-secondary/60 hover:text-foreground")
                }
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border space-y-1">
          {data?.isOps && (
            <Link
              to="/ops"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-secondary/60 hover:text-foreground"
            >
              <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
              Operations Portal
            </Link>
          )}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-money-soft text-money grid place-items-center text-xs font-semibold">
              {initials || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{ownerName}</p>
              <p className="text-[11px] text-ink-faint">Owner</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-ink-faint hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <Link to="/app" className="editorial-h1 text-lg text-foreground">KOLVAX</Link>
          <button onClick={handleSignOut} className="text-sm text-ink-soft">Sign out</button>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-border">
      <div>
        {eyebrow && (
          <p className="text-xs uppercase tracking-wider text-ink-faint mb-2">{eyebrow}</p>
        )}
        <h1 className="editorial-h1 text-3xl text-foreground">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="px-6 lg:px-10 py-8 lg:py-10 max-w-[1240px] mx-auto w-full">{children}</div>;
}
