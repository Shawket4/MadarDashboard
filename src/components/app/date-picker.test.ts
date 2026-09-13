import { describe, expect, it } from "vitest";
import { dayBoundaryISO } from "@/data/scope/presets";
import { partsIn, todayIn } from "./date-picker";

// 2026-09-13 23:30 UTC: already the 14th in Cairo (UTC+3), still the 13th in New York.
const NOW = Date.UTC(2026, 8, 13, 23, 30);

describe("DatePicker day boundaries", () => {
  it("today differs by timezone", () => {
    expect(todayIn("Africa/Cairo", NOW)).toEqual({ y: 2026, m: 8, d: 14 });
    expect(todayIn("America/New_York", NOW)).toEqual({ y: 2026, m: 8, d: 13 });
  });

  it("selected day emits a UTC Z instant at local midnight", () => {
    expect(dayBoundaryISO("Africa/Cairo", 2026, 8, 14)).toBe("2026-09-13T21:00:00.000Z");
    expect(dayBoundaryISO("America/New_York", 2026, 8, 13)).toBe("2026-09-13T04:00:00.000Z");
  });

  it("round-trips the selected instant back to the same calendar day", () => {
    for (const tz of ["Africa/Cairo", "America/New_York"]) {
      const iso = dayBoundaryISO(tz, 2026, 8, 13);
      expect(iso.endsWith("Z")).toBe(true);
      expect(partsIn(iso, tz)).toEqual({ y: 2026, m: 8, d: 13 });
    }
  });
});
