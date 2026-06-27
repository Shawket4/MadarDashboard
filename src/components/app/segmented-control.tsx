import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<V extends string> {
  value: V;
  label: ReactNode;
}

/** Pill-style view switcher (grid/classic, hourly/daily/monthly, …). */
export function SegmentedControl<V extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: V;
  onChange: (value: V) => void;
  options: SegmentedOption<V>[];
  className?: string;
}) {
  return (
    <div role="radiogroup" className={cn("flex w-fit rounded-lg border bg-muted p-0.5", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "whitespace-nowrap rounded px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            value === opt.value ? "bg-background font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
