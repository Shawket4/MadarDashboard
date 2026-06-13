import * as React from "react";
import { useTranslation } from "react-i18next";
import { TZDate } from "@date-fns/tz";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

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

export interface PeriodPreset {
  value: string;
  label: string;
}

interface Props {
  /** Active preset key, or "custom" when a hand-picked range is in effect. */
  preset: string;
  from?: string | null;
  to?: string | null;
  /** Quick presets shown as pills at the top of the popover. */
  presets: PeriodPreset[];
  /** Apply a named preset (parent computes the range). */
  onSelectPreset: (key: string) => void;
  /** Apply a hand-picked range — day-bounded Cairo ISO strings. */
  onApplyCustom: (from: string, to: string) => void;
  align?: "start" | "center" | "end";
  triggerClassName?: string;
}

/**
 * Single-popover period picker: quick preset pills + a polished Cairo-aware
 * range calendar (two-tap with live hover preview, future-date guard, explicit
 * Apply). One Radix layer — no Select→Popover handoff — so selecting "custom"
 * never bounces the popover closed.
 */
export function DateRangePicker({ preset, from, to, presets, onSelectPreset, onApplyCustom, align = "end", triggerClassName }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("ar") ? "ar-EG" : "en-GB";
  const [open, setOpen] = React.useState(false);

  const [hovered, setHovered] = React.useState<DayParts | undefined>();
  const [selected, setSelected] = React.useState<{ from?: DayParts; to?: DayParts }>({});

  const today = cairoToday();
  const [month, setMonth] = React.useState(today.m);
  const [year, setYear] = React.useState(today.y);

  // Seed the working selection + visible month from props whenever opened.
  React.useEffect(() => {
    if (!open) return;
    const f = from ? cairoParts(from) : undefined;
    const tp = to ? cairoParts(to) : undefined;
    setSelected({ from: f, to: tp });
    setHovered(undefined);
    const anchor = f ?? today;
    setMonth(anchor.m);
    setYear(anchor.y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pickPreset = (key: string) => {
    onSelectPreset(key);
    setOpen(false);
  };

  const handleSelect = (p: DayParts) => {
    if (!selected.from || (selected.from && selected.to)) {
      setSelected({ from: p, to: undefined });
    } else {
      const f = toNum(selected.from)!;
      const c = toNum(p)!;
      if (c >= f) setSelected({ from: selected.from, to: p });
      else setSelected({ from: p, to: selected.from });
    }
  };

  const handleApply = () => {
    if (!selected.from) return;
    const f = selected.from;
    const tEnd = selected.to ?? selected.from;
    onApplyCustom(cairoDateISO(f.y, f.m, f.d), cairoDateISO(tEnd.y, tEnd.m, tEnd.d, true));
    setOpen(false);
  };

  const daysInMonth = new TZDate(year, month + 1, 0, APP_TZ).getDate();
  const firstDay = new TZDate(year, month, 1, APP_TZ).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const fromNum = toNum(selected.from);
  const toNum_ = toNum(selected.to ?? hovered);
  const todayNum = today.y * 10000 + today.m * 100 + today.d;

  const prevMonth = () => (month === 0 ? (setMonth(11), setYear((y) => y - 1)) : setMonth((m) => m - 1));
  const nextMonth = () => (month === 11 ? (setMonth(0), setYear((y) => y + 1)) : setMonth((m) => m + 1));

  const monthName = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: APP_TZ }).format(
    new TZDate(year, month, 1, APP_TZ),
  );
  const weekdayNames = React.useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: APP_TZ });
    return Array.from({ length: 7 }, (_, i) => fmt.format(new TZDate(2024, 0, 7 + i, APP_TZ))); // Sun..Sat
  }, [locale]);

  const activeLabel =
    preset !== "custom"
      ? (presets.find((p) => p.value === preset)?.label ?? t("datePicker.custom", "Custom"))
      : from && to
        ? `${fmtDate(from)} → ${fmtDate(to)}`
        : t("datePicker.custom", "Custom");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-8 gap-2", triggerClassName)}>
          <CalendarIcon className="size-4 text-muted-foreground" />
          <span className="truncate">{activeLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-auto max-w-[min(20rem,calc(100vw-2rem))]">
        {/* Quick presets */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <Button
              key={p.value}
              variant={preset === p.value ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => pickPreset(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="mb-3 border-t" />

        {/* From / To summary */}
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-muted p-2.5 text-xs">
          <div className="flex-1 text-center">
            <p className="mb-0.5 text-muted-foreground">{t("common.from", "From")}</p>
            <p className="font-semibold">
              {selected.from ? fmtDate(cairoDateISO(selected.from.y, selected.from.m, selected.from.d)) : "—"}
            </p>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex-1 text-center">
            <p className="mb-0.5 text-muted-foreground">{t("common.to", "To")}</p>
            <p className="font-semibold">
              {selected.to
                ? fmtDate(cairoDateISO(selected.to.y, selected.to.m, selected.to.d))
                : hovered
                  ? fmtDate(cairoDateISO(hovered.y, hovered.m, hovered.d))
                  : "—"}
            </p>
          </div>
        </div>

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
            <div key={d} className="py-1 text-center text-xs font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const dn = year * 10000 + month * 100 + d;
            const isFuture = dn > todayNum;
            const isToday = dn === todayNum;
            const isStart = fromNum !== null && dn === fromNum;
            const isEnd = toNum_ !== null && fromNum !== null && dn === toNum_;
            const lo = fromNum !== null && toNum_ !== null ? Math.min(fromNum, toNum_) : null;
            const hi = fromNum !== null && toNum_ !== null ? Math.max(fromNum, toNum_) : null;
            const inRange = lo !== null && hi !== null && dn > lo && dn < hi;

            return (
              <div
                key={i}
                className={cn(
                  "relative flex h-8 items-center justify-center",
                  inRange && "bg-primary/10",
                  isStart && "rounded-s-full bg-primary/10",
                  isEnd && "rounded-e-full bg-primary/10",
                  isStart && !selected.to && !hovered && "rounded-full",
                )}
              >
                <button
                  type="button"
                  disabled={isFuture}
                  onClick={() => !isFuture && handleSelect({ y: year, m: month, d })}
                  onMouseEnter={() => !isFuture && setHovered({ y: year, m: month, d })}
                  onMouseLeave={() => setHovered(undefined)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-xs font-medium",
                    isFuture && "cursor-not-allowed text-muted-foreground/30",
                    !isFuture && !isStart && !isEnd && "hover:bg-muted",
                    isToday && !isStart && !isEnd && "border border-primary text-primary",
                    (isStart || isEnd) && "bg-primary font-semibold text-primary-foreground shadow-sm",
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
          <p className="text-xs text-muted-foreground">
            {!selected.from
              ? t("datePicker.clickStart", "Click a start date")
              : !selected.to
                ? t("datePicker.clickEnd", "Click an end date")
                : t("datePicker.rangeSelected", "Range selected")}
          </p>
          <Button size="sm" onClick={handleApply} disabled={!selected.from}>
            {t("datePicker.apply", "Apply")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
