// Deterministic, decorative sparkline.
// Shape is derived from a stable seed so the same input always renders identically.
// It is a visual trend indicator only — never display axis values from it.

export function Sparkline({
  seed,
  tone = "money",
  width = 120,
  height = 36,
  className = "",
}: {
  seed: string;
  tone?: "money" | "info" | "warning" | "neutral";
  width?: number;
  height?: number;
  className?: string;
}) {
  const points = buildSeries(seed, 18);
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(max - min, 1);
  const stepX = width / (points.length - 1);
  const coords = points.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });
  const path = coords
    .map(([x, y], i) => (i === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`))
    .join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;

  const color =
    tone === "money"
      ? "var(--color-money)"
      : tone === "info"
        ? "var(--color-info)"
        : tone === "warning"
          ? "var(--color-warning)"
          : "var(--color-ink-faint)";

  const gradId = `sl-${hash(seed)}`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="2.5" fill={color} />
    </svg>
  );
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildSeries(seed: string, n: number): number[] {
  let h = hash(seed);
  const next = () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return (h % 1000) / 1000;
  };
  // Gentle upward random walk with one or two dips.
  const out: number[] = [];
  let v = 0.4 + next() * 0.2;
  for (let i = 0; i < n; i++) {
    const trend = 0.018;
    const noise = (next() - 0.5) * 0.12;
    v = Math.max(0.05, Math.min(0.95, v + trend + noise));
    out.push(v);
  }
  return out;
}

export function ProgressRing({
  value,
  size = 44,
  stroke = 4,
  tone = "money",
  label,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  tone?: "money" | "info" | "warning";
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  const offset = c * (1 - clamped);
  const color =
    tone === "money" ? "var(--color-money)" : tone === "info" ? "var(--color-info)" : "var(--color-warning)";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-border-strong)" strokeOpacity={0.4} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          fill="none"
        />
      </svg>
      {label && (
        <span className="absolute text-[10px] font-medium text-ink-soft tabular">{label}</span>
      )}
    </div>
  );
}
