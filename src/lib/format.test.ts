import { describe, expect, it } from "vitest";
import { egpToPiastres, fmtHour, piastresToEgp } from "@/lib/format";

describe("fmtHour", () => {
  it("formats midnight and noon as 12am/12pm", () => {
    expect(fmtHour(0)).toBe("12am");
    expect(fmtHour(12)).toBe("12pm");
  });

  it("formats AM hours without leading zero", () => {
    expect(fmtHour(1)).toBe("1am");
    expect(fmtHour(6)).toBe("6am");
    expect(fmtHour(11)).toBe("11am");
  });

  it("formats PM hours in 12-hour notation", () => {
    expect(fmtHour(13)).toBe("1pm");
    expect(fmtHour(18)).toBe("6pm");
    expect(fmtHour(23)).toBe("11pm");
  });
});

describe("egpToPiastres", () => {
  it("rounds float-imprecise products instead of truncating (no lost piastre)", () => {
    // `19.99 * 100` is 1998.9999999999998 in IEEE-754 — Math.trunc would give 1998.
    expect(egpToPiastres(19.99)).toBe(1999);
    expect(egpToPiastres(1.1)).toBe(110);
    expect(egpToPiastres(0.07)).toBe(7);
    expect(egpToPiastres(4.6)).toBe(460);
  });

  it("handles exact and zero values", () => {
    expect(egpToPiastres(0)).toBe(0);
    expect(egpToPiastres(5)).toBe(500);
    expect(egpToPiastres(123.45)).toBe(12345);
  });

  it("round-trips through piastresToEgp for two-decimal prices", () => {
    for (const egp of [19.99, 1.1, 0.07, 250.5, 999.95, 4.6]) {
      expect(piastresToEgp(egpToPiastres(egp))).toBeCloseTo(egp, 2);
    }
  });
});
