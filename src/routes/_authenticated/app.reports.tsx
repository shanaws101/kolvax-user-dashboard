import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { PageContainer, PageHeader } from "@/components/portal/app-shell";
import { Card, EmptyState } from "@/components/portal/card";
import { StatusPill } from "@/components/portal/status-pill";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/app/reports")({
  head: () => ({ meta: [{ title: "Reports — KOLVAX" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const businessId = profile?.profile?.business_id;

  const { data: reports } = useQuery({
    queryKey: ["reports", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("business_id", businessId!)
        .order("period_end", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const fmtRange = (start: string, end: string) =>
    `${new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Reports"
        title="Weekly, monthly, quarterly."
        description="Plain-language summaries of what KOLVAX recovered, week by week."
      />
      <div className="mt-8 space-y-4">
        {!profileLoading && !businessId ? (
          <Card><EmptyState title="Your workspace is not connected yet." description="Refresh once; the demo workspace link has been repaired." /></Card>
        ) : (reports ?? []).length === 0 ? (
          <Card><EmptyState title="No reports yet." description="Your first weekly summary lands at the end of this week." /></Card>
        ) : (
          (reports ?? []).map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusPill tone="info">{r.period_type === "weekly" ? "Weekly" : r.period_type === "monthly" ? "Monthly" : "Quarterly"}</StatusPill>
                    <span className="text-xs text-ink-faint">{fmtRange(r.period_start, r.period_end)}</span>
                  </div>
                  <p className="money-text text-3xl mt-3 text-foreground">{formatMoney(r.recovered_cents)}</p>
                  <p className="text-xs uppercase tracking-wider text-ink-faint">Recovered</p>
                </div>
                <div className="flex gap-6 text-sm">
                  <div>
                    <p className="tabular text-foreground font-medium">{r.bookings_recovered}</p>
                    <p className="text-xs text-ink-faint">Bookings</p>
                  </div>
                  <div>
                    <p className="tabular text-foreground font-medium">{r.customers_returned}</p>
                    <p className="text-xs text-ink-faint">Returned</p>
                  </div>
                  <div>
                    <p className="tabular text-foreground font-medium">{r.reviews_generated}</p>
                    <p className="text-xs text-ink-faint">Reviews</p>
                  </div>
                </div>
              </div>
              {r.summary_markdown && (
                <p className="mt-4 pt-4 border-t border-border text-sm text-ink-soft leading-relaxed whitespace-pre-line">
                  {r.summary_markdown.replace(/[#*]/g, "")}
                </p>
              )}
            </Card>
          ))
        )}
      </div>
    </PageContainer>
  );
}
