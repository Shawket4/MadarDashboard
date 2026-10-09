import { describe, expect, it } from "vitest";

import { clashesWith, crossesMidnight, lengthOf, overlapsOf, spanOf, toMinutes } from "./schedule-checks";

describe("schedule checks", () => {
  it("reads wall-clock times with or without seconds", () => {
    expect(toMinutes("09:30")).toBe(570);
    expect(toMinutes("22:00:00")).toBe(1320);
    expect(toMinutes("")).toBeNaN();
  });

  it("treats an end at or before the start as the next day", () => {
    expect(crossesMidnight("22:00", "06:00")).toBe(true);
    expect(crossesMidnight("08:00", "08:00")).toBe(true);
    expect(crossesMidnight("08:00", "16:00")).toBe(false);
    expect(spanOf("22:00", "06:00")).toEqual([1320, 1800]);
    expect(lengthOf("22:00", "06:00")).toBe(480);
    expect(lengthOf("09:00", "17:30")).toBe(510);
  });

  it("finds a split day that doesn't overlap as clean", () => {
    expect(overlapsOf([
      { name: "Morning", start: "08:00", end: "12:00" },
      { name: "Evening", start: "16:00", end: "22:00" },
    ])).toEqual([]);
  });

  it("lets one block end exactly when the next starts", () => {
    expect(overlapsOf([
      { name: "Morning", start: "08:00", end: "16:00" },
      { name: "Evening", start: "16:00", end: "23:00" },
    ])).toEqual([]);
  });

  it("catches an overnight block running over a late one", () => {
    const night = { name: "Night", start: "22:00", end: "06:00" };
    const late = { name: "Late", start: "18:00", end: "23:00" };
    expect(overlapsOf([night, late])).toEqual([[night, late]]);
    expect(clashesWith([late], night)).toEqual([late]);
  });

  it("names only what the new block clashes with", () => {
    const morning = { name: "Morning", start: "08:00", end: "14:00" };
    const evening = { name: "Evening", start: "17:00", end: "23:00" };
    const mid = { name: "Mid", start: "12:00", end: "16:00" };
    expect(clashesWith([morning, evening], mid)).toEqual([morning]);
  });
});
