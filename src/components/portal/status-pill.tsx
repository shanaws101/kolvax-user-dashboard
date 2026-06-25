import type { ReactNode } from "react";

type Tone = "neutral" | "money" | "success" | "warning" | "danger" | "info";

const TONE: Record<Tone, string> = {
  neutral: "bg-secondary text-ink-soft border-border",
  money: "bg-money-soft text-money border-money/20",
  success: "bg-money-soft text-money border-money/20",
  warning: "bg-[oklch(0.96_0.08_75)] text-warning-foreground border-[oklch(0.85_0.12_75)]",
  danger: "bg-[oklch(0.96_0.05_27)] text-destructive border-[oklch(0.86_0.12_27)]",
  info: "bg-secondary text-ink-soft border-border",
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium " +
        TONE[tone]
      }
    >
      {dot && (
        <span
          className={
            "h-1.5 w-1.5 rounded-full " +
            (tone === "money" || tone === "success"
              ? "bg-money"
              : tone === "warning"
                ? "bg-warning"
                : tone === "danger"
                  ? "bg-destructive"
                  : "bg-ink-faint")
          }
        />
      )}
      {children}
    </span>
  );
}
