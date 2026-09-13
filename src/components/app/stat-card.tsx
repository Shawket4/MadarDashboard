import type { ReactNode } from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fmtPercent } from "@/lib/format";
import { listItem } from "@/lib/motion";
import { StatValue, type StatFormat } from "@/components/app/stat-value";

export type StatAccent = "neutral" | "brand" | "primary" | "success" | "warning" | "info" | "destructive";

// Stat cards are quiet: the glyph is a small muted mark beside the label, and
// only states that MEAN something (a void, a shortfall) tint it.
const accentClasses: Record<StatAccent, string> = {
  neutral: "text-muted-foreground",
  brand: "text-muted-foreground",
  primary: "text-muted-foreground",
  info: "text-muted-foreground",
  success: "text-[color-mix(in_oklch,var(--color-success)_60%,var(--color-foreground))]",
  warning: "text-[color-mix(in_oklch,var(--color-warning)_55%,var(--color-foreground))]",
  destructive: "text-[color-mix(in_oklch,var(--color-destructive)_60%,var(--color-foreground))]",
};

// Font-size ladders (px) the value fits itself into — largest that fits wins,
// shrinking before the figure is ever compacted.
const SIZES = [24, 22, 20, 18, 16];
const SIZES_DENSE = [20, 18, 16, 15, 14];

interface StatCardProps {
  label: string;
  /** A number (smart-formatted + fitted), a ready string, or a node (e.g. skeleton). */
  value: number | string | ReactNode;
  formatType?: StatFormat;
  icon?: LucideIcon;
  accent?: StatAccent;
  /** Signed ratio, e.g. 0.123 → +12.3%. */
  trend?: number | null;
  hint?: ReactNode;
  loading?: boolean;
  /** Tighter padding + smaller value text — for crowded grids (e.g. 4-up KPI rows). */
  dense?: boolean;
  /** Small control rendered in the header row (e.g. a per-KPI filter). */
  action?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  label,
  value,
  formatType,
  icon: Icon,
  accent = "neutral",
  trend,
  hint,
  loading,
  dense = false,
  action,
  onClick,
  className,
}: StatCardProps) {
  const pad = dense ? "gap-2 p-4" : "gap-3 p-5";
  const iconSize = "size-4";

  if (loading) {
    return (
      // h-full down the chain: grid cells stretch, and sibling cards in one
      // strip must share the row height (content-sized cards read as ragged).
      <motion.div variants={listItem} className="h-full">
        <Card className={cn(pad, "h-full rounded-2xl shadow-none")}>
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-20" />
            {Icon ? <Skeleton className="size-4 rounded" /> : null}
          </div>
          <Skeleton className="h-7 w-24" />
        </Card>
      </motion.div>
    );
  }

  const isNumeric = typeof value === "number";
  const isNode = !isNumeric && typeof value !== "string";

  const valueNode = isNumeric ? (
    <StatValue value={value} formatType={formatType} label={label} sizes={dense ? SIZES_DENSE : SIZES} />
  ) : isNode ? (
    <div className="truncate font-mono text-2xl leading-none font-semibold tracking-tight tabular">{value as ReactNode}</div>
  ) : (
    <div className={cn("truncate font-mono leading-none font-semibold tracking-tight tabular", dense ? "text-lg" : "text-2xl")}>
      {value as string}
    </div>
  );

  const hasTrend = trend !== undefined && trend !== null;
  const up = (trend ?? 0) >= 0;

  return (
    <motion.div variants={listItem} className="h-full">
      <Card
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        className={cn(
          "h-full rounded-2xl shadow-none transition-colors duration-200 motion-reduce:transition-none",
          onClick &&
            "cursor-pointer hover:border-foreground/20 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          pad,
          className,
        )}
      >
        <div className="flex min-h-5 items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
            {Icon ? <Icon aria-hidden className={cn(iconSize, "shrink-0", accentClasses[accent])} /> : null}
            <span className="truncate">{label}</span>
          </p>
          {action ? <span className="flex shrink-0 items-center gap-1">{action}</span> : null}
        </div>
        {valueNode}
        {hasTrend || hint ? (
          <div className="flex items-center gap-2 text-xs">
            {hasTrend ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium tabular",
                  up
                    ? "bg-success/12 text-[color-mix(in_oklch,var(--color-success)_60%,var(--color-foreground))]"
                    : "bg-destructive/12 text-[color-mix(in_oklch,var(--color-destructive)_60%,var(--color-foreground))]",
                )}
              >
                {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {fmtPercent(Math.abs(trend!))}
              </span>
            ) : null}
            {hint ? <span className="truncate text-muted-foreground">{hint}</span> : null}
          </div>
        ) : null}
      </Card>
    </motion.div>
  );
}
