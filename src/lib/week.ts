import { TZDate } from "@date-fns/tz";
import { dayBoundaryISO } from "@/data/scope/presets";
import { getActiveTz } from "@/lib/format";

/**
 * The first day of a week, everywhere (owner rule, 2026-09-17): SATURDAY, as a
 * JS `getDay()` index. The backend (`tz::WEEK_START`) and the POS core
 * (`timefmt::WEEK_START`) carry the same rule; every week preset, week bucket
 * and calendar grid on the dashboard reads it from here.
 */
export const WEEK_START = 6 as const;

/** Days from the week's start to a `getDay()` index (0..6). */
export const daysIntoWeek = (jsDay: number): number => (jsDay - WEEK_START + 7) % 7;

/** `getDay()` indices in week order, starting with {@link WEEK_START}. */
export const WEEK_ORDER: number[] = Array.from({ length: 7 }, (_, i) => (WEEK_START + i) % 7);

/** The local calendar day (in `tz`) the week holding `instant` starts on. */
export const weekStartOf = (
  instant: Date | number | string,
  tz: string = getActiveTz(),
): { y: number; m: number; d: number } => {
  const ms = typeof instant === "string" ? Date.parse(instant) : +instant;
  const n = new TZDate(ms, tz);
  const s = new TZDate(n.getFullYear(), n.getMonth(), n.getDate() - daysIntoWeek(n.getDay()), tz);
  return { y: s.getFullYear(), m: s.getMonth(), d: s.getDate() };
};

/**
 * [from, to] UTC instants of a week in `tz`: `offset` 0 = this week (its start
 * to the end of today), -1 = last week (whole), and so on.
 */
export const weekRange = (
  tz: string = getActiveTz(),
  now: Date | number = Date.now(),
  offset = 0,
): { from: string; to: string } => {
  const s = weekStartOf(now, tz);
  const start = new TZDate(s.y, s.m, s.d + 7 * offset, tz);
  const from = dayBoundaryISO(tz, start.getFullYear(), start.getMonth(), start.getDate());
  if (offset === 0) {
    const n = new TZDate(+now, tz);
    return { from, to: dayBoundaryISO(tz, n.getFullYear(), n.getMonth(), n.getDate(), true) };
  }
  const end = new TZDate(s.y, s.m, s.d + 7 * offset + 6, tz);
  return { from, to: dayBoundaryISO(tz, end.getFullYear(), end.getMonth(), end.getDate(), true) };
};
