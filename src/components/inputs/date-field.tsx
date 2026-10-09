import * as React from "react";
import { useTranslation } from "react-i18next";
import { TZDate } from "@date-fns/tz";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/app/date-picker";
import { getActiveTz } from "@/lib/format";
import { weekStartOf } from "@/lib/week";
import { errorTextClass } from "./shell";

export interface DateFieldProps {
  /** `YYYY-MM-DD`, or `""` for none. */
  value: string | null | undefined;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  disableFuture?: boolean;
  disablePast?: boolean;
  /** Allow a past day but say so. */
  warnPast?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

/**
 * A calendar day (`YYYY-MM-DD`), picked on the app's calendar: the week
 * starts on Saturday, the months and weekdays read in the app language, and
 * "today" is the business's today, not the laptop's. Replaces a native
 * `<input type="date">` one-for-one.
 */
export function DateField({ value, onChange, className, ...rest }: DateFieldProps) {
  return (
    <DatePicker
      {...rest}
      dateOnly
      value={value || null}
      onChange={onChange}
      triggerClassName={cn("h-9 w-full text-sm aria-invalid:border-destructive", className)}
    />
  );
}

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: TZDate) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export type QuickRange = "this_period" | "last_period" | "this_month" | "last_month" | "this_week" | "last_week";

/**
 * The days a quick range covers, as `YYYY-MM-DD`. A pay period starts on
 * `periodStartDay` (1–28): with 26, "this period" on 10 March is 26 Feb – 25 Mar.
 */
export function quickRange(
  kind: QuickRange,
  opts: { periodStartDay?: number; now?: number; tz?: string } = {},
): { from: string; to: string } {
  const tz = opts.tz ?? getActiveTz();
  const now = new TZDate(opts.now ?? Date.now(), tz);
  const y = now.getFullYear();
  const m = now.getMonth();
  const at = (yy: number, mm: number, dd: number) => new TZDate(yy, mm, dd, tz);
  switch (kind) {
    case "this_month":
      return { from: ymd(at(y, m, 1)), to: ymd(at(y, m + 1, 0)) };
    case "last_month":
      return { from: ymd(at(y, m - 1, 1)), to: ymd(at(y, m, 0)) };
    case "this_week":
    case "last_week": {
      const s = weekStartOf(+now, tz);
      const off = kind === "this_week" ? 0 : -7;
      return { from: ymd(at(s.y, s.m, s.d + off)), to: ymd(at(s.y, s.m, s.d + off + 6)) };
    }
    case "this_period":
    case "last_period": {
      const start = Math.min(28, Math.max(1, opts.periodStartDay ?? 1));
      // The month the current period started in.
      let sm = now.getDate() >= start ? m : m - 1;
      if (kind === "last_period") sm -= 1;
      return { from: ymd(at(y, sm, start)), to: ymd(at(y, sm + 1, start - 1)) };
    }
  }
}

export interface DateRange {
  from: string;
  to: string;
}

export interface DateRangeFieldProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  id?: string;
  /** Which quick ranges to offer, in order. */
  quick?: QuickRange[];
  /** For the pay-period quick ranges (the business's `period_start_day`). */
  periodStartDay?: number;
  disableFuture?: boolean;
  disabled?: boolean;
  error?: string;
  fromLabel?: string;
  toLabel?: string;
  className?: string;
}

/**
 * From–to days with one-tap ranges (this pay period, last month, …). An end
 * before the start is said out loud; the fields keep what was picked.
 */
export function DateRangeField({
  value, onChange, id, quick = ["this_period", "last_period", "this_month", "last_month"], periodStartDay,
  disableFuture, disabled, error, fromLabel, toLabel, className,
}: DateRangeFieldProps) {
  const { t } = useTranslation();
  const reactId = React.useId();
  const base = id ?? `dr-${reactId}`;
  const backwards = !!value.from && !!value.to && value.to < value.from;
  const names: Record<QuickRange, string> = {
    this_period: t("inputs.thisPeriod", "This pay period"),
    last_period: t("inputs.lastPeriod", "Last pay period"),
    this_month: t("inputs.thisMonth", "This month"),
    last_month: t("inputs.lastMonth", "Last month"),
    this_week: t("inputs.thisWeek", "This week"),
    last_week: t("inputs.lastWeek", "Last week"),
  };
  const ranges = quick.map((k) => ({ k, r: quickRange(k, { periodStartDay }) }));
  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
        <div className="space-y-1.5">
          <label htmlFor={`${base}-from`} className="text-sm font-medium leading-none">{fromLabel ?? t("inputs.from", "From")}</label>
          <DateField id={`${base}-from`} value={value.from} disabled={disabled} disableFuture={disableFuture}
            invalid={backwards || !!error} onChange={(from) => onChange({ ...value, from })} />
        </div>
        <ArrowRight aria-hidden className="mb-2.5 size-4 text-muted-foreground rtl:rotate-180" />
        <div className="space-y-1.5">
          <label htmlFor={`${base}-to`} className="text-sm font-medium leading-none">{toLabel ?? t("inputs.to", "To")}</label>
          <DateField id={`${base}-to`} value={value.to} disabled={disabled} disableFuture={disableFuture}
            invalid={backwards || !!error} onChange={(to) => onChange({ ...value, to })} />
        </div>
      </div>
      {quick.length ? (
        <div role="group" aria-label={t("inputs.quickRanges", "Quick ranges")} className="flex flex-wrap gap-1">
          {ranges.map(({ k, r }) => {
            const on = r.from === value.from && r.to === value.to;
            return (
              <button key={k} type="button" disabled={disabled} aria-pressed={on} onClick={() => onChange(r)}
                className={cn(
                  "h-7 rounded-full border px-2.5 text-xs transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50",
                  on ? "border-primary bg-primary/8 font-medium text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}>
                {names[k]}
              </button>
            );
          })}
        </div>
      ) : null}
      {backwards ? (
        <p role="alert" className={errorTextClass}>{t("inputs.endsBeforeStart", "The end is before the start.")}</p>
      ) : error ? (
        <p role="alert" className={errorTextClass}>{error}</p>
      ) : null}
    </div>
  );
}
