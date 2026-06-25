import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { PageContainer, PageHeader } from "@/components/portal/app-shell";
import { Card, EmptyState } from "@/components/portal/card";
import { StatusPill } from "@/components/portal/status-pill";
import { ENGINE_DESCRIPTIONS, ENGINE_LABELS, formatMoney, formatRelative } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/app/engines")({
  head: () => ({ meta: [{ title: "Revenue Engines — KOLVAX" }] }),
  component: EnginesPage,
});

function EnginesPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const businessId = profile?.profile?.business_id;

  const { data: engines } = useQuery({
    queryKey: ["engines", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenue_engines")
        .select("*")
        .eq("business_id", businessId!)
        .order("engine_type");
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!profileLoading && !businessId) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow="Revenue engines"
          title="Five engines working in the background."
          description="Each engine recovers revenue from a different moment of friction."
        />
        <Card className="mt-8">
          <EmptyState title="Your workspace is not connected yet." description="Refresh once; the demo workspace link has been repaired." />
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Revenue engines"
        title="Five engines working in the background."
        description="Each engine recovers revenue from a different moment of friction. Your operations team tunes them weekly."
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {(engines ?? []).length === 0 ? (
          <Card className="lg:col-span-2">
            <EmptyState title="No revenue engines yet." description="Deployed engines will show health, recovered revenue, and active opportunities here." />
          </Card>
        ) : (engines ?? []).map((e) => (
          <Card key={e.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">{ENGINE_LABELS[e.engine_type]}</h2>
                <p className="mt-1.5 text-sm text-ink-soft max-w-md">{ENGINE_DESCRIPTIONS[e.engine_type]}</p>
              </div>
              <StatusPill tone={e.health === "healthy" ? "success" : e.health === "attention" ? "warning" : "danger"}>
                {e.health === "healthy" ? "Healthy" : e.health === "attention" ? "Attention" : "Offline"}
              </StatusPill>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 pt-5 border-t border-border">
              <Stat label="Recovered this month" value={formatMoney(e.recovered_cents_mtd)} />
              <Stat label="In motion" value={String(e.opportunities_in_motion)} />
              <Stat label="Last outcome" value={formatRelative(e.last_outcome_at)} />
            </div>
            {e.notes && (
              <p className="mt-5 text-sm text-ink-soft bg-secondary/60 rounded-md p-3 border border-border">
                {e.notes}
              </p>
            )}
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="mt-1 text-lg font-medium text-foreground tabular">{value}</p>
    </div>
  );
}
