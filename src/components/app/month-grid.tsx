import * as React from "react";
import { useTranslation } from "react-i18next";
import { TZDate } from "@date-fns/tz";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { daysIntoWeek, WEEK_ORDER } from "@/lib/week";

/**
 * The month-calendar plumbing the single-day and range pickers share: the
 * visible month, its day cells (leading blanks to the week start), the
 * localized month title and weekday names, and prev/next navigation.
 */
export function useMonthView(tz: string, locale: string, initial: { y: number; m: number }) {
  const [month, setMonth] = React.useState(initial.m);
  const [year, setYear] = React.useState(initial.y);

  const daysInMonth = new TZDate(year, month + 1, 0, tz).getDate();
  const firstDay = new TZDate(year, month, 1, tz).getDay();
  const cells: (number | null)[] = [
    ...Array(daysIntoWeek(firstDay)).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => (month === 0 ? (setMonth(11), setYear((y) => y - 1)) : setMonth((m) => m - 1));
  const nextMonth = () => (month === 11 ? (setMonth(0), setYear((y) => y + 1)) : setMonth((m) => m + 1));

  const monthName = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: tz }).format(
    new TZDate(year, month, 1, tz),
  );
  const weekdayNames = React.useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: tz });
    // 7 Jan 2024 is a Sunday (getDay 0); the columns start on WEEK_START.
    return WEEK_ORDER.map((day) => fmt.format(new TZDate(2024, 0, 7 + day, tz)));
  }, [locale, tz]);

  /** Jump the visible month (e.g. to the selection when the popover opens). */
  const show = (anchor: { y: number; m: number }) => {
    setMonth(anchor.m);
    setYear(anchor.y);
  };

  return { month, year, cells, monthName, weekdayNames, prevMonth, nextMonth, show };
}

export function MonthNav({ title, onPrev, onNext }: { title: string; onPrev: () => void; onNext: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="mb-3 flex items-center justify-between">
      <Button variant="ghost" size="icon-sm" onClick={onPrev} aria-label={t("common.previous", "Previous")}>
        <ChevronLeft className="size-4 rtl:rotate-180" />
      </Button>
      <span className="text-sm font-semibold">{title}</span>
      <Button variant="ghost" size="icon-sm" onClick={onNext} aria-label={t("common.next", "Next")}>
        <ChevronRight className="size-4 rtl:rotate-180" />
      </Button>
    </div>
  );
}

export function WeekdayHeader({ names }: { names: string[] }) {
  return (
    <div className="mb-1 grid grid-cols-7">
      {names.map((d) => (
        <div key={d} className="py-1 text-center text-xs font-semibold text-muted-foreground">
          {d}
        </div>
      ))}
    </div>
  );
}
