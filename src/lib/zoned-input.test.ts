import { describe, expect, it } from "vitest";

import wall from "./wallclock_vectors.json";
import { fromZonedInput, toZonedInput } from "./zoned-input";

const pad = (n: number) => String(n).padStart(2, "0");

// madar-shared's wallclock_vectors.json (pinned by rev): madar-time's wall clock, both ways.
describe("wallclock vectors", () => {
  it.each(wall.parts)("parts: $tz $at → $date $hour:$minute ($note)", ({ tz, at, date, hour, minute }) => {
    expect(toZonedInput(at, tz)).toBe(`${date}T${pad(hour)}:${pad(minute)}`);
  });

  it.each(wall.instants)("instants: $tz $date $hour:$minute → $at ($note)", ({ tz, date, hour, minute, at }) => {
    expect(fromZonedInput(`${date}T${pad(hour)}:${pad(minute)}`, tz)).toBe(new Date(at).toISOString());
  });
});

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
    expect(fromZonedInput("2026-02-30T09:00", "Africa/Cairo")).toBeNull();
  });
});
