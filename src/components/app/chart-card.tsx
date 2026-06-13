import type { ReactNode } from "react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    <Card className={cn(className)}>
      {(title || description || actions) && (
        <CardHeader>
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
          {actions ? <CardAction>{actions}</CardAction> : null}
        </CardHeader>
      )}
      <CardContent className={cn("px-2 sm:px-4", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
