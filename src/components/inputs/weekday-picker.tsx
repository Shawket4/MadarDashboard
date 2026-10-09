import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { WEEK_ORDER } from "@/lib/week";
import { useLang } from "./use-lang";

/** A weekday's name in the app language; `dow` is 0 = Sunday … 6 = Saturday. */
export function weekdayName(dow: number, lang: "en" | "ar", width: "short" | "long" = "short"): string {
  // 7 Jan 2024 was a Sunday.
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", { weekday: width, timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, 0, 7 + dow)),
  );
}

/**
 * Summarise a set of weekdays in week order: "Every day", "Sat – Wed",
 * "Sat, Mon, Thu". Runs of three or more become a range.
 */
export function summarizeDays(days: number[], lang: "en" | "ar", everyDay: string, none: string): string {
  const set = new Set(days);
  if (set.size === 7) return everyDay;
  if (set.size === 0) return none;
  const ordered = WEEK_ORDER.filter((d) => set.has(d));
  const runs: number[][] = [];
  for (const d of ordered) {
    const last = runs[runs.length - 1];
    const prev = last?.[last.length - 1];
    if (last && WEEK_ORDER.indexOf(d) === WEEK_ORDER.indexOf(prev!) + 1) last.push(d);
    else runs.push([d]);
  }
  const sep = lang === "ar" ? "، " : ", ";
  return runs
    .map((r) => (r.length >= 3 ? `${weekdayName(r[0], lang)} – ${weekdayName(r[r.length - 1], lang)}` : r.map((d) => weekdayName(d, lang)).join(sep)))
    .join(sep);
}

export interface WeekdayPickerProps {
  /** Postgres DOW numbers: 0 = Sunday … 6 = Saturday. */
  value: number[];
  onChange: (days: number[]) => void;
  disabled?: boolean;
  invalid?: boolean;
  /** Show the "Every day" / "Clear" shortcuts. */
  shortcuts?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

/**
 * Days of the week as toggle chips, in the business's week order (Saturday
 * first). Tab lands on the group once; the arrow keys walk the days in reading
 * order (so they flip in Arabic) and Space toggles.
 */
export function WeekdayPicker({
  value, onChange, disabled, invalid, shortcuts = true, id, className,
  "aria-label": ariaLabel, "aria-describedby": describedBy,
}: WeekdayPickerProps) {
  const { t } = useTranslation();
  const { lang, dir } = useLang();
  const [focusIdx, setFocusIdx] = React.useState(0);
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const set = new Set(value);

  const toggle = (dow: number) =>
    onChange(set.has(dow) ? value.filter((d) => d !== dow) : [...value, dow].sort((a, b) => a - b));

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const fwd = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
    const back = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
    let next = i;
    if (e.key === fwd) next = (i + 1) % 7;
    else if (e.key === back) next = (i + 6) % 7;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 6;
    else return;
    e.preventDefault();
    setFocusIdx(next);
    refs.current[next]?.focus();
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}>
      <div
        id={id}
        role="group"
        aria-label={ariaLabel ?? t("inputs.weekdays", "Days of the week")}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        className={cn("flex flex-wrap gap-1.5 rounded-lg", invalid && "ring-2 ring-destructive/30 ring-offset-2 ring-offset-background")}
      >
        {WEEK_ORDER.map((dow, i) => {
          const on = set.has(dow);
          return (
            <button
              key={dow}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              aria-pressed={on}
              aria-label={weekdayName(dow, lang, "long")}
              tabIndex={i === focusIdx ? 0 : -1}
              disabled={disabled}
              onFocus={() => setFocusIdx(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              onClick={() => toggle(dow)}
              className={cn(
                "h-9 min-w-11 rounded-md border px-2.5 text-sm font-medium transition-colors motion-reduce:transition-none",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                on ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {weekdayName(dow, lang)}
            </button>
          );
        })}
      </div>
      {shortcuts && !disabled ? (
        <div className="flex gap-1 text-xs">
          <button type="button" className="rounded px-1.5 py-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-40"
            disabled={value.length === 7} onClick={() => onChange([0, 1, 2, 3, 4, 5, 6])}>
            {t("inputs.everyDay", "Every day")}
          </button>
          <button type="button" className="rounded px-1.5 py-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-40"
            disabled={value.length === 0} onClick={() => onChange([])}>
            {t("inputs.clearDays", "Clear")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
