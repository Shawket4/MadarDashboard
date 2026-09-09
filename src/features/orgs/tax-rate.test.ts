import { describe, expect, it } from "vitest";

import { fractionToPercent, formatRate, percentToFraction } from "./tax-rate";

describe("tax rate units", () => {
  it("converts the way a person expects", () => {
    expect(fractionToPercent(0.14)).toBe(14);
    expect(percentToFraction(14)).toBe(0.14);
  });

  it("does not leak binary floating point into a settings field", () => {
    // 0.14 * 100 is 14.000000000000002 in IEEE754. A field showing that reads
    // as broken.
    expect(fractionToPercent(0.14)).toBe(14);
    expect(fractionToPercent(0.07)).toBe(7);
    expect(fractionToPercent(0.255)).toBe(25.5);
  });

  it("round-trips every rate the column can hold", () => {
    // numeric(5,4): four decimal places, 0..1.
    for (let n = 0; n <= 10_000; n += 7) {
      const fraction = n / 10_000;
      expect(percentToFraction(fractionToPercent(fraction))).toBeCloseTo(fraction, 6);
    }
  });

  it("treats a missing rate as no tax, not as a default", () => {
    // The backend used to fall back to 0.14 whenever it failed to read a rate,
    // silently charging Egyptian VAT to a shop that never set one.
    expect(fractionToPercent(null)).toBe(0);
    expect(fractionToPercent(undefined)).toBe(0);
    expect(percentToFraction(null)).toBe(0);
    expect(fractionToPercent(Number.NaN)).toBe(0);
  });

  it("formats for a table", () => {
    expect(formatRate(0.14)).toBe("14%");
    expect(formatRate(0)).toBe("0%");
    expect(formatRate(null)).toBe("0%");
  });
});
