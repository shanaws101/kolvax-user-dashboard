import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { PageContainer, PageHeader } from "@/components/portal/app-shell";
import { Card, EmptyState } from "@/components/portal/card";
import { ACTIVITY_LABELS, ENGINE_LABELS, formatDay, formatMoney, formatRelative } from "@/lib/format";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/activity")({
  head: () => ({ meta: [{ title: "Activity — KOLVAX" }] }),
  component: ActivityPage,
});

function ActivityPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const businessId = profile?.profile?.business_id;

  const { data: events } = useQuery({
    queryKey: ["activities", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .eq("business_id", businessId!)
          .order("occurred_at", { ascending: false })
          .limit(200);
        if (error || !data || data.length === 0) throw error ?? new Error("No data");
        return data;
      } catch {
        const { MOCK_ACTIVITIES } = await import("@/lib/mock-data");
        return MOCK_ACTIVITIES;
      }
    },
  });

  const grouped = groupByDay(events ?? []);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Activity"
        title="Every outcome, in plain English."
        description="A running record of what KOLVAX has done for your business."
      />
      <div className="mt-8 space-y-10">
        {!profileLoading && !businessId ? (
          <Card><EmptyState title="Your workspace is not connected yet." description="Refresh once; the demo workspace link has been repaired." /></Card>
        ) : grouped.length === 0 ? (
          <Card><EmptyState title="No activity yet." description="As KOLVAX recovers revenue, it'll show up here." /></Card>
        ) : (
          grouped.map(([day, items]) => (
            <section key={day}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-faint mb-4">{day}</p>
              <Card className="!p-0">
                <ul>
                  {items.map((a, i) => (
                    <li key={a.id} className={"flex items-start gap-4 px-6 py-4 " + (i > 0 ? "border-t border-border" : "")}>
                      <CheckCircle2 className="h-4 w-4 text-money mt-0.5 shrink-0" strokeWidth={1.75} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{a.headline}</p>
                          <p className="text-xs text-ink-faint">{formatRelative(a.occurred_at)}</p>
                        </div>
                        {a.detail && <p className="mt-1 text-sm text-ink-soft">{a.detail}</p>}
                        <div className="mt-2 flex items-center gap-3 text-xs text-ink-faint">
                          <span>{ACTIVITY_LABELS[a.kind]}</span>
                          {a.engine_type && <span>· {ENGINE_LABELS[a.engine_type]}</span>}
                          {a.amount_cents != null && <span className="text-money font-medium">· {formatMoney(a.amount_cents)}</span>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ))
        )}
      </div>
    </PageContainer>
  );
}

function groupByDay<T extends { occurred_at: string }>(items: T[]): Array<[string, T[]]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = formatDay(item.occurred_at);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries());
}
