import { businessDate, cairoParts, dateParts, dayBoundaryISO, getActiveTz } from "@/lib/format";
import { rules } from "@/lib/rules";

/**
 * The first day of a week, everywhere (owner rule, 2026-09-17): SATURDAY, as a
 * JS `getDay()` index, for laying out calendar grids. Which week a day belongs
 * to is madar-time's `week_start` (WebAssembly, `@/lib/rules`); madar-time.test.ts
 * checks this constant against it.
 */
export const WEEK_START = 6 as const;

/** Days from the week's start to a `getDay()` index (0..6). */
export const daysIntoWeek = (jsDay: number): number => (jsDay - WEEK_START + 7) % 7;

/** `getDay()` indices in week order, starting with {@link WEEK_START}. */
export const WEEK_ORDER: number[] = Array.from({ length: 7 }, (_, i) => (WEEK_START + i) % 7);

/** The local calendar day (in `tz`) the week holding `instant` starts on: madar-time `week_start` of its business date. */
export const weekStartOf = (
  instant: Date | number | string,
  tz: string = getActiveTz(),
): { y: number; m: number; d: number } => dateParts(rules.week_start(businessDate(instant, tz)));

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
  const from = dayBoundaryISO(tz, s.y, s.m, s.d + 7 * offset);
  if (offset === 0) {
    const n = cairoParts(now, tz);
    return { from, to: dayBoundaryISO(tz, n.y, n.m, n.d, true) };
  }
  return { from, to: dayBoundaryISO(tz, s.y, s.m, s.d + 7 * offset + 6, true) };
};
