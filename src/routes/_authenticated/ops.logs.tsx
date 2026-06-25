import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer, PageHeader } from "@/components/portal/app-shell";
import { Card } from "@/components/portal/card";
import { formatMoney, formatRelative } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/ops/logs")({
  head: () => ({ meta: [{ title: "Operational Logs — KOLVAX Ops" }] }),
  component: LogsPage,
});

function LogsPage() {
  const { data } = useQuery({
    queryKey: ["ops-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activities")
        .select("*, business:businesses(name)")
        .order("occurred_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });
  return (
    <PageContainer>
      <PageHeader eyebrow="Operations" title="Operational logs" description="Every activity across every business — internal view." />
      <Card className="mt-8 !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-ink-faint">
            <tr className="border-b border-border">
              <th className="text-left font-medium px-4 py-3">When</th>
              <th className="text-left font-medium px-4 py-3">Business</th>
              <th className="text-left font-medium px-4 py-3">Engine</th>
              <th className="text-left font-medium px-4 py-3">Event</th>
              <th className="text-right font-medium px-4 py-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2 text-xs text-ink-soft font-mono">{formatRelative(a.occurred_at)}</td>
                <td className="px-4 py-2">{a.business?.name ?? "—"}</td>
                <td className="px-4 py-2 font-mono text-xs">{a.engine_type ?? "—"}</td>
                <td className="px-4 py-2">{a.headline}</td>
                <td className="px-4 py-2 text-right tabular">{a.amount_cents ? formatMoney(a.amount_cents) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PageContainer>
  );
}
