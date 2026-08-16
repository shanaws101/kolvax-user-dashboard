import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { PageContainer, PageHeader } from "@/components/portal/app-shell";
import { Card, EmptyState } from "@/components/portal/card";
import { Sparkline, ProgressRing } from "@/components/portal/sparkline";
import { LiveDot } from "@/components/portal/live-dot";
import {
  ENGINE_DESCRIPTIONS,
  ENGINE_LABELS,
  formatMoney,
  formatRelative,
} from "@/lib/format";
import {
  PhoneOff,
  Moon,
  RotateCcw,
  Calendar,
  Star,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/engines")({
  head: () => ({ meta: [{ title: "Revenue Engines — KOLVAX" }] }),
  component: EnginesPage,
});

const ICONS: Record<string, typeof Sparkles> = {
  missed_call: PhoneOff,
  after_hours: Moon,
  reactivation: RotateCcw,
  no_show: Calendar,
  reputation: Star,
};

function EnginesPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const businessId = profile?.profile?.business_id;

  const { data: engines } = useQuery({
    queryKey: ["engines", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("revenue_engines")
          .select("*")
          .eq("business_id", businessId!)
          .order("engine_type");
        if (error || !data || data.length === 0) throw error ?? new Error("No data");
        return data;
      } catch {
        const { MOCK_ENGINES } = await import("@/lib/mock-data");
        return MOCK_ENGINES;
      }
    },
  });

  const totalRecovered = (engines ?? []).reduce((s, e) => s + (e.recovered_cents_mtd ?? 0), 0);
  const totalInMotion = (engines ?? []).reduce((s, e) => s + (e.opportunities_in_motion ?? 0), 0);
  const healthyCount = (engines ?? []).filter((e) => e.health === "healthy").length;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Revenue engines"
        title="Five engines. One operating system for revenue."
        description="Each engine recovers revenue from a different moment of friction. Your operations team tunes them weekly so the numbers keep climbing."
      />

      {!profileLoading && !businessId ? (
        <Card>
          <EmptyState title="Your workspace is not connected yet." />
        </Card>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3 mb-10">
            <SummaryStat label="Recovered this month" value={formatMoney(totalRecovered)} />
            <SummaryStat label="Opportunities in motion" value={String(totalInMotion)} />
            <SummaryStat label="Engines healthy" value={`${healthyCount} / ${(engines ?? []).length}`} />
          </section>

          <div className="space-y-5">
            {(engines ?? []).length === 0 ? (
              <Card>
                <EmptyState title="No revenue engines yet." />
              </Card>
            ) : (
              (engines ?? []).map((e) => {
                const Icon = ICONS[e.engine_type] ?? Sparkles;
                const healthy = e.health === "healthy";
                const tone = healthy ? "primary" : e.health === "attention" ? "warning" : "neutral";
                const utilization = Math.min(1, (e.opportunities_in_motion ?? 0) / 12);
                return (
                  <article
                    key={e.id}
                    className="group relative overflow-hidden rounded-lg border border-border bg-surface"
                  >
                    <div className="grid lg:grid-cols-[1.3fr_1fr]">
                      {/* LEFT — identity + KPI */}
                      <div className="p-7 lg:p-8 border-b lg:border-b-0 lg:border-r border-border-subtle relative">
                        <div className="relative">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3.5">
                              <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#f54e0010] text-primary border border-[#f54e0020]">
                                <Icon className="h-5 w-5" strokeWidth={1.75} />
                              </span>
                              <div>
                                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-faint">
                                  <LiveDot tone={tone === "warning" ? "warning" : "primary"} />
                                  <span>
                                    {healthy ? "Healthy" : e.health === "attention" ? "Needs review" : "Offline"}
                                  </span>
                                </div>
                                <h2 className="editorial-h1 text-2xl text-foreground mt-1">
                                  {ENGINE_LABELS[e.engine_type]}
                                </h2>
                              </div>
                            </div>
                            <ProgressRing
                              value={utilization}
                              tone={tone === "warning" ? "warning" : "primary"}
                              size={52}
                              stroke={4}
                            />
                          </div>

                          <p className="mt-4 text-sm text-ink-soft max-w-xl leading-relaxed">
                            {ENGINE_DESCRIPTIONS[e.engine_type]}
                          </p>

                          <div className="mt-7 flex items-end justify-between gap-4">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-faint">
                                Recovered this month
                              </p>
                              <p className="money-text text-4xl text-foreground mt-1 leading-none">
                                {formatMoney(e.recovered_cents_mtd)}
                              </p>
                            </div>
                            <Sparkline
                              seed={e.id}
                              tone={tone === "warning" ? "warning" : "money"}
                              width={160}
                              height={52}
                            />
                          </div>
                        </div>
                      </div>

                      {/* RIGHT — operational detail */}
                      <div className="p-7 lg:p-8 bg-surface-muted">
                        <div className="grid grid-cols-2 gap-4">
                          <Metric label="In motion" value={String(e.opportunities_in_motion ?? 0)} />
                          <Metric label="Last outcome" value={formatRelative(e.last_outcome_at)} />
                        </div>

                        <div className="mt-6">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-faint mb-2">
                            Capacity
                          </p>
                          <div className="track h-2">
                            <div
                              className={
                                "h-full transition-[width] duration-700 rounded-full " +
                                (tone === "warning"
                                  ? "bg-warning"
                                  : "bg-gradient-to-r from-primary to-primary-active")
                              }
                              style={{ width: `${Math.round(utilization * 100)}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-ink-faint mt-1.5">
                            Running at {Math.round(utilization * 100)}% of nominal load
                          </p>
                        </div>

                        {e.notes && (
                          <div className="mt-6 rounded-lg border border-border bg-surface p-3.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-faint mb-1">
                              Operator note
                            </p>
                            <p className="text-sm text-ink-soft leading-relaxed">{e.notes}</p>
                          </div>
                        )}

                        <div className="mt-6 flex items-center justify-end text-xs text-primary opacity-70 group-hover:opacity-100 transition-opacity">
                          <span className="inline-flex items-center gap-1 font-medium">
                            View engine timeline
                            <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </>
      )}
    </PageContainer>
  );
}

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="card-surface p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-faint">{label}</p>
      <p className="money-text text-3xl mt-2 leading-none text-foreground">
        {value}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-faint">{label}</p>
      <p className="mt-1 text-base font-medium text-foreground tabular">{value}</p>
    </div>
  );
}
