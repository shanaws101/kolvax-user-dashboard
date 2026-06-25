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
  Search,
  Command,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/lib/use-profile";
import { LiveDot } from "./live-dot";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };

const PRIMARY: NavItem[] = [
  { to: "/app", label: "Command Center", icon: LayoutDashboard, exact: true },
  { to: "/app/engines", label: "Revenue Engines", icon: Sparkles },
];
const WORK: NavItem[] = [
  { to: "/app/customers", label: "Customers", icon: Users },
  { to: "/app/activity", label: "Activity", icon: Activity },
  { to: "/app/reports", label: "Reports", icon: FileText },
];
const ADMIN: NavItem[] = [{ to: "/app/settings", label: "Settings", icon: Settings }];

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
      <aside className="hidden lg:flex w-[244px] shrink-0 flex-col border-r border-border bg-sidebar/80 backdrop-blur">
        <div className="px-5 pt-6 pb-5">
          <Link to="/app" className="inline-flex items-center gap-2.5 group">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background text-[11px] font-semibold tracking-tight shadow-[var(--shadow-card)]">
              K
            </span>
            <span className="editorial-h1 text-[17px] tracking-tight text-foreground">KOLVAX</span>
          </Link>
        </div>

        <div className="mx-3 mb-4 rounded-lg border border-border bg-surface px-3 py-2.5 shadow-[var(--shadow-card)]">
          <p className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">Workspace</p>
          <p className="mt-1 text-sm font-medium text-foreground truncate">{businessName}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-money">
            <LiveDot />
            <span>All engines online</span>
          </div>
        </div>

        <nav className="flex-1 px-2 space-y-5 overflow-y-auto">
          <NavSection items={PRIMARY} pathname={pathname} />
          <NavSection label="Work" items={WORK} pathname={pathname} />
          <NavSection label="Account" items={ADMIN} pathname={pathname} />
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          {data?.isOps && (
            <Link
              to="/ops"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-secondary hover:text-foreground transition-colors"
            >
              <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
              Operations Portal
            </Link>
          )}
          <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-secondary/60 transition-colors">
            <div className="h-8 w-8 rounded-full bg-foreground text-background grid place-items-center text-[11px] font-semibold">
              {initials || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{ownerName}</p>
              <p className="text-[11px] text-ink-faint">Owner</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-ink-faint hover:text-foreground p-1 rounded transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top utility bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/85 backdrop-blur px-4 lg:px-8 py-2.5">
          <div className="lg:hidden">
            <Link to="/app" className="editorial-h1 text-lg text-foreground">KOLVAX</Link>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs text-ink-faint">
            <span className="text-foreground font-medium">Mission control</span>
            <span className="text-border-strong">/</span>
            <span>{businessName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hidden md:inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-ink-soft hover:text-foreground hover:bg-secondary transition-colors min-w-[220px]"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Search customers, activity…</span>
              <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-secondary px-1 text-[10px] text-ink-faint">
                <Command className="h-2.5 w-2.5" /> K
              </kbd>
            </button>
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-ink-soft">
              <LiveDot />
              Live
            </span>
            <button
              onClick={handleSignOut}
              className="lg:hidden text-sm text-ink-soft"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 min-w-0 app-canvas">{children}</main>
      </div>
    </div>
  );
}

function NavSection({
  label,
  items,
  pathname,
}: {
  label?: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div>
      {label && (
        <p className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-faint">{label}</p>
      )}
      <div className="space-y-0.5">
        {items.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={
                "relative flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] transition-colors " +
                (active
                  ? "bg-surface text-foreground font-medium shadow-[var(--shadow-card)] border border-border"
                  : "text-ink-soft hover:bg-secondary/70 hover:text-foreground")
              }
            >
              <Icon className={"h-4 w-4 " + (active ? "text-money" : "text-ink-faint")} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
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
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6 mb-8 border-b border-border">
      <div>
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink-faint mb-2">{eyebrow}</p>
        )}
        <h1 className="editorial-h1 text-3xl lg:text-4xl text-foreground">{title}</h1>
        {description && (
          <p className="mt-2.5 text-sm text-ink-soft max-w-2xl leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="px-5 lg:px-8 py-8 lg:py-10 max-w-[1320px] mx-auto w-full">{children}</div>;
}
