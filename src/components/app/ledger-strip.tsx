import type { ComponentType, ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export type LedgerAccent = "brand" | "primary" | "info" | "success" | "warning" | "destructive";

export interface LedgerItem {
  key: string;
  label: ReactNode;
  value: ReactNode;
  /** Concise variant shown on narrow/mobile cells (e.g. "EGP 166K", "2.2K"). */
  compactValue?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  accent?: LedgerAccent;
  /** Small muted line under the value (e.g. a secondary figure). */
  sub?: ReactNode;
  loading?: boolean;
}

const accentText: Record<LedgerAccent, string> = {
  brand: "text-brand",
  primary: "text-primary",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

// Literal classes so Tailwind's JIT keeps them.
const lgCols: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

/**
 * The "ledger line" — one ruled panel of KPIs (not separate floating cards).
 * Cells are divided by hairline rules via a `gap-px` track over `bg-border`,
 * which is direction-agnostic (RTL-safe). Shared by the dashboard and Orders.
 */
/**
 * A KPI value that shows its concise form on narrow/mobile and reveals the full
 * value in a floating popover on press. On wider screens the full value renders
 * directly. Shared by the ledger cells and the delivery channel cards.
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

export function LedgerStrip({
  items,
  className,
  compact,
}: {
  items: LedgerItem[];
  className?: string;
  /** Force compact values in every cell. Defaults to true when there are 5+ items. */
  compact?: boolean;
}) {
  const cols = lgCols[items.length] ?? "lg:grid-cols-4";
  const forceCompact = compact ?? items.length >= 5;
  return (
    <Card className={cn("overflow-hidden p-0", className)}>
      <div className={cn("grid grid-cols-2 gap-px bg-border", cols)}>
        {items.map((item) => (
          <div key={item.key} className="bg-card p-4 sm:p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              {item.icon ? <item.icon className={cn("size-4", item.accent && accentText[item.accent])} /> : null}
              <span className="truncate">{item.label}</span>
            </div>
            <div className="mt-2 truncate text-2xl font-semibold tabular sm:text-[1.75rem]">
              {item.loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <ConciseValue full={item.value} compact={item.compactValue} forceCompact={forceCompact} />
              )}
            </div>
            {item.sub != null ? (
              <div className="mt-0.5 truncate text-xs text-muted-foreground tabular">{item.loading ? null : item.sub}</div>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
