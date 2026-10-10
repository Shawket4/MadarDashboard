// madar-shared's madar-time rules as the dashboard calls them (WebAssembly,
// src/lib/rules), run against the crate's vectors (day bounds, week start,
// business date).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { useAppStore } from "@/data/stores/app.store";
import { weekStartOf as rosterWeekStart, weekdayOf } from "@/features/dawam/week";
import { isoDaysFromToday } from "@/features/staff/util";
import businessDates from "./business_date_vectors.json";
import dayBounds from "./day_bounds_vectors.json";
import { cairoDateISO, cairoParts, dayBoundaryISO } from "./format";
import * as pub from "./rules/wasm/public/madar_web.js";
import weeks from "./week_vectors.json";
import { WEEK_START, weekStartOf } from "./week";

/** "yyyy-mm-dd" → { y, m (0-based), d } */
const parts = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
};

// The full package bundles every zone (Europe/London included), so every
// vector runs here. The customer bundles' public package keeps only the zones a
// branch is in (madar-shared scripts/tz-filter.txt): a zone outside it throws.
describe("the public package's business_date", () => {
  pub.initSync({ module: readFileSync(resolve(__dirname, "rules/wasm/public/madar_web_bg.wasm")) });
  const inZone = (tz: string) => tz !== "Europe/London";
  it.each(businessDates.filter((v) => inZone(v.tz)))("$tz $at → $business_date", ({ tz, at, business_date }) => {
    expect(pub.business_date(tz, Date.parse(at))).toBe(business_date);
  });
  it("throws for a zone it leaves out (Europe/London)", () => {
    const left = businessDates.filter((v) => !inZone(v.tz));
    expect(left.length).toBeGreaterThan(0);
    for (const { tz, at } of left) expect(() => pub.business_date(tz, Date.parse(at))).toThrow(/time zone/);
  });
});

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
  it.each(businessDates)("$tz $at → $business_date", ({ tz, at, business_date }) => {
    useAppStore.setState({ activeTimezone: tz });
    expect(cairoParts(at)).toEqual(parts(business_date));
    vi.useFakeTimers();
    vi.setSystemTime(new Date(at));
    expect(isoDaysFromToday(0)).toBe(business_date);
  });
});
