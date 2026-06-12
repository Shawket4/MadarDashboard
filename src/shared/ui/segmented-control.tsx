import { cn } from "@/shared/lib/cn";

export interface SegmentedOption<V extends string> {
  value: V;
  label: React.ReactNode;
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
    <div className={cn("flex rounded-lg border p-0.5 bg-muted w-fit", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1 text-xs rounded whitespace-nowrap transition-colors",
            value === opt.value
              ? "bg-background shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
