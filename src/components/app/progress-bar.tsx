import { cn } from "@/lib/utils";

export type ProgressAccent = "primary" | "brand" | "success" | "warning" | "info" | "destructive";

const accentFill: Record<ProgressAccent, string> = {
  primary: "bg-primary",
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  destructive: "bg-destructive",
};

interface ProgressBarProps {
  value: number;
  max?: number;
  /** Required for screen readers — describes what the bar measures. */
  ariaLabel: string;
  /** Fill hue (token-backed). Defaults to primary. */
  accent?: ProgressAccent;
  className?: string;
}

/** Accessible, token-themed progress bar. Track is muted; fill is a semantic hue. */
export function ProgressBar({ value, max = 100, ariaLabel, accent = "primary", className }: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const pct = (clamped / safeMax) * 100;
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={Math.round(safeMax)}
      aria-label={ariaLabel}
      className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none", accentFill[accent])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
