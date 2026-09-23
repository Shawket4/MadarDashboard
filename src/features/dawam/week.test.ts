import { describe, expect, it } from "vitest";
import { addDays, weekDays, weekStartOf, weekdayOf } from "./week";

describe("roster weeks", () => {
  it("start on Saturday", () => {
    expect(weekStartOf("2026-09-22")).toBe("2026-09-19"); // Tuesday → Saturday before
    expect(weekStartOf("2026-09-19")).toBe("2026-09-19"); // a Saturday is its own start
    expect(weekStartOf("2026-09-25")).toBe("2026-09-19"); // Friday ends the week
    expect(weekStartOf("2026-09-26")).toBe("2026-09-26");
  });

  it("cross months and years as calendar dates", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(weekDays("2026-09-26")).toEqual([
      "2026-09-26", "2026-09-27", "2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02",
    ]);
    expect(weekdayOf("2026-09-19")).toBe(6);
  });
});
