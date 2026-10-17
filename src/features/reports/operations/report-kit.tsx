// The Operations report's building blocks, taken from its Overview tab so every
// tab is laid out, loads, fails and empties the same way:
//
//   <ReportStack>                         one rhythm between sections (space-y-4)
//     <LedgerStrip items={kpis} />        KPIs (components/app/ledger-strip)
//     <ChartGrid> <ChartCard>…           charts, two up on desktop, arriving in turn
//       <ChartBody state={…}> chart       skeleton → error → empty → the chart
//     <TableCard title … />               a titled card holding a DataTable
//
// Recharts stays in each tab (a chart's ResponsiveContainer must sit inside its
// ChartCard in the same file: scripts/motion-check.mjs).
import { Children, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CartesianGrid } from "recharts";

import { ChartCard } from "@/components/app/chart-card";
import { DataTable, type DataTableProps } from "@/components/app/data-table";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Horizontal guide lines only: every vertical-bar and area chart in the report. */
export const CHART_GRID = <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />;
/** Vertical guide lines only: the horizontal (ranked-by-name) bar charts. */
export const CHART_GRID_VERTICAL = <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />;
/** The widest a bar gets, so a chart with three categories doesn't paint slabs. */
export const MAX_BAR_SIZE = 56;

/** The vertical rhythm of a tab: KPIs, chart grid and full-width cards, 16px apart. */
export function ReportStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

/**
 * Cards two up from `lg`, one column below, arriving one after another. Each
 * card gets its own cell, so a ChartCard inside holds still for the Stagger.
 */
export function ChartGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Stagger className={cn("grid gap-4 lg:grid-cols-2", className)}>
      {Children.toArray(children).map((child, i) => (
        <div key={i}>{child}</div>
      ))}
    </Stagger>
  );
}

/** The plot area: one height for every chart in the report. */
export function ChartFrame({ children }: { children: ReactNode }) {
  return <div className="h-72 w-full">{children}</div>;
}

export function ChartSkeleton() {
  return <Skeleton className="h-72 w-full" />;
}

/** A failed load inside a card: never rendered as empty. */
export function ChartError({ onRetry, className }: { onRetry: () => void; className?: string }) {
  return <ErrorState className={cn("border-0 bg-transparent", className)} onRetry={onRetry} />;
}

/** Nothing in the period, inside a card. */
export function ChartEmpty({ className, title }: { className?: string; title?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <EmptyState
      className={cn("border-0 bg-transparent", className)}
      title={title ?? t("analytics.noData", "No data for this period")}
    />
  );
}

export interface ChartState {
  loading: boolean;
  error: boolean;
  empty: boolean;
  onRetry: () => void;
}

/**
 * A card's body through its states, in the order the Overview checks them:
 * loading, failed, empty, then the content. `chart` states fill the plot
 * height so a card keeps its size from skeleton to figure; `auto` ones (a list
 * card) take their own height, with `skeleton` in place of the plot's.
 */
export function ChartBody({
  state,
  emptyTitle,
  size = "chart",
  skeleton,
  children,
}: {
  state: ChartState;
  emptyTitle?: ReactNode;
  size?: "chart" | "auto";
  skeleton?: ReactNode;
  children: ReactNode;
}) {
  const fill = size === "chart" ? "h-72" : undefined;
  if (state.loading) return <>{skeleton ?? <ChartSkeleton />}</>;
  if (state.error) return <ChartError className={fill} onRetry={state.onRetry} />;
  if (state.empty) return <ChartEmpty className={fill} title={emptyTitle} />;
  return <>{children}</>;
}

/**
 * A titled card holding a table: the full-width section of a tab. The table
 * runs edge to edge on desktop (its cells carry the gutter); on a phone its
 * rows become cards, inset like the rest of the card's content. A failed load
 * reads like a failed chart, and `footnote` lines up with the title.
 */
export function TableCard<TData, TValue>({
  title,
  description,
  actions,
  footnote,
  error,
  onRetry,
  emptyTitle,
  className,
  ...table
}: Omit<DataTableProps<TData, TValue>, "framed" | "emptyState" | "error" | "onRetry"> & {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footnote?: ReactNode;
  error?: boolean;
  onRetry: () => void;
  emptyTitle?: ReactNode;
}) {
  return (
    <ChartCard title={title} description={description} actions={actions} className={className} contentClassName="px-3 sm:px-0">
      {error && !table.loading ? (
        <ChartError onRetry={onRetry} />
      ) : (
        <DataTable
          framed={false}
          hideViewOptions
          toolbarClassName="sm:px-5"
          emptyState={<ChartEmpty title={emptyTitle} />}
          {...table}
        />
      )}
      {footnote ? <p className="pt-3 text-xs text-muted-foreground sm:px-5">{footnote}</p> : null}
    </ChartCard>
  );
}
