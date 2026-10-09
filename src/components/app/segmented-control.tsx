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
  disabled,
  "aria-label": ariaLabel,
}: {
  value: V;
  onChange: (value: V) => void;
  options: SegmentedOption<V>[];
  className?: string;
  disabled?: boolean;
  /** Names the group for a screen reader ("Status", "View"). */
  "aria-label"?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("flex w-fit max-w-full overflow-x-auto rounded-[10px] bg-secondary p-[3px] no-scrollbar", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={cn(
            "h-8 whitespace-nowrap rounded-[8px] px-3 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
