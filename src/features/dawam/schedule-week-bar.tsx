/**
 * The schedule's week, in one place: which week is on screen (and how far it
 * is from this one), a way back to today and a jump to any date — a week six
 * weeks out is one pick, not six clicks — and what state the week is in, with
 * the one thing to do next (publish a draft; nothing, once it is published).
 */
import { useTranslation } from "react-i18next";
import { CalendarCheck, CalendarClock, ChevronLeft, ChevronRight, Send } from "lucide-react";

import { DatePicker } from "@/components/app/date-picker";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/format";
import { todayIso } from "@/features/staff/util";
import { addDays, weekStartOf } from "./week";

/** Whole weeks from this week to `week` (both Saturdays): 0 now, 1 next, -1 last. */
export const weeksFromNow = (week: string, today = todayIso()): number =>
  Math.round((Date.parse(`${week}T00:00:00Z`) - Date.parse(`${weekStartOf(today)}T00:00:00Z`)) / (7 * 86_400_000));

export function WeekBar({
  week, onWeek, published, canPublish, publishing, ready, changedCount, onPublish,
}: {
  week: string;
  onWeek: (week: string) => void;
  published: boolean;
  canPublish: boolean;
  publishing: boolean;
  /** The week has loaded: publishing an unloaded week is never offered. */
  ready: boolean;
  /** Days changed since the week was published. */
  changedCount: number;
  onPublish: () => void;
}) {
  const { t } = useTranslation();
  const n = weeksFromNow(week);
  const when =
    n === 0 ? t("dawamOps.thisWeek", "This week")
    : n === 1 ? t("dawamOps.nextWeek", "Next week")
    : n === -1 ? t("dawamOps.lastWeek", "Last week")
    : n > 0 ? t("dawamOps.inWeeks", { count: n, defaultValue: "In {{count}} weeks" })
    : t("dawamOps.weeksAgo", { count: -n, defaultValue: "{{count}} weeks ago" });

  return (
    <section
      aria-label={t("dawam.week", "Week")}
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl border bg-card px-4 py-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        {/* The arrows and the range move as one: a wrapped toolbar never splits them (L-12). */}
        <div role="group" aria-label={t("dawam.week", "Week")} className="flex flex-nowrap items-center gap-1">
          <Button variant="outline" size="icon" aria-label={t("dawam.prevWeek", "Previous week")} onClick={() => onWeek(addDays(week, -7))}>
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </Button>
          <div className="min-w-[9.5rem] px-1 text-center">
            <div className="text-sm font-semibold tabular-nums">
              <bdi>{fmtDate(week)} – {fmtDate(addDays(week, 6))}</bdi>
            </div>
            <div className="text-xs text-muted-foreground">{when}</div>
          </div>
          <Button variant="outline" size="icon" aria-label={t("dawam.nextWeek", "Next week")} onClick={() => onWeek(addDays(week, 7))}>
            <ChevronRight className="size-4 rtl:rotate-180" />
          </Button>
        </div>
        {n !== 0 ? (
          <Button variant="ghost" size="sm" onClick={() => onWeek(weekStartOf(todayIso()))}>
            {t("dawamOps.backToThisWeek", "Back to this week")}
          </Button>
        ) : null}
        <DatePicker
          dateOnly
          value={week}
          onChange={(d) => onWeek(weekStartOf(d))}
          placeholder={t("dawamOps.goToDate", "Go to a date")}
          triggerClassName="h-8 w-auto"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2" role="status">
        {published ? (
          <>
            <StatusPill tone="success" icon={CalendarCheck}>{t("dawam.isPublished", "Published")}</StatusPill>
            <span className="text-sm text-muted-foreground">
              {changedCount > 0
                ? t("dawamOps.publishedChanged", { count: changedCount, defaultValue: "Staff see it. {{count}} days changed since; the people affected were told." })
                : t("dawamOps.publishedHint", "Staff see it. A change tells the people it affects.")}
            </span>
          </>
        ) : (
          <>
            <StatusPill tone="warning" icon={CalendarClock}>{t("dawam.draft", "Draft")}</StatusPill>
            <span className="text-sm text-muted-foreground">
              {canPublish
                ? t("dawamOps.draftHint", "Staff can't see this week until you publish it.")
                : t("dawamOps.draftHintNoRight", "Staff can't see this week until a manager with publish rights publishes it.")}
            </span>
            {canPublish ? (
              <Button size="sm" onClick={onPublish} disabled={publishing || !ready} loading={publishing}>
                <Send className="size-4" />{t("dawamOps.publishWeek", "Publish this week")}
              </Button>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
