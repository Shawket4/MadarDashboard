import { describe, expect, it } from "vitest";
import { toExcelDateSerial } from "@/lib/excel";

/** Decode an Excel serial the way ExcelJS/Excel does, then read it with getUTC*
 *  to recover the wall-clock digits the cell will display. */
const decodeWallClock = (serial: number): Date =>
  new Date(Math.round((serial - 25569) * 86_400_000));

/** Expected wall-clock parts for `instant` in `tz`, via Intl (same IANA data). */
const wallParts = (instant: Date, tz: string) => {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  })
    .formatToParts(instant)
    .reduce<Record<string, string>>((a, x) => { a[x.type] = x.value; return a; }, {});
  return { y: +p.year, m: +p.month, d: +p.day, h: +(p.hour === "24" ? "0" : p.hour), min: +p.minute };
};

describe("toExcelDateSerial", () => {
  it("encodes the branch-local wall clock, not UTC (positive offset)", () => {
    const utc = new Date("2026-06-15T22:30:00Z"); // Cairo (+2/+3) → next day locally
    const decoded = decodeWallClock(toExcelDateSerial(utc, "Africa/Cairo"));
    const w = wallParts(utc, "Africa/Cairo");
    expect(decoded.getUTCFullYear()).toBe(w.y);
    expect(decoded.getUTCMonth() + 1).toBe(w.m);
    expect(decoded.getUTCDate()).toBe(w.d);
    expect(decoded.getUTCHours()).toBe(w.h);
    expect(decoded.getUTCMinutes()).toBe(w.min);
  });

  it("encodes the branch-local wall clock for a negative-offset zone", () => {
    const utc = new Date("2026-01-01T03:00:00Z"); // New York (−5) → previous day locally
    const decoded = decodeWallClock(toExcelDateSerial(utc, "America/New_York"));
    const w = wallParts(utc, "America/New_York");
    expect(decoded.getUTCFullYear()).toBe(w.y);
    expect(decoded.getUTCMonth() + 1).toBe(w.m);
    expect(decoded.getUTCDate()).toBe(w.d);
    expect(decoded.getUTCHours()).toBe(w.h);
  });

  it("differs from the naive UTC serial by exactly the zone offset", () => {
    const utc = new Date("2026-06-15T22:30:00Z");
    const naiveUtcSerial = 25569 + utc.getTime() / 86_400_000; // ExcelJS's old (buggy) result
    const cairo = toExcelDateSerial(utc, "Africa/Cairo");
    const offsetHours = (cairo - naiveUtcSerial) * 24;
    // Cairo is +2 (standard) or +3 (DST); the fix shifts the serial forward by that.
    expect([2, 3]).toContain(Math.round(offsetHours));
  });
});
