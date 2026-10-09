import { describe, expect, it } from "vitest";

import { quickRange } from "@/components/inputs/date-field";
import vectors from "@/lib/dawam_vectors.json";
import { firstPay, periodOf } from "./salary-calc";

// madar-shared's dawam_vectors.json (src/lib, pinned to its tag): the pay
// windows madar-dawam's `pay::period_window` gives, start days outside 1–28
// included (clamped). Both dashboard copies of the rule must agree on each.
describe("the pay period matches madar-shared's vectors", () => {
  it.each(vectors.periods)("$day, start day $start_day", (v) => {
    expect(periodOf(v.day, v.start_day)).toMatchObject({ start: v.start, end: v.end });
    expect(firstPay(0, v.day, v.start_day).to).toBe(v.end);
    const now = Date.parse(`${v.day}T12:00:00Z`);
    expect(quickRange("this_period", { periodStartDay: v.start_day, now, tz: "UTC" })).toEqual({ from: v.start, to: v.end });
  });
});
