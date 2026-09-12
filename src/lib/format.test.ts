import { describe, expect, it } from "vitest";
import { egpToPiastres, fmtHour, piastresToEgp, rateOf } from "@/lib/format";

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

describe("rateOf", () => {
  it("reads the rate field, not the legacy integer", () => {
    // `value` is 0-100 on the wire now; reading it as a fraction would show
    // a 14% discount as 1400% off, which is a refund.
    expect(rateOf({ value: 14, value_rate: 0.14, dtype: "percentage" })).toBe(0.14);
    expect(rateOf({ value: 5000, value_rate: 5000, dtype: "fixed" })).toBe(5000);
  });

  it("falls back to the legacy integer when the server predates the split", () => {
    expect(rateOf({ value: 14, dtype: "percentage" })).toBe(0.14);
    expect(rateOf({ value: 5000, dtype: "fixed" })).toBe(5000);
  });

  it("treats a zero rate as a rate, not as absent", () => {
    // `?? ` and not `||`: a 0% discount is a real, stored answer, and `||`
    // would fall through and re-divide the legacy value.
    expect(rateOf({ value: 0, value_rate: 0, dtype: "percentage" })).toBe(0);
  });
});
