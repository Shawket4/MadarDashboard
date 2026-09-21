import { describe, expect, it } from "vitest";
import { daysIntoWeek, WEEK_ORDER, WEEK_START, weekRange, weekStartOf } from "./week";

const CAIRO = "Africa/Cairo"; // UTC+3 in September 2026
// Friday 18 Sep 2026 23:30 and Saturday 19 Sep 00:30 in Cairo: both Friday in UTC.
const FRI_2330 = "2026-09-18T20:30:00Z";
const SAT_0030 = "2026-09-18T21:30:00Z";

describe("weeks start Saturday", () => {
  it("is Saturday", () => {
    expect(WEEK_START).toBe(6);
    expect(WEEK_ORDER).toEqual([6, 0, 1, 2, 3, 4, 5]);
    expect(daysIntoWeek(6)).toBe(0);
    expect(daysIntoWeek(5)).toBe(6);
  });

  it("puts a Friday 23:30 Cairo sale in the previous week and Saturday 00:30 in the new one", () => {
    expect(weekStartOf(FRI_2330, CAIRO)).toEqual({ y: 2026, m: 8, d: 12 });
    expect(weekStartOf(SAT_0030, CAIRO)).toEqual({ y: 2026, m: 8, d: 19 });
    // UTC reads both as Friday, one week.
    expect(weekStartOf(FRI_2330, "UTC")).toEqual(weekStartOf(SAT_0030, "UTC"));
  });

  it("cuts this week and last week at local Saturday midnight", () => {
    const now = Date.parse(SAT_0030);
    expect(weekRange(CAIRO, now)).toEqual({ from: "2026-09-18T21:00:00.000Z", to: "2026-09-19T20:59:59.999Z" });
    expect(weekRange(CAIRO, now, -1)).toEqual({ from: "2026-09-11T21:00:00.000Z", to: "2026-09-18T20:59:59.999Z" });
    const friday = weekRange(CAIRO, Date.parse(FRI_2330));
    expect(friday.from).toBe("2026-09-11T21:00:00.000Z");
    // The Friday sale is inside last week's range once Saturday starts, the Saturday one is not.
    const last = weekRange(CAIRO, now, -1);
    expect(Date.parse(FRI_2330) >= Date.parse(last.from) && Date.parse(FRI_2330) <= Date.parse(last.to)).toBe(true);
    expect(Date.parse(SAT_0030) > Date.parse(last.to)).toBe(true);
  });
});
