export function KolvaxLogo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="KOLVAX"
    >
      <rect x="35" y="20" width="15" height="15" fill="var(--color-primary, #f54e00)" />
      <rect x="50" y="35" width="15" height="30" fill="var(--color-primary, #f54e00)" />
      <rect x="35" y="65" width="15" height="15" fill="var(--color-primary, #f54e00)" />
    </svg>
  );
}
