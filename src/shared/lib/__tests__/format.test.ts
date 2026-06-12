import { describe, expect, it } from "vitest";
import { egpToPiastres, fmtMoney, fmtMoneyCompact, piastresToEgp } from "../format";

describe("fmtMoney", () => {
  it("formats 100 piastres as 1.00 EGP", () => {
    const out = fmtMoney(100);
    expect(out).toContain("1.00");
    expect(out).toMatch(/EGP|E£|ج\.م/);
  });

  it("formats 0 piastres as 0.00 EGP (zero is a real value, not unknown)", () => {
    expect(fmtMoney(0)).toContain("0.00");
  });

  it("renders null as an em-dash, never 0.00 EGP", () => {
    expect(fmtMoney(null)).toBe("—");
    expect(fmtMoney(null)).not.toContain("0.00");
  });

  it("renders undefined as an em-dash", () => {
    expect(fmtMoney(undefined)).toBe("—");
  });

  it("respects fractionDigits 0", () => {
    expect(fmtMoney(12345, { fractionDigits: 0 })).toContain("123");
  });
});

describe("fmtMoneyCompact", () => {
  it("renders null/undefined as an em-dash", () => {
    expect(fmtMoneyCompact(null)).toBe("—");
    expect(fmtMoneyCompact(undefined)).toBe("—");
  });

  it("formats real values", () => {
    expect(fmtMoneyCompact(0)).not.toBe("—");
  });
});

describe("piastres conversions", () => {
  it("piastresToEgp divides by 100", () => {
    expect(piastresToEgp(150)).toBe(1.5);
    expect(piastresToEgp(0)).toBe(0);
  });

  it("egpToPiastres multiplies by 100 and truncates", () => {
    expect(egpToPiastres(1.5)).toBe(150);
    expect(egpToPiastres(0.999)).toBe(99);
    expect(egpToPiastres(0)).toBe(0);
  });
});
