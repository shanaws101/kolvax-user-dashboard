import type { ReactNode } from "react";

type Tone = "neutral" | "primary" | "money" | "success" | "warning" | "danger" | "info";

const TONE: Record<Tone, string> = {
  neutral: "bg-secondary text-ink-soft border-border",
  primary: "bg-[#f54e0015] text-primary border-[#f54e0030]",
  money: "bg-money-soft text-money border-[#1f8a6530]",
  success: "bg-money-soft text-money border-[#1f8a6530]",
  warning: "bg-warning-soft text-warning-foreground border-warning",
  danger: "bg-destructive-soft text-destructive border-destructive",
  info: "bg-info-soft text-info border-[#4a7fbf30]",
};

const DOT_COLOR: Record<Tone, string> = {
  neutral: "bg-ink-faint",
  primary: "bg-primary",
  money: "bg-money",
  success: "bg-money",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-info",
};

export function StatusPill({
  tone = "neutral",
  children,
  dot = true,
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] " +
        TONE[tone]
      }
    >
      {dot && (
        <span
          className={
            "h-1.5 w-1.5 rounded-full " + DOT_COLOR[tone]
          }
        />
      )}
      {children}
    </span>
  );
}
