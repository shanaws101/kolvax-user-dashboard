import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Sparkline } from "./sparkline";

export function KpiTile({
  label,
  value,
  trendSeed,
  tone = "money",
  caption,
  accent,
}: {
  label: string;
  value: string;
  trendSeed: string;
  tone?: "money" | "info" | "warning" | "neutral";
  caption?: ReactNode;
  accent?: ReactNode;
}) {
  return (
    <div className="card-raised p-5 flex flex-col gap-4 group transition-shadow hover:shadow-[var(--shadow-pop)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{label}</p>
          <p className="mt-2 money-text text-3xl text-foreground leading-none">{value}</p>
        </div>
        {accent}
      </div>
      <div className="flex items-end justify-between">
        <div className="text-xs text-ink-soft flex items-center gap-1.5">
          {caption}
        </div>
        <Sparkline seed={trendSeed} tone={tone} width={92} height={28} />
      </div>
    </div>
  );
}

export function TrendBadge({ direction = "up", value }: { direction?: "up" | "down"; value: string }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border " +
        (direction === "up"
          ? "bg-money-soft text-money border-money/15"
          : "bg-secondary text-ink-soft border-border")
      }
    >
      <ArrowUpRight className={"h-3 w-3 " + (direction === "down" ? "rotate-90" : "")} strokeWidth={2} />
      {value}
    </span>
  );
}
