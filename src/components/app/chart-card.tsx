import type { ReactNode } from "react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartEntrance } from "@/lib/motion";
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

/** A chart's card. It arrives by itself (ChartEntrance), or with the Stagger it sits in. */
export function ChartCard({ title, description, actions, children, className, contentClassName }: ChartCardProps) {
  return (
    <ChartEntrance asChild>
      <Card className={cn("gap-4 py-5 shadow-none", className)}>
        {/* Narrow (a phone, a half-width card): the actions go under the title
            at full width, where a segmented control can scroll, instead of
            squeezing the title into a word per line. */}
        {(title || description || actions) && (
          <CardHeader className="px-5 has-data-[slot=card-action]:grid-cols-1 @md/card-header:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
            {title ? <CardTitle className="text-base tracking-[-0.005em]">{title}</CardTitle> : null}
            {description ? <CardDescription>{description}</CardDescription> : null}
            {actions ? (
              <CardAction className="col-start-1 row-span-1 row-start-auto min-w-0 max-w-full justify-self-start @md/card-header:col-start-2 @md/card-header:row-span-2 @md/card-header:row-start-1 @md/card-header:justify-self-end">
                {actions}
              </CardAction>
            ) : null}
          </CardHeader>
        )}
        {/* SVG text anchors break under dir=rtl: plots stay LTR, surrounding copy stays RTL. */}
        <CardContent className={cn("px-3 sm:px-5 [&_.recharts-wrapper]:[direction:ltr]", contentClassName)}>{children}</CardContent>
      </Card>
    </ChartEntrance>
  );
}
