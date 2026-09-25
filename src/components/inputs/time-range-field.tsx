import * as React from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, MoonStar } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TimeField } from "./time-field";
import {
  APP_HOUR_CYCLE, endsNextDay, formatSpan, formatTime, minutesOf, spanMinutes, suggestEnd, type HourCycle,
} from "./time";
import { errorTextClass, warnTextClass } from "./shell";
import { useLang } from "./use-lang";

export interface TimeRange {
  start: string;
  end: string;
}

/** What is wrong with a range, if anything: a key the field words for you. */
export type RangeProblem = "missing_start" | "missing_end" | "same_time" | null;

/**
 * The one check a range needs. An end before the start is NOT a problem: the
 * shift runs past midnight. A range with both ends empty is fine when
 * `optional`.
 */
export function rangeProblem(r: TimeRange, optional = false): RangeProblem {
  if (!r.start && !r.end) return optional ? null : "missing_start";
  if (!r.start) return "missing_start";
  if (!r.end) return "missing_end";
  return spanMinutes(r.start, r.end) === 0 ? "same_time" : null;
}

export interface TimeRangeFieldProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  /** Base id; the two ends get `-start` and `-end`. */
  id?: string;
  disabled?: boolean;
  /** Both ends may be left empty (e.g. "use the shift's own times"). */
  optional?: boolean;
  /** A form error to show under the range. */
  error?: string;
  startLabel?: string;
  endLabel?: string;
  /** Hide the visible labels (the row has its own, e.g. a weekday). */
  hideLabels?: boolean;
  /** Summarise in one line under the fields (length, next day). Default on. */
  showSummary?: boolean;
  hourCycle?: HourCycle;
  /** Longer than this reads as a warning (never a refusal), e.g. the labour presence cap. */
  warnAboveMinutes?: number;
  className?: string;
  /** Names the pair for a screen reader when there are no visible labels. */
  "aria-label"?: string;
  onBlur?: () => void;
}

/**
 * Start and end of a shift or window, with its length always in view. An end
 * at or before the start is read the way the server reads it (the shift
 * ends the next day) and gets a "next day" badge instead of an error. The one
 * slip it can spot, "9 to 5" landing as a 20-hour night, gets a one-tap fix.
 */
export function TimeRangeField({
  value, onChange, id, disabled, optional, error, startLabel, endLabel, hideLabels, showSummary = true,
  hourCycle = APP_HOUR_CYCLE, warnAboveMinutes, className, "aria-label": ariaLabel, onBlur,
}: TimeRangeFieldProps) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const reactId = React.useId();
  const base = id ?? `range-${reactId}`;
  const summaryId = `${base}-summary`;

  const span = spanMinutes(value.start, value.end);
  const overnight = endsNextDay(value.start, value.end);
  const suggestion = suggestEnd(value.start, value.end);
  const same = span === 0;
  const long = span !== null && warnAboveMinutes !== undefined && span > warnAboveMinutes;

  // Each end-time pick says how long the shift would be: "8 h", "10 h · next day".
  const startMin = minutesOf(value.start);
  const describeEnd = React.useCallback((hhmm: string) => {
    if (startMin === null) return null;
    const s = spanMinutes(value.start, hhmm);
    if (!s) return null;
    const len = formatSpan(s, lang);
    return endsNextDay(value.start, hhmm) ? `${len} · ${t("inputs.nextDayShort", "next day")}` : len;
  }, [startMin, value.start, lang, t]);

  const label = (text: string | undefined, forId: string) =>
    hideLabels || !text ? null : (
      <label htmlFor={forId} className="text-sm font-medium leading-none">{text}</label>
    );

  const sLabel = startLabel ?? t("inputs.start", "Starts");
  const eLabel = endLabel ?? t("inputs.end", "Ends");

  return (
    <div role="group" aria-label={ariaLabel} className={cn("space-y-1.5", className)}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
        <div className="space-y-1.5">
          {label(sLabel, `${base}-start`)}
          <TimeField
            id={`${base}-start`}
            value={value.start}
            onChange={(start) => onChange({ ...value, start })}
            onBlur={onBlur}
            disabled={disabled}
            clearable={optional}
            invalid={!!error || same}
            aria-label={hideLabels ? `${ariaLabel ? `${ariaLabel}: ` : ""}${sLabel}` : undefined}
            aria-describedby={showSummary ? summaryId : undefined}
          />
        </div>
        <ArrowRight aria-hidden className="mb-2.5 size-4 text-muted-foreground rtl:rotate-180" />
        <div className="space-y-1.5">
          {label(eLabel, `${base}-end`)}
          <TimeField
            id={`${base}-end`}
            value={value.end}
            onChange={(end) => onChange({ ...value, end })}
            onBlur={onBlur}
            disabled={disabled}
            clearable={optional}
            invalid={!!error || same}
            describeOption={describeEnd}
            anchorMinutes={startMin !== null ? startMin + 8 * 60 : undefined}
            aria-label={hideLabels ? `${ariaLabel ? `${ariaLabel}: ` : ""}${eLabel}` : undefined}
            aria-describedby={showSummary ? summaryId : undefined}
          />
        </div>
      </div>

      {showSummary ? (
        <div id={summaryId} aria-live="polite" className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {same ? (
            error ? null : <span className={errorTextClass}>{t("inputs.sameTime", "It can't start and end at the same time.")}</span>
          ) : span ? (
            <>
              <span className="font-medium tabular-nums text-foreground">{formatSpan(span, lang)}</span>
              {overnight ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-info/12 px-2 py-0.5 font-medium text-[color-mix(in_oklab,var(--color-info)_55%,var(--color-foreground))]">
                  <MoonStar aria-hidden className="size-3" />
                  {t("inputs.endsNextDay", "Ends the next day")}
                </span>
              ) : null}
              {long ? (
                <span className={warnTextClass}>
                  {t("inputs.longerThan", { limit: formatSpan(warnAboveMinutes!, lang), defaultValue: `Longer than ${formatSpan(warnAboveMinutes!, lang)}` })}
                </span>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {suggestion && !disabled ? (
        <div role="status" className="flex flex-wrap items-center gap-2 rounded-md bg-warning/10 px-2.5 py-1.5">
          <span className={warnTextClass}>
            {t("inputs.longOvernight", {
              length: formatSpan(span ?? 0, lang),
              defaultValue: `That's ${formatSpan(span ?? 0, lang)}, overnight.`,
            })}
          </span>
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={() => onChange({ ...value, end: suggestion })}
          >
            {t("inputs.didYouMean", {
              time: formatTime(suggestion, { hourCycle, lang }),
              defaultValue: `End at ${formatTime(suggestion, { hourCycle, lang })} instead`,
            })}
          </Button>
        </div>
      ) : null}

      {error ? <p role="alert" className={errorTextClass}>{error}</p> : null}
    </div>
  );
}
