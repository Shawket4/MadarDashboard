import { fmtPercent } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";

/**
 * Circular progress ring for recipe_coverage (0..1).
 * Pure SVG — no chart library needed for a single arc.
 */
export function CoverageRing({
  ratio,
  size = 96,
  strokeWidth = 8,
  label,
  className,
}: {
  ratio: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}) {
  const clamped = Math.min(1, Math.max(0, ratio));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * clamped;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            className="transition-all duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-bold tabular text-sm">
          {fmtPercent(clamped)}
        </span>
      </div>
      {label && <span className="text-xs text-muted-foreground text-center">{label}</span>}
    </div>
  );
}
