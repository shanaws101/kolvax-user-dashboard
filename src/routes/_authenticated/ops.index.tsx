import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer, PageHeader } from "@/components/portal/app-shell";
import { Card } from "@/components/portal/card";
import { StatusPill } from "@/components/portal/status-pill";
import { formatMoney, formatRelative } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/ops/")({
  head: () => ({ meta: [{ title: "Ops Overview — KOLVAX" }] }),
  component: OpsOverview,
});

function OpsOverview() {
  const { data } = useQuery({
    queryKey: ["ops-overview"],
    queryFn: async () => {
      const [businesses, deployments, engines] = await Promise.all([
        supabase.from("businesses").select("*").order("created_at", { ascending: false }),
        supabase.from("engine_deployments").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("revenue_engines").select("health"),
      ]);
      const total = (businesses.data ?? []).length;
      const live = (businesses.data ?? []).filter((b) => b.status === "live").length;
      const recovered = (businesses.data ?? []).reduce((s, b) => s + (b.monthly_recovered_cents ?? 0), 0);
      const attention = (engines.data ?? []).filter((e) => e.health === "attention" || e.health === "offline").length;
      return { total, live, recovered, attention, businesses: businesses.data ?? [], deployments: deployments.data ?? [] };
    },
  });
  return (
    <PageContainer>
      <PageHeader eyebrow="Operations" title="Network overview" description="Real-time view of every business KOLVAX is recovering revenue for." />
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <Card><p className="text-xs uppercase tracking-wider text-ink-faint">Total businesses</p><p className="money-text text-2xl mt-2">{data?.total ?? 0}</p></Card>
        <Card><p className="text-xs uppercase tracking-wider text-ink-faint">Live</p><p className="money-text text-2xl mt-2">{data?.live ?? 0}</p></Card>
        <Card><p className="text-xs uppercase tracking-wider text-ink-faint">Recovered MTD</p><p className="money-text text-2xl mt-2 text-money">{formatMoney(data?.recovered ?? 0)}</p></Card>
        <Card><p className="text-xs uppercase tracking-wider text-ink-faint">Engines needing attention</p><p className="money-text text-2xl mt-2">{data?.attention ?? 0}</p></Card>
      </div>

      <Card className="mt-8">
        <h2 className="text-sm font-semibold mb-4">Recent deployments</h2>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-ink-faint">
            <tr className="border-b border-border">
              <th className="text-left font-medium py-2 pr-4 font-mono">Business ID</th>
              <th className="text-left font-medium py-2 pr-4">Engine</th>
              <th className="text-left font-medium py-2 pr-4">Status</th>
              <th className="text-left font-medium py-2 pr-4">Phone</th>
              <th className="text-left font-medium py-2">Deployed</th>
            </tr>
          </thead>
          <tbody>
            {(data?.deployments ?? []).map((d) => (
              <tr key={d.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-4 font-mono text-[11px] text-ink-faint">{d.business_id.slice(0, 8)}…</td>
                <td className="py-2 pr-4">{d.engine_type}</td>
                <td className="py-2 pr-4"><StatusPill tone={d.status === "live" ? "success" : "warning"}>{d.status}</StatusPill></td>
                <td className="py-2 pr-4 font-mono text-xs">{d.phone_number ?? "—"}</td>
                <td className="py-2 text-ink-soft">{formatRelative(d.deployed_at ?? d.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PageContainer>
  );
}
