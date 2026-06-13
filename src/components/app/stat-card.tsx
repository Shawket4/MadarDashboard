import type { ReactNode } from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtMoneyCompact, fmtNumber, fmtPercent } from "@/lib/format";
import { listItem } from "@/lib/motion";

type Accent = "brand" | "primary" | "success" | "warning" | "info" | "destructive";

const accentClasses: Record<Accent, string> = {
  brand: "bg-brand/10 text-brand",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  destructive: "bg-destructive/10 text-destructive",
};

interface StatCardProps {
  label: string;
  /** A number (formatted + compacted per `formatType`), a ready string, or a node (e.g. skeleton). */
  value: number | string | ReactNode;
  formatType?: "money" | "number" | "percent";
  icon?: LucideIcon;
  accent?: Accent;
  /** Signed ratio, e.g. 0.123 → +12.3%. */
  trend?: number | null;
  hint?: ReactNode;
  loading?: boolean;
  /** Override the tooltip shown on a compacted value. */
  tooltip?: ReactNode;
  /** Tighter padding + smaller value text — for crowded grids (e.g. 2×2 on mobile). */
  dense?: boolean;
  onClick?: () => void;
  className?: string;
}

function formatValue(value: number, formatType: StatCardProps["formatType"]) {
  if (formatType === "money") {
    const full = fmtMoney(value);
    if (value >= 1_000_000) {
      const compact = fmtMoneyCompact(value);
      return { full, compact, compacted: compact !== full };
    }
    return { full, compact: full, compacted: false };
  }
  if (formatType === "percent") {
    const full = fmtPercent(value);
    return { full, compact: full, compacted: false };
  }
  const full = fmtNumber(value);
  if (value >= 1_000_000) {
    return { full, compact: `${fmtNumber(value / 1_000_000, { maximumFractionDigits: 1 })}M`, compacted: true };
  }
  if (value >= 1_000) {
    return { full, compact: `${fmtNumber(value / 1_000, { maximumFractionDigits: 1 })}K`, compacted: true };
  }
  return { full, compact: full, compacted: false };
}

const sizeForLength = (len: number, dense: boolean) =>
  dense
    ? len > 14
      ? "text-sm"
      : len > 10
        ? "text-base"
        : "text-lg sm:text-xl"
    : len > 16
      ? "text-base sm:text-lg"
      : len > 12
        ? "text-lg sm:text-xl"
        : len > 9
          ? "text-xl sm:text-2xl"
          : "text-2xl";

export function StatCard({
  label,
  value,
  formatType,
  icon: Icon,
  accent = "brand",
  trend,
  hint,
  loading,
  tooltip,
  dense = false,
  onClick,
  className,
}: StatCardProps) {
  const isMobile = useIsMobile();
  const pad = dense ? "gap-2 p-4" : "gap-3 p-5";
  const tileSize = dense ? "size-9" : "size-10";
  const iconSize = dense ? "size-4" : "size-5";

  if (loading) {
    return (
      <motion.div variants={listItem}>
        <Card className={pad}>
          <div className="flex items-start justify-between gap-3">
            <div className="w-full space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
            {Icon ? <Skeleton className={cn(tileSize, "rounded-lg")} /> : null}
          </div>
        </Card>
      </motion.div>
    );
  }

  const isNumeric = typeof value === "number";
  const formatted = isNumeric ? formatValue(value, formatType) : null;
  const isNode = !isNumeric && typeof value !== "string";
  const display = formatted ? formatted.compact : typeof value === "string" ? value : "";

  const valueEl = isNode ? (
    <div className="text-2xl font-semibold tracking-tight tabular">{value as ReactNode}</div>
  ) : (
    <div className={cn("font-semibold tracking-tight tabular", sizeForLength(display.length, dense))}>{display}</div>
  );

  const showFull = !isNode && (formatted?.compacted || tooltip != null);
  const fullContent = tooltip ?? formatted?.full;
  // Radix Tooltip auto-dismisses on touch (flash), so use a tap-to-toggle Popover on mobile.
  const valueNode = !showFull ? (
    valueEl
  ) : isMobile ? (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-pointer text-start">
          {valueEl}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto px-3 py-1.5 text-sm font-semibold tabular">{fullContent}</PopoverContent>
    </Popover>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="cursor-help text-start">
          {valueEl}
        </button>
      </TooltipTrigger>
      <TooltipContent className="font-semibold tabular">{fullContent}</TooltipContent>
    </Tooltip>
  );

  const hasTrend = trend !== undefined && trend !== null;
  const up = (trend ?? 0) >= 0;

  return (
    <motion.div variants={listItem}>
      <Card
        onClick={onClick}
        className={cn(pad, onClick && "cursor-pointer transition-shadow hover:shadow-md", className)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="truncate text-xs text-muted-foreground sm:text-sm">{label}</p>
            {valueNode}
          </div>
          {Icon ? (
            <span className={cn("grid shrink-0 place-items-center rounded-lg", tileSize, accentClasses[accent])}>
              <Icon className={iconSize} />
            </span>
          ) : null}
        </div>
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
