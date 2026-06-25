import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { PageContainer, PageHeader } from "@/components/portal/app-shell";
import { Card, EmptyState } from "@/components/portal/card";
import { StatusPill } from "@/components/portal/status-pill";
import { formatMoney, formatRelative } from "@/lib/format";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/customers")({
  head: () => ({ meta: [{ title: "Customers — KOLVAX" }] }),
  component: CustomersPage,
});

const STATUS_TONE = {
  vip: "money", active: "success", new: "info", lapsed: "warning",
} as const;
const STATUS_LABEL = { vip: "VIP", active: "Active", new: "New", lapsed: "Lapsed" } as const;

function CustomersPage() {
  const { data: profile } = useProfile();
  const businessId = profile?.profile?.business_id;
  const [q, setQ] = useState("");

  const { data: customers } = useQuery({
    queryKey: ["customers", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("*")
        .eq("business_id", businessId!)
        .order("last_visit_at", { ascending: false, nullsFirst: false });
      return data ?? [];
    },
  });

  const filtered = (customers ?? []).filter((c) =>
    q ? c.full_name.toLowerCase().includes(q.toLowerCase()) : true,
  );

  const totalLtv = (customers ?? []).reduce((s, c) => s + (c.lifetime_value_cents ?? 0), 0);
  const opportunities = (customers ?? []).reduce((s, c) => s + (c.revenue_opportunity_cents ?? 0), 0);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Customers"
        title="Your customer relationships."
        description="A focused view of who's active, who's lapsed, and where revenue opportunities live."
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wider text-ink-faint">Total customers</p>
          <p className="mt-2 money-text text-2xl">{customers?.length ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-ink-faint">Lifetime value</p>
          <p className="mt-2 money-text text-2xl">{formatMoney(totalLtv)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-ink-faint">Open revenue opportunity</p>
          <p className="mt-2 money-text text-2xl text-money">{formatMoney(opportunities)}</p>
        </Card>
      </div>

      <Card className="mt-6 !p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search customers"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
          />
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="No customers match." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-ink-faint">
                <tr className="border-b border-border">
                  <Th>Name</Th>
                  <Th>Status</Th>
                  <Th>Last visit</Th>
                  <Th className="text-right">Lifetime value</Th>
                  <Th className="text-right">Opportunity</Th>
                  <Th>Last interaction</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                    <Td>
                      <p className="font-medium text-foreground">{c.full_name}</p>
                      <p className="text-xs text-ink-faint">{c.email ?? c.phone}</p>
                    </Td>
                    <Td>
                      <StatusPill tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</StatusPill>
                    </Td>
                    <Td className="text-ink-soft">{formatRelative(c.last_visit_at)}</Td>
                    <Td className="text-right tabular text-foreground">{formatMoney(c.lifetime_value_cents)}</Td>
                    <Td className="text-right tabular text-money">
                      {c.revenue_opportunity_cents ? formatMoney(c.revenue_opportunity_cents) : "—"}
                    </Td>
                    <Td className="text-ink-soft max-w-xs truncate">{c.last_interaction_summary ?? "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={"text-left font-medium px-4 py-3 " + className}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={"px-4 py-3 " + className}>{children}</td>;
}
