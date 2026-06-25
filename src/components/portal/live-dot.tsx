export function LiveDot({ tone = "money" }: { tone?: "money" | "warning" | "info" }) {
  const color =
    tone === "warning" ? "var(--color-warning)" : tone === "info" ? "var(--color-info)" : "var(--color-money)";
  return (
    <span className="relative inline-flex h-2 w-2 items-center justify-center">
      <span
        className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping"
        style={{ backgroundColor: color }}
      />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}
