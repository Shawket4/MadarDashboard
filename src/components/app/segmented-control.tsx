import { useEffect, useRef, type ReactNode } from "react";

import { useIndicator } from "@/lib/motion";
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
  const listRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  useIndicator(listRef, pillRef, '[aria-checked="true"]');
  // useIndicator scales a 100px pill to the active segment: counter its corner
  // radius so it stays round, and once the pill is placed it takes the fill
  // over from the active button (which carries it until then, so the label
  // never sits light-on-light).
  useEffect(() => {
    const list = listRef.current;
    const pill = pillRef.current;
    if (!list || !pill) return;
    const fit = () => {
      const active = list.querySelector<HTMLElement>('[aria-checked="true"]');
      if (active?.offsetWidth) pill.style.borderRadius = `${800 / active.offsetWidth}px / 8px`;
    };
    fit();
    list.dataset.pill = "";
    const ro = new ResizeObserver(fit);
    ro.observe(list);
    return () => ro.disconnect();
  }, [value]);

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("flex w-fit max-w-full overflow-x-auto rounded-[10px] bg-secondary p-[3px] no-scrollbar", className)}>
      <div ref={listRef} className={cn("group/seg relative flex", disabled && "opacity-60")}>
        {/* The active pill, gliding between segments under the labels (useIndicator). */}
        <span
          ref={pillRef}
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-[100px] origin-left rounded-[8px] bg-primary opacity-0"
        />
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative h-8 whitespace-nowrap rounded-[8px] px-3 text-sm font-medium transition-colors duration-base motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed",
              value === opt.value
                ? "bg-primary text-primary-foreground group-data-[pill]/seg:bg-transparent"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
