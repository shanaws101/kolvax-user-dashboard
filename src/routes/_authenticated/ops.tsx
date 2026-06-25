import { createFileRoute, Outlet, redirect, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, Building2, Activity as ActivityIcon, ArrowLeft, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { verifyOpsAccess } from "@/lib/ops-access.functions";

export const Route = createFileRoute("/_authenticated/ops")({
  beforeLoad: async () => {
    // Server-side role check — runs through requireSupabaseAuth middleware so
    // the bearer token is verified server-side and cannot be bypassed by
    // patching the SPA router in the browser.
    try {
      const { allowed } = await verifyOpsAccess();
      if (!allowed) throw redirect({ to: "/app" });
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) throw err;
      throw redirect({ to: "/auth" });
    }
  },
  component: OpsLayout,
});

type OpsNav = { to: string; label: string; icon: typeof ShieldCheck; exact?: boolean };
const OPS_NAV: OpsNav[] = [
  { to: "/ops", label: "Overview", icon: ShieldCheck, exact: true },
  { to: "/ops/businesses", label: "Businesses", icon: Building2 },
  { to: "/ops/logs", label: "Operational logs", icon: ActivityIcon },
];

function OpsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-[oklch(0.18_0.012_250)] text-[oklch(0.95_0.005_95)]">
        <div className="px-6 pt-7 pb-8">
          <span className="editorial-h1 text-xl tracking-tight">KOLVAX</span>
          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-money font-mono">Operations</p>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {OPS_NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors " +
                  (active ? "bg-white/10 text-white font-medium" : "text-white/70 hover:bg-white/5 hover:text-white")
                }
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link to="/app" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/5">
            <ArrowLeft className="h-4 w-4" /> Customer view
          </Link>
          <button onClick={signOut} className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/5">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0"><Outlet /></main>
    </div>
  );
}
