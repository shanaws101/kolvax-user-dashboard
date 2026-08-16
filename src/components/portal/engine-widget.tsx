import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Sparkline, ProgressRing } from "./sparkline";
import { LiveDot } from "./live-dot";
import { ENGINE_LABELS, formatMoney, formatRelative } from "@/lib/format";

type Engine = {
  id: string;
  engine_type: string;
  health: string;
  recovered_cents_mtd: number;
  opportunities_in_motion: number;
  last_outcome_at: string | null;
  notes: string | null;
};

export function EngineWidget({ engine, href }: { engine: Engine; href?: string }) {
  const healthy = engine.health === "healthy";
  const tone = healthy ? "primary" : engine.health === "attention" ? "warning" : "neutral";
  const utilization = Math.min(1, engine.opportunities_in_motion / 12);

  const inner = (
    <div className="group relative h-full flex flex-col rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-faint">
            <LiveDot tone={tone === "warning" ? "warning" : "primary"} />
            <span>{healthy ? "Healthy" : engine.health === "attention" ? "Needs review" : "Offline"}</span>
          </div>
          <h3 className="mt-2 text-[15px] font-semibold text-foreground leading-tight truncate">
            {ENGINE_LABELS[engine.engine_type]}
          </h3>
        </div>
        <ProgressRing value={utilization} tone={tone === "warning" ? "warning" : "primary"} size={40} stroke={3.5} />
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-faint">Recovered MTD</p>
          <p className="money-text text-2xl text-foreground mt-1">{formatMoney(engine.recovered_cents_mtd)}</p>
        </div>
        <Sparkline seed={engine.id} tone={tone === "warning" ? "warning" : "money"} width={84} height={28} />
      </div>

      <div className="mt-4 pt-4 border-t border-border-subtle grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-ink-faint">In motion</p>
          <p className="text-foreground font-medium tabular mt-0.5">{engine.opportunities_in_motion}</p>
        </div>
        <div className="text-right">
          <p className="text-ink-faint">Last outcome</p>
          <p className="text-foreground font-medium tabular mt-0.5">{formatRelative(engine.last_outcome_at)}</p>
        </div>
      </div>

      {href && (
        <div className="mt-4 flex items-center gap-1 text-[11px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Open engine <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="block h-full">
        {inner}
      </Link>
    );
  }
  return inner;
}
