import type { ReactNode } from "react";

interface TooltipItem {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: TooltipItem[];
  label?: ReactNode;
  formatter?: (value: number, name?: string) => ReactNode;
  labelFormatter?: (label: unknown) => ReactNode;
}

/** Theme-aware tooltip for Recharts (pass as the chart's `content`). */
export function ChartTooltipContent({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      {label != null && label !== "" ? (
        <div className="mb-1.5 font-medium text-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      ) : null}
      <div className="space-y-1">
        {payload.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full" style={{ background: item.color }} />
            {item.name ? <span className="text-muted-foreground">{item.name}</span> : null}
            <span className="ms-auto font-medium tabular text-foreground">
              {formatter ? formatter(Number(item.value ?? 0), item.name) : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
