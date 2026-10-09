// The dashboard's copies of madar-shared's madar-time rules, run against the
// crate's vectors (day bounds, week start, business date).
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAppStore } from "@/data/stores/app.store";
import { weekStartOf as rosterWeekStart, weekdayOf } from "@/features/dawam/week";
import { isoDaysFromToday } from "@/features/staff/util";
import businessDates from "./business_date_vectors.json";
import dayBounds from "./day_bounds_vectors.json";
import { cairoDateISO, cairoParts, dayBoundaryISO } from "./format";
import weeks from "./week_vectors.json";
import { weekStartOf } from "./week";

/** "yyyy-mm-dd" → { y, m (0-based), d } */
const parts = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
};

const initialTz = useAppStore.getState().activeTimezone;
afterEach(() => {
  useAppStore.setState({ activeTimezone: initialTz });
  vi.useRealTimers();
});

describe("dayBoundaryISO — day_bounds vectors", () => {
  it.each(dayBounds)("$tz $date ($hours h)", ({ tz, date, start, end }) => {
    const { y, m, d } = parts(date);
    expect(dayBoundaryISO(tz, y, m, d)).toBe(new Date(start).toISOString());
    // Reports filter `at <= to` (MadarRust reports/handlers.rs), so the day's
    // last instant is Rust's exclusive end minus 1 ms.
    expect(dayBoundaryISO(tz, y, m, d, true)).toBe(new Date(Date.parse(end) - 1).toISOString());
  });

  it("cairoDateISO is the same rule in the active timezone", () => {
    for (const { tz, date } of dayBounds) {
      const { y, m, d } = parts(date);
      useAppStore.setState({ activeTimezone: tz });
      expect(cairoDateISO(y, m, d)).toBe(dayBoundaryISO(tz, y, m, d));
      expect(cairoDateISO(y, m, d, true)).toBe(dayBoundaryISO(tz, y, m, d, true));
    }
  });
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

describe("week start — week vectors", () => {
  it.each(weeks)("$date ($weekday) → $week_start", ({ date, weekday, week_start }) => {
    // The roster's calendar-date copy.
    expect(rosterWeekStart(date)).toBe(week_start);
    expect(WEEKDAYS[weekdayOf(date)]).toBe(weekday);
    // The instant copy, from the day's first and last instant in two zones.
    const { y, m, d } = parts(date);
    for (const tz of ["UTC", "Africa/Cairo"]) {
      expect(weekStartOf(dayBoundaryISO(tz, y, m, d), tz)).toEqual(parts(week_start));
      expect(weekStartOf(dayBoundaryISO(tz, y, m, d, true), tz)).toEqual(parts(week_start));
    }
  });
});

describe("business date — business_date vectors", () => {
  it.each(businessDates)("$tz $at → $business_date", ({ tz, at, business_date }) => {
    useAppStore.setState({ activeTimezone: tz });
    expect(cairoParts(at)).toEqual(parts(business_date));
    vi.useFakeTimers();
    vi.setSystemTime(new Date(at));
    expect(isoDaysFromToday(0)).toBe(business_date);
  });
});
