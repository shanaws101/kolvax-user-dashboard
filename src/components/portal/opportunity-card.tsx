import { ArrowRight, Clock3 } from "lucide-react";
import { LiveDot } from "./live-dot";
import { formatMoney, formatRelative } from "@/lib/format";

export type Opportunity = {
  id: string;
  customer: string;
  context: string;
  action: string;
  engine: string;
  valueCents: number;
  progress: number; // 0..1
  updatedAt: string;
  channel?: string;
};

export function OpportunityCard({ o }: { o: Opportunity }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-raised)] hover:-translate-y-0.5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-money/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-ink-faint">
            <LiveDot />
            <span>In progress</span>
            <span className="text-border-strong">·</span>
            <span className="truncate">{o.engine}</span>
          </div>
          <h3 className="mt-2 text-base font-semibold text-foreground leading-tight truncate">
            {o.customer}
          </h3>
          <p className="mt-1 text-sm text-ink-soft leading-snug line-clamp-2">{o.context}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] uppercase tracking-wider text-ink-faint">Value</p>
          <p className="money-text text-xl text-money leading-none mt-1">
            {formatMoney(o.valueCents)}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-[11px] text-ink-faint mb-1.5">
          <span>{phaseLabel(o.progress)}</span>
          <span className="tabular">{Math.round(o.progress * 100)}%</span>
        </div>
        <div className="track h-1.5">
          <div
            className="h-full bg-gradient-to-r from-money to-money-deep transition-[width] duration-700"
            style={{ width: `${Math.round(o.progress * 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 pt-4 border-t border-border-subtle">
        <div className="flex items-center gap-2 text-xs text-ink-soft min-w-0">
          <ArrowRight className="h-3.5 w-3.5 text-money shrink-0" strokeWidth={2} />
          <span className="truncate">{o.action}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-ink-faint shrink-0">
          <Clock3 className="h-3 w-3" strokeWidth={1.75} />
          {formatRelative(o.updatedAt)}
        </div>
      </div>
    </div>
  );
}

function phaseLabel(p: number): string {
  if (p < 0.25) return "Reaching out";
  if (p < 0.55) return "Conversation in progress";
  if (p < 0.85) return "Booking being confirmed";
  return "Closing the loop";
}
