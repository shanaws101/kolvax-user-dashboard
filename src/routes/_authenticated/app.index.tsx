import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { PageContainer } from "@/components/portal/app-shell";
import { Card, EmptyState } from "@/components/portal/card";
import { KpiTile } from "@/components/portal/kpi";
import { OpportunityCard, type Opportunity } from "@/components/portal/opportunity-card";
import { EngineWidget } from "@/components/portal/engine-widget";
import { LiveDot } from "@/components/portal/live-dot";
import { ENGINE_LABELS, formatMoney, formatRelative } from "@/lib/format";
import { ArrowRight, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({ meta: [{ title: "Command Center — KOLVAX" }] }),
  component: CommandCenter,
});

function CommandCenter() {
  const { data: profile, isLoading: profileLoading } = useProfile();
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
      const sinceMonth = new Date();
      sinceMonth.setDate(1);
      sinceMonth.setHours(0, 0, 0, 0);

      const [handled, monthly, attention, engines, weekly, opps] = await Promise.all([
        supabase
          .from("activities")
          .select("*")
          .eq("business_id", businessId)
          .gte("occurred_at", sinceToday.toISOString())
          .order("occurred_at", { ascending: false })
          .limit(6),
        supabase
          .from("activities")
          .select("kind, amount_cents")
          .eq("business_id", businessId)
          .gte("occurred_at", sinceMonth.toISOString()),
        supabase
          .from("attention_items")
          .select("*")
          .eq("business_id", businessId)
          .is("resolved_at", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("revenue_engines")
          .select("*")
          .eq("business_id", businessId)
          .order("engine_type"),
        supabase
          .from("reports")
          .select("*")
          .eq("business_id", businessId)
          .eq("period_type", "weekly")
          .order("period_end", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("customers")
          .select("*")
          .eq("business_id", businessId)
          .gt("revenue_opportunity_cents", 0)
          .order("revenue_opportunity_cents", { ascending: false })
          .limit(6),
      ]);
      const firstError =
        handled.error ?? monthly.error ?? attention.error ?? engines.error ?? weekly.error ?? opps.error;
      if (firstError) throw firstError;

      const m = monthly.data ?? [];
      const bookingsRecovered = m.filter((a) => a.kind === "recovered_booking").length;
      const customersReturned = m.filter((a) => a.kind === "customer_returned").length;
      const reviewsGenerated = m.filter((a) => a.kind === "review_generated").length;

      const inMotionTotal = (engines.data ?? []).reduce(
        (s, r) => s + (r.opportunities_in_motion ?? 0),
        0,
      );

      const opportunities: Opportunity[] = (opps.data ?? []).map((c, i) => ({
        id: c.id,
        customer: c.full_name,
        engine: pickEngineForCustomer(c.status, i),
        context:
          c.last_interaction_summary ??
          `${c.status === "lapsed" ? "Lapsed customer" : c.status === "vip" ? "VIP customer" : "Customer"} — opportunity in motion.`,
        action: nextAction(c.status, i),
        valueCents: c.revenue_opportunity_cents ?? 0,
        progress: progressFor(c.id, i),
        updatedAt: c.last_visit_at ?? new Date().toISOString(),
      }));

      return {
        handled: handled.data ?? [],
        bookingsRecovered,
        customersReturned,
        reviewsGenerated,
        inMotionTotal,
        attention: attention.data ?? [],
        engines: engines.data ?? [],
        weekly: weekly.data,
        opportunities,
      };
    },
  });

  if (profileLoading || isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div className="h-48 shimmer rounded-2xl bg-surface border border-border" />
          <div className="grid grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-32 shimmer rounded-xl bg-surface border border-border" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!businessId || !data) {
    return (
      <PageContainer>
        <Card>
          <EmptyState
            title="Your workspace is not connected yet."
            description="Refresh once; if this still appears, sign out and sign back in."
          />
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* HERO */}
      <section className="hero-surface px-7 lg:px-10 py-9 lg:py-11">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-ink-faint">
            <LiveDot />
            <span>Live · This month</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-soft">
            <TrendingUp className="h-3.5 w-3.5 text-money" strokeWidth={2} />
            <span>
              <strong className="text-foreground tabular">{data.inMotionTotal}</strong> opportunities in motion
            </span>
          </div>
        </div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-money mb-3">Recovered for {businessName}</p>
        <h1 className="editorial-h1 text-5xl lg:text-7xl text-foreground leading-[0.98]">
          <span className="text-money">{formatMoney(recoveredMtd)}</span>
        </h1>
        <p className="mt-5 text-base text-ink-soft max-w-2xl leading-relaxed">
          Everything is running automatically. KOLVAX is recovering revenue across five engines while you focus on running the floor.
        </p>
      </section>

      {/* KPI ROW */}
      <section className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Recovered Revenue"
          value={formatMoney(recoveredMtd, { compact: true })}
          trendSeed={`rev-${businessId}`}
          tone="money"
          caption={<span>Month to date</span>}
        />
        <KpiTile
          label="Recovered Bookings"
          value={String(data.bookingsRecovered)}
          trendSeed={`book-${businessId}`}
          tone="money"
          caption={<span>Confirmed appts</span>}
        />
        <KpiTile
          label="Customers Reactivated"
          value={String(data.customersReturned)}
          trendSeed={`react-${businessId}`}
          tone="info"
          caption={<span>Returned this month</span>}
        />
        <KpiTile
          label="Reviews Generated"
          value={String(data.reviewsGenerated)}
          trendSeed={`rev-rev-${businessId}`}
          tone="money"
          caption={<span>Fresh & verified</span>}
        />
      </section>

      {/* REVENUE IN MOTION */}
      <section className="mt-10">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-ink-faint mb-1.5">Working right now</p>
            <h2 className="editorial-h1 text-2xl lg:text-3xl text-foreground">Revenue in motion</h2>
          </div>
          <Link
            to="/app/customers"
            className="hidden sm:inline-flex items-center gap-1 text-xs text-money font-medium hover:underline"
          >
            See all opportunities <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {data.opportunities.length === 0 ? (
          <Card>
            <EmptyState
              title="No active opportunities yet."
              description="As KOLVAX picks up missed calls, lapsed customers, and after-hours requests, they'll appear here as live cards."
            />
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.opportunities.map((o) => (
              <OpportunityCard key={o.id} o={o} />
            ))}
          </div>
        )}
      </section>

      {/* ATTENTION + TODAY */}
      <section className="mt-10 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {data.attention.length > 0 && (
            <div className="attention-surface p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-warning/15 text-warning-foreground">
                    <AlertCircle className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-warning-foreground/70">Needs your input</p>
                    <h3 className="text-base font-semibold text-warning-foreground">
                      {data.attention.length} item{data.attention.length === 1 ? "" : "s"} waiting on you
                    </h3>
                  </div>
                </div>
              </div>
              <ul className="space-y-2.5">
                {data.attention.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg bg-surface/80 backdrop-blur border border-warning/20 p-3.5 hover:bg-surface transition-colors"
                  >
                    <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-warning/20 text-warning-foreground shrink-0">
                      <AlertCircle className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">{item.description}</p>
                      )}
                    </div>
                    {item.cta_label && (
                      <button className="shrink-0 rounded-md bg-warning-foreground/90 px-2.5 py-1 text-[11px] font-medium text-warning-soft hover:bg-warning-foreground transition-colors">
                        {item.cta_label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card-raised p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Handled for you today</p>
                <h3 className="text-base font-semibold text-foreground mt-0.5">
                  KOLVAX has taken care of {data.handled.length} thing{data.handled.length === 1 ? "" : "s"}
                </h3>
              </div>
              <Link to="/app/activity" className="text-xs text-money font-medium inline-flex items-center gap-1 hover:underline">
                Activity log <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {data.handled.length === 0 ? (
              <EmptyState title="A quiet morning so far." description="New activity will appear here as it happens." />
            ) : (
              <ol className="relative pl-5 space-y-3.5">
                <span className="absolute left-[7px] top-1 bottom-1 w-px bg-border" aria-hidden />
                {data.handled.map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-5 top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-money-soft border border-money/20">
                      <CheckCircle2 className="h-2.5 w-2.5 text-money" strokeWidth={2.5} />
                    </span>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm text-foreground leading-snug">{a.headline}</p>
                      <span className="text-[11px] text-ink-faint tabular shrink-0">{formatRelative(a.occurred_at)}</span>
                    </div>
                    {a.amount_cents != null && (
                      <p className="text-xs text-money money-text mt-0.5">{formatMoney(a.amount_cents)}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* WEEKLY DIGEST */}
        {data.weekly && (
          <div className="card-raised p-6 flex flex-col">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">This week's summary</p>
            <p className="money-text text-4xl text-money mt-2 leading-none">
              {formatMoney(data.weekly.recovered_cents)}
            </p>
            <p className="text-xs text-ink-faint mt-1">recovered this week</p>

            <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
              <Stat n={data.weekly.bookings_recovered} l="Bookings" />
              <Stat n={data.weekly.customers_returned} l="Returned" />
              <Stat n={data.weekly.reviews_generated} l="Reviews" />
            </dl>
            <p className="mt-5 text-xs text-ink-soft leading-relaxed flex-1 line-clamp-6">
              {(data.weekly.summary_markdown ?? "").replace(/[#*]/g, "")}
            </p>
            <Link
              to="/app/reports"
              className="mt-4 inline-flex items-center gap-1 text-xs text-money font-medium hover:underline"
            >
              Read full reports <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </section>

      {/* ENGINE HEALTH */}
      <section className="mt-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-ink-faint mb-1.5">Revenue engines</p>
            <h2 className="editorial-h1 text-2xl lg:text-3xl text-foreground">Engine health</h2>
          </div>
          <Link
            to="/app/engines"
            className="hidden sm:inline-flex items-center gap-1 text-xs text-money font-medium hover:underline"
          >
            Open engines <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {data.engines.length === 0 ? (
          <Card>
            <EmptyState title="No engines deployed yet." />
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {data.engines.map((e) => {
              const Icon = ENGINE_ICONS[e.engine_type] ?? Sparkles;
              return (
                <EngineWidget
                  key={e.id}
                  engine={{
                    ...e,
                    notes: e.notes,
                  }}
                  href="/app/engines"
                />
              );
            })}
          </div>
        )}
      </section>
    </PageContainer>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="rounded-lg bg-surface-sunken border border-border-subtle py-2.5">
      <p className="money-text text-lg text-foreground leading-none">{n}</p>
      <p className="text-[10px] uppercase tracking-wider text-ink-faint mt-1">{l}</p>
    </div>
  );
}

function pickEngineForCustomer(status: string, i: number) {
  if (status === "lapsed") return ENGINE_LABELS.reactivation;
  if (status === "vip") return ENGINE_LABELS.reputation;
  return [ENGINE_LABELS.missed_call, ENGINE_LABELS.after_hours, ENGINE_LABELS.no_show][i % 3];
}

function nextAction(status: string, i: number) {
  if (status === "lapsed") return "Sending personalized return offer";
  if (status === "vip") return "Inviting a 5-star review";
  return ["Confirming booking via SMS", "Booking after-hours request", "Sending no-show reminder"][i % 3];
}

function progressFor(id: string, i: number) {
  let h = 0;
  for (let k = 0; k < id.length; k++) h = (h * 31 + id.charCodeAt(k)) >>> 0;
  return Math.min(0.95, 0.25 + ((h + i * 17) % 70) / 100);
}
