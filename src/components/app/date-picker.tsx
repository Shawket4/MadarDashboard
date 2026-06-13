import * as React from "react";
import { useTranslation } from "react-i18next";
import { TZDate } from "@date-fns/tz";
import { AlertTriangle, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { APP_TZ } from "@/data/config/constants";
import { cairoDateISO, cairoNow, cairoParts, fmtDate } from "@/lib/format";

type DayParts = { y: number; m: number; d: number };
const toNum = (p?: DayParts | null) => (p ? p.y * 10000 + p.m * 100 + p.d : null);

const cairoToday = (): DayParts => {
  const d = cairoNow();
  return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
};

interface Props {
  /** Selected day. Cairo ISO (day-start) by default, or `YYYY-MM-DD` when `dateOnly`. */
  value?: string | null;
  /** Emits the picked day — same format as `value` (see `dateOnly`). */
  onChange: (value: string) => void;
  /**
   * Use plain `YYYY-MM-DD` for value/onChange instead of a full Cairo ISO
   * string — a 1:1 drop-in for native `<input type="date">` call sites.
   */
  dateOnly?: boolean;
  placeholder?: string;
  align?: "start" | "center" | "end";
  triggerClassName?: string;
  /** Disable picking days after today. */
  disableFuture?: boolean;
  /** Disable picking days before today. */
  disablePast?: boolean;
  /** Allow past days but flag a past selection with a subtle yellow warning. */
  warnPast?: boolean;
  /** Override the past-date warning text. */
  warningText?: string;
  disabled?: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Single-date picker — a sibling of {@link DateRangePicker} sharing its
 * Cairo-aware calendar, but for one day. Clicking a day applies immediately;
 * a Today shortcut sits in the footer. One Radix layer (Popover).
 */
export function DatePicker({
  value, onChange, dateOnly = false, placeholder, align = "start", triggerClassName,
  disableFuture = false, disablePast = false, warnPast = false, warningText, disabled = false,
}: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("ar") ? "ar-EG" : "en-GB";
  const [open, setOpen] = React.useState(false);

  // Parse the incoming value into calendar parts, honoring `dateOnly`.
  const parts = React.useCallback((v?: string | null): DayParts | null => {
    if (!v) return null;
    if (dateOnly) {
      const [y, m, d] = v.split("-").map(Number);
      return y && m && d ? { y, m: m - 1, d } : null;
    }
    return cairoParts(v);
  }, [dateOnly]);

  // Display string for the trigger / footer.
  const display = (v?: string | null) =>
    dateOnly ? (() => { const p = parts(v); return p ? fmtDate(cairoDateISO(p.y, p.m, p.d)) : ""; })() : fmtDate(v);

  const today = cairoToday();
  const [month, setMonth] = React.useState(today.m);
  const [year, setYear] = React.useState(today.y);

  // Seed the visible month from the current value whenever opened.
  React.useEffect(() => {
    if (!open) return;
    const anchor = parts(value) ?? today;
    setMonth(anchor.m);
    setYear(anchor.y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const apply = (p: DayParts) => {
    onChange(dateOnly ? `${p.y}-${pad(p.m + 1)}-${pad(p.d)}` : cairoDateISO(p.y, p.m, p.d));
    setOpen(false);
  };

  const daysInMonth = new TZDate(year, month + 1, 0, APP_TZ).getDate();
  const firstDay = new TZDate(year, month, 1, APP_TZ).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedNum = toNum(parts(value));
  const todayNum = toNum(today)!;
  const pastSelected = warnPast && selectedNum !== null && selectedNum < todayNum;

  const prevMonth = () => (month === 0 ? (setMonth(11), setYear((y) => y - 1)) : setMonth((m) => m - 1));
  const nextMonth = () => (month === 11 ? (setMonth(0), setYear((y) => y + 1)) : setMonth((m) => m + 1));

  const monthName = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: APP_TZ }).format(
    new TZDate(year, month, 1, APP_TZ),
  );
  const weekdayNames = React.useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: APP_TZ });
    return Array.from({ length: 7 }, (_, i) => fmt.format(new TZDate(2024, 0, 7 + i, APP_TZ))); // Sun..Sat
  }, [locale]);

  return (
    <div className="w-full">
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className={cn("h-8 justify-start gap-2 font-normal", !value && "text-muted-foreground", pastSelected && "border-warning/60", triggerClassName)}>
          <CalendarIcon className={cn("size-4 text-muted-foreground", pastSelected && "text-warning")} />
          <span className="truncate">{value ? display(value) : (placeholder ?? t("datePicker.pickDate", "Pick a date"))}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-auto max-w-[min(20rem,calc(100vw-2rem))]">
        {/* Month nav */}
        <div className="mb-3 flex items-center justify-between">
          <Button variant="ghost" size="icon-sm" onClick={prevMonth} aria-label={t("common.previous", "Previous")}>
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </Button>
          <span className="text-sm font-semibold">{monthName}</span>
          <Button variant="ghost" size="icon-sm" onClick={nextMonth} aria-label={t("common.next", "Next")}>
            <ChevronRight className="size-4 rtl:rotate-180" />
          </Button>
        </div>

        {/* Weekday header */}
        <div className="mb-1 grid grid-cols-7">
          {weekdayNames.map((d) => (
            <div key={d} className="py-1 text-center text-xs font-semibold text-muted-foreground">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const dn = year * 10000 + month * 100 + d;
            const isFuture = dn > todayNum;
            const isPast = dn < todayNum;
            const isDisabled = (disableFuture && isFuture) || (disablePast && isPast);
            const isToday = dn === todayNum;
            const isSelected = selectedNum !== null && dn === selectedNum;

            return (
              <div key={i} className="flex h-8 items-center justify-center">
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && apply({ y: year, m: month, d })}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-xs font-medium",
                    isDisabled && "cursor-not-allowed text-muted-foreground/30",
                    !isDisabled && !isSelected && "hover:bg-muted",
                    isToday && !isSelected && "border border-primary text-primary",
                    isSelected && "bg-primary font-semibold text-primary-foreground shadow-sm",
                  )}
                >
                  {d}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => apply(today)}>
            {t("datePicker.today", "Today")}
          </Button>
          {value ? (
            <p className="text-xs font-medium">{display(value)}</p>
          ) : (
            <p className="text-xs text-muted-foreground">{t("datePicker.clickDay", "Click a day")}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
    {pastSelected ? (
      <p className="mt-1 flex items-center gap-1 text-xs text-warning">
        <AlertTriangle className="size-3 shrink-0" /> {warningText ?? t("datePicker.pastWarning", "This date is in the past")}
      </p>
    ) : null}
    </div>
  );
}
