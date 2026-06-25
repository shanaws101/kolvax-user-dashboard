export function formatMoney(cents: number, opts: { compact?: boolean } = {}) {
  const dollars = (cents ?? 0) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: opts.compact ? "compact" : "standard",
    maximumFractionDigits: opts.compact ? 1 : 0,
  }).format(dollars);
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDay(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (isSameDay(d, today)) return "Today";
  if (isSameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export const ENGINE_LABELS: Record<string, string> = {
  missed_call: "Missed Call Recovery",
  after_hours: "After-Hours Booking",
  reactivation: "Customer Reactivation",
  no_show: "No-Show Prevention",
  reputation: "Review & Reputation Growth",
};

export const ENGINE_DESCRIPTIONS: Record<string, string> = {
  missed_call: "Every missed call is followed up within 60 seconds so the booking doesn't walk away.",
  after_hours: "Inquiries that arrive after closing are answered and booked — no business lost overnight.",
  reactivation: "Lapsed customers are gently invited back so revenue you've already earned doesn't fade.",
  no_show: "Appointments are confirmed twice before they happen, so the chair doesn't sit empty.",
  reputation: "Recent visitors are invited to leave reviews while the experience is fresh.",
};

export const ACTIVITY_LABELS: Record<string, string> = {
  recovered_booking: "Booking recovered",
  customer_returned: "Customer returned",
  review_generated: "Review generated",
  appointment_confirmed: "Appointment confirmed",
  reminder_sent: "Reminder sent",
  opportunity_opened: "Opportunity opened",
};
