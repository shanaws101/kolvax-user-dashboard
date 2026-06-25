import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer, PageHeader } from "@/components/portal/app-shell";
import { Card } from "@/components/portal/card";
import { StatusPill } from "@/components/portal/status-pill";
import { formatMoney, formatRelative } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/ops/businesses")({
  head: () => ({ meta: [{ title: "Businesses — KOLVAX Ops" }] }),
  component: BusinessesPage,
});

function BusinessesPage() {
  const { data } = useQuery({
    queryKey: ["ops-businesses"],
    queryFn: async () => {
      const { data } = await supabase.from("businesses").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  return (
    <PageContainer>
      <PageHeader eyebrow="Operations" title="Businesses" description="All customers in the KOLVAX network." />
      <Card className="mt-8 !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-ink-faint">
            <tr className="border-b border-border">
              <th className="text-left font-medium px-4 py-3">Business</th>
              <th className="text-left font-medium px-4 py-3">Industry</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-right font-medium px-4 py-3">Recovered MTD</th>
              <th className="text-left font-medium px-4 py-3">Deployed</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((b) => (
              <tr key={b.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{b.name}</p>
                  <p className="text-xs text-ink-faint font-mono">{b.id.slice(0, 8)}…</p>
                </td>
                <td className="px-4 py-3 text-ink-soft">{b.industry ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={b.status === "live" ? "success" : b.status === "onboarding" ? "warning" : "neutral"}>
                    {b.status}
                  </StatusPill>
                </td>
                <td className="px-4 py-3 text-right tabular text-money font-medium">{formatMoney(b.monthly_recovered_cents)}</td>
                <td className="px-4 py-3 text-ink-soft">{formatRelative(b.deployed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PageContainer>
  );
}
