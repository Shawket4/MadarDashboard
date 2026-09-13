import type { ReactNode } from "react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Axis ticks: quiet, small, tabular — shared by every Recharts axis. */
export const CHART_AXIS_TICK = { fontSize: 11, fill: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" } as const;

/** Categorical palette wired to the themed chart tokens — updates with light/dark. */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
] as const;

export const chartColor = (i: number): string => CHART_COLORS[i % CHART_COLORS.length];

interface ChartCardProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ChartCard({ title, description, actions, children, className, contentClassName }: ChartCardProps) {
  return (
    <Card className={cn("gap-4 py-5 shadow-none", className)}>
      {(title || description || actions) && (
        <CardHeader className="px-5">
          {title ? <CardTitle className="text-base tracking-[-0.005em]">{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
          {actions ? <CardAction>{actions}</CardAction> : null}
        </CardHeader>
      )}
      {/* SVG text anchors break under dir=rtl: plots stay LTR, surrounding copy stays RTL. */}
      <CardContent className={cn("px-3 sm:px-5 [&_.recharts-wrapper]:[direction:ltr]", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
