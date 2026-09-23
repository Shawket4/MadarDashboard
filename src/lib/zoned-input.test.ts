import { describe, expect, it } from "vitest";

import { fromZonedInput, toZonedInput } from "./zoned-input";

describe("zoned datetime inputs (AT-1)", () => {
  it("reads and writes the branch's wall clock, never the device's", () => {
    // 09:00 in Cairo (UTC+3 in September) is 06:00Z, wherever the browser is.
    expect(fromZonedInput("2026-09-23T09:00", "Africa/Cairo")).toBe("2026-09-23T06:00:00.000Z");
    expect(toZonedInput("2026-09-23T06:00:00Z", "Africa/Cairo")).toBe("2026-09-23T09:00");
    // Dubai is UTC+4 all year.
    expect(fromZonedInput("2026-01-10T23:30", "Asia/Dubai")).toBe("2026-01-10T19:30:00.000Z");
  });

  it("round-trips", () => {
    for (const iso of ["2026-03-01T21:15:00.000Z", "2026-10-31T00:05:00.000Z"]) {
      expect(fromZonedInput(toZonedInput(iso, "Africa/Cairo"), "Africa/Cairo")).toBe(iso);
    }
  });

  it("empty and junk are no time, not a crash", () => {
    expect(toZonedInput(null, "Africa/Cairo")).toBe("");
    expect(toZonedInput("garbage", "Africa/Cairo")).toBe("");
    expect(fromZonedInput("", "Africa/Cairo")).toBeNull();
    expect(fromZonedInput("09:00", "Africa/Cairo")).toBeNull();
  });
});
