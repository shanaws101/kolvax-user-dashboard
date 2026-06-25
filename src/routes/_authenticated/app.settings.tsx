import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { PageContainer, PageHeader } from "@/components/portal/app-shell";
import { Card, CardHeader } from "@/components/portal/card";
import { StatusPill } from "@/components/portal/status-pill";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/settings")({
  head: () => ({ meta: [{ title: "Settings — KOLVAX" }] }),
  component: SettingsPage,
});

const INTEGRATION_KIND_LABELS = {
  crm: "Booking system",
  calendar: "Calendar",
  phone: "Phone",
  reviews: "Reviews",
} as const;

function SettingsPage() {
  const { data: profile } = useProfile();
  const businessId = profile?.profile?.business_id;

  const { data: settings } = useQuery({
    queryKey: ["settings", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const [locations, integrations] = await Promise.all([
        supabase.from("locations").select("*").eq("business_id", businessId!).order("is_primary", { ascending: false }),
        // intentionally do not select `config` — customers see status only
        supabase.from("integrations").select("id, kind, provider, status, connected_at").eq("business_id", businessId!),
      ]);
      return { locations: locations.data ?? [], integrations: integrations.data ?? [] };
    },
  });

  const business = profile?.profile?.business;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Settings"
        title="Business settings."
        description="Your operations team handles the technical configuration. These are the high-level details."
      />

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader title="Business profile" description="The basics." />
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <Row label="Business name" value={business?.name} />
            <Row label="Owner" value={business?.owner_name} />
            <Row label="Industry" value={business?.industry} />
            <Row label="Timezone" value={business?.timezone} />
            <Row label="Phone" value={business?.phone} />
            <Row label="Address" value={business?.address} />
          </dl>
        </Card>

        <Card>
          <CardHeader title="Locations" description="Where you operate." />
          <ul className="space-y-3">
            {(settings?.locations ?? []).map((l) => (
              <li key={l.id} className="flex items-start justify-between gap-4 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{l.name}</p>
                  <p className="text-xs text-ink-soft mt-0.5">{l.address}</p>
                </div>
                {l.is_primary && <StatusPill tone="info">Primary</StatusPill>}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Users" description="Who can sign in to this dashboard." />
          <div className="flex items-center gap-3 py-2">
            <div className="h-9 w-9 rounded-full bg-money-soft text-money grid place-items-center text-xs font-semibold">
              {(profile?.profile?.full_name ?? "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{profile?.profile?.full_name}</p>
              <p className="text-xs text-ink-soft">Owner · You</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-faint">To add another user, contact your operations team.</p>
        </Card>

        <Card>
          <CardHeader title="Notifications" description="How you want to hear from us." />
          <ul className="space-y-3">
            <Toggle label="Weekly summary email" defaultOn />
            <Toggle label="Items needing your input" defaultOn />
            <Toggle label="Daily activity digest" />
          </ul>
          <p className="mt-3 text-xs text-ink-faint">Preferences are saved automatically.</p>
        </Card>

        <Card>
          <CardHeader title="Connected systems" description="What's wired up for your business." />
          <ul className="space-y-3">
            {(settings?.integrations ?? []).map((i) => (
              <li key={i.id} className="flex items-center justify-between py-1.5">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {INTEGRATION_KIND_LABELS[i.kind]} — {i.provider}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {i.status === "connected" ? `Connected ${new Date(i.connected_at!).toLocaleDateString()}` : "Setup in progress"}
                  </p>
                </div>
                {i.status === "connected" ? (
                  <StatusPill tone="success">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </StatusPill>
                ) : (
                  <StatusPill tone="warning">Pending</StatusPill>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-faint">Your operations team handles all setup — no keys or credentials needed from you.</p>
        </Card>
      </div>
    </PageContainer>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value ?? "—"}</dd>
    </div>
  );
}

function Toggle({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  return (
    <li className="flex items-center justify-between py-1.5">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        className={"relative h-5 w-9 rounded-full transition-colors " + (defaultOn ? "bg-money" : "bg-border-strong")}
        aria-pressed={defaultOn}
      >
        <span className={"absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all " + (defaultOn ? "left-4" : "left-0.5")} />
      </button>
    </li>
  );
}
