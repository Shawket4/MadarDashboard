import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatCard, type StatAccent } from "@/components/app/stat-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** @deprecated use StatAccent — kept as an alias to avoid churn. */
export type LedgerAccent = StatAccent;

export interface LedgerItem {
  key: string;
  label: string;
  /** A raw number (formatted + compacted per `formatType`) or a ready node. */
  value: number | ReactNode;
  formatType?: "money" | "number" | "percent";
  icon?: LucideIcon;
  accent?: StatAccent;
  /** Signed ratio for a trend pill, e.g. 0.12 → +12%. */
  trend?: number | null;
  /** Small muted line under the value. */
  hint?: ReactNode;
  loading?: boolean;
}

// Responsive column counts keyed by item count (literal classes for the JIT).
const gridCols: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-3 lg:grid-cols-5",
  6: "sm:grid-cols-3 lg:grid-cols-6",
};

/**
 * A row of KPIs — now a responsive grid of the canonical {@link StatCard}, so
 * every KPI surface across the app shares one card: same compact/click-to-expand
 * behavior, count-up, and design. Cards stagger in on mount.
 */
export function LedgerStrip({
  items,
  className,
  dense,
}: {
  items: LedgerItem[];
  className?: string;
  /** Tighter cards for crowded grids. Defaults on at 5+ items. */
  dense?: boolean;
}) {
  const cols = gridCols[items.length] ?? "sm:grid-cols-2 lg:grid-cols-4";
  const isDense = dense ?? items.length >= 5;
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainer(0.05)}
      className={cn("grid grid-cols-2 gap-3 sm:gap-4", cols, className)}
    >
      {items.map((item) => (
        <StatCard
          key={item.key}
          dense={isDense}
          label={item.label}
          value={item.value}
          formatType={item.formatType}
          icon={item.icon}
          accent={item.accent}
          trend={item.trend}
          hint={item.hint}
          loading={item.loading}
        />
      ))}
    </motion.div>
  );
}

/**
 * A value that shows its concise form on narrow/mobile and reveals the full
 * value in a floating popover on press. On wider screens the full value renders
 * directly. Used by the per-channel delivery cards and the dashboard leaderboard.
 */
export function ConciseValue({
  full,
  compact,
  forceCompact,
}: {
  full: ReactNode;
  compact?: ReactNode;
  /** Force compact display regardless of viewport (e.g. narrow desktop columns). */
  forceCompact?: boolean;
}) {
  const isMobile = useIsMobile();
  if ((!isMobile && !forceCompact) || compact == null) return <>{full}</>;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="max-w-full cursor-pointer truncate text-start underline decoration-dotted decoration-muted-foreground/40 underline-offset-[6px] outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {compact}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-auto px-3 py-1.5">
        <span className="tabular text-sm font-semibold">{full}</span>
      </PopoverContent>
    </Popover>
  );
}
