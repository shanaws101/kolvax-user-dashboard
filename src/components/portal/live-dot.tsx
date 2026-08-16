export function LiveDot({ tone = "primary" }: { tone?: "primary" | "money" | "warning" | "info" }) {
  const color =
    tone === "warning"
      ? "var(--color-warning)"
      : tone === "info"
        ? "var(--color-info)"
        : tone === "money"
          ? "var(--color-money)"
          : "var(--color-primary)";
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
