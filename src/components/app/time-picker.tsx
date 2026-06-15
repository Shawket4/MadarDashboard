import * as React from "react";
import { useTranslation } from "react-i18next";
import { Clock, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  /** Selected time as `HH:MM:SS` (matching the backend `NaiveTime`), or `null` when unset. */
  value: string | null;
  /** Emits the picked time as `HH:MM:SS`, or `null` when cleared. */
  onChange: (value: string | null) => void;
  placeholder?: string;
  align?: "start" | "center" | "end";
  triggerClassName?: string;
  disabled?: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

/** Parse `HH:MM[:SS]` into hour/minute parts (ignores seconds); `null` when empty/invalid. */
function parse(v: string | null): { h: number; m: number } | null {
  if (!v) return null;
  const [hs, ms] = v.split(":");
  const h = Number(hs);
  const m = Number(ms);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

/**
 * Time picker — a sibling of {@link DatePicker} sharing its Cairo-style
 * Popover trigger and panel chrome, but for a wall-clock time. Two scroll
 * lists (hours / minutes) apply immediately; a Clear shortcut sits in the
 * footer. Value is `HH:MM:SS` (NaiveTime) or `null`. One Radix layer (Popover).
 */
export function TimePicker({
  value, onChange, placeholder, align = "start", triggerClassName, disabled = false,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const parts = parse(value);
  const display = parts ? `${pad(parts.h)}:${pad(parts.m)}` : "";

  // Refs for the two scroll columns so the selected row auto-centers on open.
  const hourRef = React.useRef<HTMLDivElement>(null);
  const minuteRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    // Defer so the popover content has laid out before we scroll.
    const id = requestAnimationFrame(() => {
      hourRef.current?.querySelector<HTMLElement>('[data-selected="true"]')?.scrollIntoView({ block: "center" });
      minuteRef.current?.querySelector<HTMLElement>('[data-selected="true"]')?.scrollIntoView({ block: "center" });
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  const apply = (h: number, m: number) => onChange(`${pad(h)}:${pad(m)}:00`);
  const pickHour = (h: number) => apply(h, parts?.m ?? 0);
  const pickMinute = (m: number) => apply(parts?.h ?? 0, m);
  const clear = () => { onChange(null); setOpen(false); };

  const col = (
    ref: React.RefObject<HTMLDivElement | null>,
    items: number[],
    selected: number | null,
    onPick: (n: number) => void,
    label: string,
  ) => (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="pb-1 text-center text-xs font-semibold text-muted-foreground">{label}</div>
      <div ref={ref} className="h-44 overflow-y-auto rounded-md border">
        <div className="grid gap-y-0.5 p-1">
          {items.map((n) => {
            const isSelected = selected === n;
            return (
              <button
                key={n}
                type="button"
                data-selected={isSelected}
                onClick={() => onPick(n)}
                className={cn(
                  "flex h-8 items-center justify-center rounded-md text-xs font-medium tabular-nums",
                  !isSelected && "hover:bg-muted",
                  isSelected && "bg-primary font-semibold text-primary-foreground shadow-sm",
                )}
              >
                {pad(n)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className={cn("h-8 w-full justify-start gap-2 font-normal", !value && "text-muted-foreground", triggerClassName)}
          >
            <Clock className="size-4 text-muted-foreground" />
            <span className="truncate">{display || (placeholder ?? t("timePicker.pickTime", "Pick a time"))}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align={align} className="w-auto max-w-[min(20rem,calc(100vw-2rem))]">
          <div className="flex gap-3">
            {col(hourRef, HOURS, parts?.h ?? null, pickHour, t("timePicker.hour", "Hour"))}
            <div className="self-center pt-4 text-sm font-semibold text-muted-foreground">:</div>
            {col(minuteRef, MINUTES, parts?.m ?? null, pickMinute, t("timePicker.minute", "Minute"))}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={clear} disabled={!value}>
              <X className="size-3" /> {t("timePicker.clear", "Clear")}
            </Button>
            {display ? (
              <p className="text-xs font-medium tabular-nums">{display}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{t("timePicker.pickHourMinute", "Pick hour and minute")}</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
