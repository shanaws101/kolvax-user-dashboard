import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { PageContainer } from "@/components/portal/app-shell";
import { Card, CardHeader, EmptyState } from "@/components/portal/card";
import { StatusPill } from "@/components/portal/status-pill";
import { ACTIVITY_LABELS, ENGINE_LABELS, formatMoney, formatRelative } from "@/lib/format";
import { ArrowRight, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({ meta: [{ title: "Command Center — KOLVAX" }] }),
  component: CommandCenter,
});

function CommandCenter() {
  const { data: profile } = useProfile();
  const businessId = profile?.profile?.business_id;
  const businessName = profile?.profile?.business?.name ?? "your business";
  const recoveredMtd = profile?.profile?.business?.monthly_recovered_cents ?? 0;

  const { data, isLoading } = useQuery({
    queryKey: ["command-center", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      if (!businessId) return null;
      const sinceToday = new Date();
      sinceToday.setHours(0, 0, 0, 0);
      const [handled, inMotion, attention, engines, weekly] = await Promise.all([
        supabase
          .from("activities")
          .select("*")
          .eq("business_id", businessId)
          .gte("occurred_at", sinceToday.toISOString())
          .order("occurred_at", { ascending: false })
          .limit(8),
        supabase.from("revenue_engines").select("opportunities_in_motion").eq("business_id", businessId),
        supabase.from("attention_items").select("*").eq("business_id", businessId).is("resolved_at", null).order("created_at", { ascending: false }),
        supabase.from("revenue_engines").select("*").eq("business_id", businessId).order("engine_type"),
        supabase.from("reports").select("*").eq("business_id", businessId).eq("period_type", "weekly").order("period_end", { ascending: false }).limit(1).maybeSingle(),
      ]);
      return {
        handled: handled.data ?? [],
        inMotionTotal: (inMotion.data ?? []).reduce((s, r) => s + (r.opportunities_in_motion ?? 0), 0),
        attention: attention.data ?? [],
        engines: engines.data ?? [],
        weekly: weekly.data,
      };
    },
  });

  if (isLoading || !data) {
    return (
      <PageContainer>
        <div className="h-64 animate-pulse rounded-xl bg-secondary/40" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <section className="mb-12">
        <p className="text-xs uppercase tracking-[0.18em] text-money mb-4">This month</p>
        <h1 className="editorial-h1 text-4xl lg:text-6xl text-foreground max-w-4xl leading-[1.05]">
          KOLVAX recovered{" "}
          <span className="text-money">{formatMoney(recoveredMtd)}</span>{" "}
          for {businessName} this month.
        </h1>
        <p className="mt-6 text-base text-ink-soft max-w-2xl">
          Everything is running automatically. We're currently working on{" "}
          <strong className="text-foreground">{data.inMotionTotal} opportunities</strong>{" "}
          across your five engines.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Handled for you today"
            description="What KOLVAX has already taken care of."
            action={
              <Link to="/app/activity" className="text-xs text-money font-medium inline-flex items-center gap-1">
                See all <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          {data.handled.length === 0 ? (
            <EmptyState title="A quiet morning so far." description="New activity will appear here as it happens." />
          ) : (
            <ul className="space-y-3">
              {data.handled.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-money mt-0.5 shrink-0" strokeWidth={1.75} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{a.headline}</p>
                    <p className="text-xs text-ink-faint mt-0.5">
                      {formatRelative(a.occurred_at)}
                      {a.amount_cents ? ` · ${formatMoney(a.amount_cents)}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Revenue in motion"
            description="Opportunities KOLVAX is working on right now."
          />
          <div className="space-y-3">
            {data.engines.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-foreground">{ENGINE_LABELS[e.engine_type]}</span>
                <span className="text-sm tabular text-ink-soft">
                  {e.opportunities_in_motion} in motion
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Needs your input" description="The only items that actually need you." />
          {data.attention.length === 0 ? (
            <EmptyState title="Nothing needs your attention." description="We'll surface anything that requires a decision." />
          ) : (
            <ul className="space-y-3">
              {data.attention.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <AlertCircle
                    className={"h-4 w-4 mt-0.5 shrink-0 " + (item.severity === "action" ? "text-warning" : "text-ink-faint")}
                    strokeWidth={1.75}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    {item.description && <p className="text-xs text-ink-soft mt-0.5">{item.description}</p>}
                    {item.cta_label && (
                      <button className="mt-2 text-xs font-medium text-money hover:underline">
                        {item.cta_label} →
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Engine health" description="All five engines at a glance." />
          <div className="space-y-3">
            {data.engines.map((e) => (
              <div key={e.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-ink-faint" strokeWidth={1.75} />
                  <span className="text-sm text-foreground">{ENGINE_LABELS[e.engine_type]}</span>
                </div>
                <StatusPill tone={e.health === "healthy" ? "success" : e.health === "attention" ? "warning" : "danger"}>
                  {e.health === "healthy" ? "Healthy" : e.health === "attention" ? "Attention" : "Offline"}
                </StatusPill>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {data.weekly && (
        <Card className="mt-6">
          <CardHeader
            title="This week's summary"
            description={`${formatMoney(data.weekly.recovered_cents)} recovered · ${data.weekly.bookings_recovered} bookings · ${data.weekly.customers_returned} customers returned · ${data.weekly.reviews_generated} reviews`}
            action={
              <Link to="/app/reports" className="text-xs text-money font-medium inline-flex items-center gap-1">
                See reports <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-line">
            {(data.weekly.summary_markdown ?? "").replace(/[#*]/g, "")}
          </p>
        </Card>
      )}

      {/* Tiny activity-kinds legend used for downstream pages — keeps the label map in this bundle */}
      <span className="sr-only">{Object.values(ACTIVITY_LABELS).join(" ")}</span>
    </PageContainer>
  );
}
