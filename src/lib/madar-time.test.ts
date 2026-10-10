// madar-shared's madar-time rules as the dashboard calls them (WebAssembly,
// src/lib/rules), run against the crate's vectors (day bounds, week start,
// business date).
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAppStore } from "@/data/stores/app.store";
import { weekStartOf as rosterWeekStart, weekdayOf } from "@/features/dawam/week";
import { isoDaysFromToday } from "@/features/staff/util";
import businessDates from "./business_date_vectors.json";
import dayBounds from "./day_bounds_vectors.json";
import { cairoDateISO, cairoParts, dayBoundaryISO } from "./format";
import { rules } from "./rules";
import weeks from "./week_vectors.json";
import { WEEK_START, weekStartOf } from "./week";

/** "yyyy-mm-dd" → { y, m (0-based), d } */
const parts = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
};

// The wasm bundles the zones a branch is in (madar-shared scripts/tz-filter.txt);
// a vector in a zone it leaves out cannot run here, and must say so.
const bundled = (tz: string) => {
  try {
    rules.business_date(tz, 0);
    return true;
  } catch {
    return false;
  }
};
it("runs every vector but the zones the wasm leaves out", () => {
  const left = [...new Set([...dayBounds, ...businessDates].map((v) => v.tz))].filter((tz) => !bundled(tz));
  expect(left).toEqual(["Europe/London"]);
});
const runnable = <T extends { tz: string }>(vs: T[]) => vs.filter((v) => bundled(v.tz));

const initialTz = useAppStore.getState().activeTimezone;
afterEach(() => {
  useAppStore.setState({ activeTimezone: initialTz });
  vi.useRealTimers();
});

describe("dayBoundaryISO — day_bounds vectors", () => {
  it.each(runnable(dayBounds))("$tz $date ($hours h)", ({ tz, date, start, end }) => {
    const { y, m, d } = parts(date);
    expect(dayBoundaryISO(tz, y, m, d)).toBe(new Date(start).toISOString());
    // Reports filter `at <= to` (MadarRust reports/handlers.rs), so the day's
    // last instant is Rust's exclusive end minus 1 ms.
    expect(dayBoundaryISO(tz, y, m, d, true)).toBe(new Date(Date.parse(end) - 1).toISOString());
  });

  it("cairoDateISO is the same rule in the active timezone", () => {
    for (const { tz, date } of runnable(dayBounds)) {
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
    // The roster's calendar-date call.
    expect(rosterWeekStart(date)).toBe(week_start);
    expect(WEEKDAYS[weekdayOf(date)]).toBe(weekday);
    // The calendar grids' first column is the rule's weekday.
    expect(weekdayOf(week_start)).toBe(WEEK_START);
    // The instant call, from the day's first and last instant in two zones.
    const { y, m, d } = parts(date);
    for (const tz of ["UTC", "Africa/Cairo"]) {
      expect(weekStartOf(dayBoundaryISO(tz, y, m, d), tz)).toEqual(parts(week_start));
      expect(weekStartOf(dayBoundaryISO(tz, y, m, d, true), tz)).toEqual(parts(week_start));
    }
  });
});

describe("business date — business_date vectors", () => {
  it.each(runnable(businessDates))("$tz $at → $business_date", ({ tz, at, business_date }) => {
    useAppStore.setState({ activeTimezone: tz });
    expect(cairoParts(at)).toEqual(parts(business_date));
    vi.useFakeTimers();
    vi.setSystemTime(new Date(at));
    expect(isoDaysFromToday(0)).toBe(business_date);
  });
});
