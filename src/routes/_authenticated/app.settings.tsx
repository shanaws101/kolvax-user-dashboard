import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { PageContainer, PageHeader } from "@/components/portal/app-shell";
import { Card, CardHeader } from "@/components/portal/card";
import { StatusPill } from "@/components/portal/status-pill";
import { CheckCircle2, Pencil, Save, X } from "lucide-react";

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
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const businessId = profile?.profile?.business_id;
  const business = profile?.profile?.business;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    owner_name: "",
    industry: "",
    timezone: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (!business) return;
    setDraft({
      name: business.name ?? "",
      owner_name: business.owner_name ?? "",
      industry: business.industry ?? "",
      timezone: business.timezone ?? "",
      phone: business.phone ?? "",
      address: business.address ?? "",
    });
  }, [business]);

  const { data: settings } = useQuery({
    queryKey: ["settings", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const [locations, integrations] = await Promise.all([
        supabase.from("locations").select("*").eq("business_id", businessId!).order("is_primary", { ascending: false }),
        // intentionally do not select `config` — customers see status only
        supabase.from("integrations").select("id, kind, provider, status, connected_at").eq("business_id", businessId!),
      ]);
      if (locations.error) throw locations.error;
      if (integrations.error) throw integrations.error;
      return { locations: locations.data ?? [], integrations: integrations.data ?? [] };
    },
  });

  const saveBusiness = useMutation({
    mutationFn: async () => {
      if (!businessId) throw new Error("No workspace connected");
      const { error } = await supabase
        .from("businesses")
        .update({
          name: draft.name.trim(),
          owner_name: draft.owner_name.trim() || null,
          industry: draft.industry.trim() || null,
          timezone: draft.timezone.trim() || "America/Chicago",
          phone: draft.phone.trim() || null,
          address: draft.address.trim() || null,
        })
        .eq("id", businessId);
      if (error) throw error;
    },
    onSuccess: async () => {
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Settings"
        title="Business settings."
        description="Your operations team handles the technical configuration. These are the high-level details."
      />

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader
            title="Business profile"
            description="The basics."
            action={
              editing ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      if (business) {
                        setDraft({
                          name: business.name ?? "",
                          owner_name: business.owner_name ?? "",
                          industry: business.industry ?? "",
                          timezone: business.timezone ?? "",
                          phone: business.phone ?? "",
                          address: business.address ?? "",
                        });
                      }
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-ink-soft hover:bg-secondary hover:text-foreground"
                    aria-label="Cancel editing"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => saveBusiness.mutate()}
                    disabled={saveBusiness.isPending || !draft.name.trim()}
                    className="inline-flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" /> Save
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  disabled={profileLoading || !businessId}
                  className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-medium text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit settings
                </button>
              )
            }
          />
          {!profileLoading && !businessId ? (
            <p className="text-sm text-ink-soft">Your workspace is not connected yet. Refresh once; the demo workspace link has been repaired.</p>
          ) : editing ? (
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <Field label="Business name" value={draft.name} onChange={(name) => setDraft((d) => ({ ...d, name }))} required />
              <Field label="Owner" value={draft.owner_name} onChange={(owner_name) => setDraft((d) => ({ ...d, owner_name }))} />
              <Field label="Industry" value={draft.industry} onChange={(industry) => setDraft((d) => ({ ...d, industry }))} />
              <Field label="Timezone" value={draft.timezone} onChange={(timezone) => setDraft((d) => ({ ...d, timezone }))} />
              <Field label="Phone" value={draft.phone} onChange={(phone) => setDraft((d) => ({ ...d, phone }))} />
              <Field label="Address" value={draft.address} onChange={(address) => setDraft((d) => ({ ...d, address }))} />
              {saveBusiness.error && (
                <p className="sm:col-span-2 text-sm text-destructive">Could not save settings. Please try again.</p>
              )}
            </div>
          ) : (
            <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <Row label="Business name" value={business?.name} />
              <Row label="Owner" value={business?.owner_name} />
              <Row label="Industry" value={business?.industry} />
              <Row label="Timezone" value={business?.timezone} />
              <Row label="Phone" value={business?.phone} />
              <Row label="Address" value={business?.address} />
            </dl>
          )}
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

function Field({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-ink-faint">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-ink-faint focus:border-primary"
      />
    </label>
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
