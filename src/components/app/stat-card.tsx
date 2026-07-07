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

const accentClasses: Record<StatAccent, string> = {
  neutral: "bg-secondary text-foreground",
  brand: "bg-brand/10 text-brand",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  destructive: "bg-destructive/10 text-destructive",
};

// Font-size ladders (px) the value fits itself into — largest that fits wins,
// shrinking before the figure is ever compacted.
const SIZES = [26, 24, 22, 20, 18, 16];
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
  const tileSize = dense ? "size-9" : "size-10";
  const iconSize = dense ? "size-4" : "size-5";

  if (loading) {
    return (
      // h-full down the chain: grid cells stretch, and sibling cards in one
      // strip must share the row height (content-sized cards read as ragged).
      <motion.div variants={listItem} className="h-full">
        <Card className={cn(pad, "h-full")}>
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-20" />
            {Icon ? <Skeleton className={cn(tileSize, "rounded-lg")} /> : null}
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
    <div className="truncate text-2xl font-semibold leading-none tracking-tight tabular">{value as ReactNode}</div>
  ) : (
    <div className={cn("truncate font-semibold leading-none tracking-tight tabular", dense ? "text-lg" : "text-2xl")}>
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
          "h-full transition-all duration-200 motion-reduce:transition-none",
          onClick &&
            "cursor-pointer hover:bg-accent/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
          pad,
          className,
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
          <span className="flex shrink-0 items-center gap-1">
            {action}
            {Icon ? (
              <span className={cn("grid shrink-0 place-items-center rounded-lg", tileSize, accentClasses[accent])}>
                <Icon className={iconSize} />
              </span>
            ) : null}
          </span>
        </div>
        {valueNode}
        {hasTrend || hint ? (
          <div className="flex items-center gap-2 text-xs">
            {hasTrend ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium tabular",
                  up ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
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
