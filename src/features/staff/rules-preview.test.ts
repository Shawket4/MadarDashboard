import { describe, expect, it } from "vitest";

import { EMPTY_VALUES, tierProblem, type Tier } from "./rules-form";
import { changedRules, dayPiastres, selectTier, tierPiastres } from "./rules-preview";

// The server's suggested ladder (attendance.rs `suggested_tiers`).
const ladder: Tier[] = [
  { from_minutes: 1, to_minutes: 15, kind: "minutes", value: 15 },
  { from_minutes: 16, to_minutes: 30, kind: "day_fraction", value: 0.25 },
  { from_minutes: 31, to_minutes: 60, kind: "day_fraction", value: 0.5 },
  { from_minutes: 61, to_minutes: null, kind: "day_fraction", value: 1 },
];
const ex = { salary: 1200000, workingDays: 30, shiftMinutes: 480 }; // EGP 12,000, 8 h

describe("the ladder preview matches the server's pricing", () => {
  it("picks the rung like select_late_tier", () => {
    expect(selectTier(ladder, 0)).toBeNull();
    expect(selectTier(ladder, 1)).toBe(ladder[0]);
    expect(selectTier(ladder, 15)).toBe(ladder[0]);
    expect(selectTier(ladder, 20)).toBe(ladder[1]);
    expect(selectTier(ladder, 500)).toBe(ladder[3]);
    expect(selectTier(ladder.slice(0, 3), 500)).toBeNull();
  });

  it("late 20 min → a quarter day = EGP 100 on EGP 12,000 / 30 days", () => {
    expect(tierPiastres(ladder[1], ex)).toBe(10000);
  });

  it("minutes of pay: 15 min on an 8 h day = EGP 12.50", () => {
    // 1,200,000 × 15 / (30 × 480) = 1250 piastres exactly.
    expect(tierPiastres(ladder[0], ex)).toBe(1250);
  });

  it("multiplies before dividing and rounds half away from zero, like PayRates", () => {
    // 1,000,000 × 30 / (30 × 480) = 2083.33… → 2083
    expect(tierPiastres({ from_minutes: 1, to_minutes: null, kind: "minutes", value: 30 }, { salary: 1000000, workingDays: 30, shiftMinutes: 480 })).toBe(2083);
    // 100 × 0.5 / 1 = 50; 1 × 0.5 / 1 = 0.5 → 1
    expect(tierPiastres({ from_minutes: 1, to_minutes: null, kind: "day_fraction", value: 0.5 }, { salary: 1, workingDays: 1, shiftMinutes: 480 })).toBe(1);
  });

  it("guards zero divisors instead of dividing by them", () => {
    expect(tierPiastres(ladder[1], { ...ex, workingDays: 0 })).toBe(0);
    expect(tierPiastres(ladder[0], { ...ex, shiftMinutes: 0 })).toBe(0);
    expect(dayPiastres({ ...ex, workingDays: 0 })).toBe(0);
  });

  it("a fixed amount is itself", () => {
    expect(tierPiastres({ from_minutes: 1, to_minutes: null, kind: "piastres", value: 5000 }, ex)).toBe(5000);
  });

  it("an absence of 1.5 days", () => {
    expect(dayPiastres(ex, 1.5)).toBe(60000);
  });
});

describe("changedRules", () => {
  it("names exactly what a save would change", () => {
    const before = { ...EMPTY_VALUES, tiers: ladder };
    const now = { ...before, absenceDays: "2", dawam: { ...before.dawam, nightStart: "23:00" } };
    const names = changedRules(now, before, false).map((c) => c.name).sort();
    expect(names).toEqual(["absence_deduction_days", "night_start"]);
  });
  it("nothing changed, nothing named", () => {
    expect(changedRules(EMPTY_VALUES, EMPTY_VALUES, false)).toEqual([]);
  });
});

describe("tierProblem refuses what a kit field refused", () => {
  it("a rung whose minutes aren't a number is never saved as 'no limit'", () => {
    expect(tierProblem([{ from_minutes: 1, to_minutes: NaN, kind: "minutes", value: 15 }])?.key).toBe("staff.tierNotANumber");
    expect(tierProblem([{ from_minutes: NaN, to_minutes: 15, kind: "minutes", value: 15 }])?.key).toBe("staff.tierNotANumber");
    expect(tierProblem([{ from_minutes: 1, to_minutes: 15, kind: "minutes", value: NaN }])?.key).toBe("staff.tierNegativeValue");
    expect(tierProblem([{ from_minutes: 1, to_minutes: null, kind: "minutes", value: 15 }])).toBeNull();
  });
});
