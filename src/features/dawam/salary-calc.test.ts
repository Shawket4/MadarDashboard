/**
 * The add-employee salary calculator (owner decision 9): any one of monthly,
 * daily or hourly gives the other two from the rules' working days and day
 * length, and the first pay is pro rata by calendar days (PAY-13), the
 * backend's joiner rule. Money is integer piastres, rounded half away from
 * zero; always multiply before dividing (RU-6).
 */
import { describe, expect, it } from "vitest";

import { DEFAULT_BASIS, firstPay, periodOf, rates, roundDiv } from "./salary-calc";

describe("roundDiv", () => {
  it("rounds half away from zero", () => {
    expect(roundDiv(5, 2)).toBe(3);
    expect(roundDiv(-5, 2)).toBe(-3);
    expect(roundDiv(4, 3)).toBe(1);
    expect(roundDiv(5, 3)).toBe(2);
    expect(roundDiv(0, 7)).toBe(0);
  });
});

describe("rates", () => {
  it("defaults to 26 working days of 480 minutes", () => {
    expect(DEFAULT_BASIS).toEqual({ workingDays: 26, dayMinutes: 480 });
  });

  it("from a monthly salary: EGP 6,500 a month is EGP 250 a day and EGP 31.25 an hour", () => {
    expect(rates({ monthly: 650_000 }, DEFAULT_BASIS)).toEqual({ monthly: 650_000, daily: 25_000, hourly: 3_125 });
  });

  it("from a daily rate", () => {
    expect(rates({ daily: 25_000 }, DEFAULT_BASIS)).toEqual({ monthly: 650_000, daily: 25_000, hourly: 3_125 });
  });

  it("from an hourly rate", () => {
    expect(rates({ hourly: 3_125 }, DEFAULT_BASIS)).toEqual({ monthly: 650_000, daily: 25_000, hourly: 3_125 });
  });

  it("multiplies before dividing and rounds half away from zero", () => {
    // 1,000,000 / 26 = 38,461.538… → 38,462; ×60 / (26 × 480) = 4,807.69… → 4,808.
    expect(rates({ monthly: 1_000_000 }, DEFAULT_BASIS)).toEqual({ monthly: 1_000_000, daily: 38_462, hourly: 4_808 });
  });

  it("follows the rules' working days (30) and day length (9 hours)", () => {
    // 900,000 / 30 = 30,000 a day; / 9 h = 3,333.33… → 3,333 an hour.
    expect(rates({ monthly: 900_000 }, { workingDays: 30, dayMinutes: 540 })).toEqual({ monthly: 900_000, daily: 30_000, hourly: 3_333 });
  });

  it("takes half working days (26.5)", () => {
    // 20,000 × 26.5 = 530,000 exactly.
    expect(rates({ daily: 20_000 }, { workingDays: 26.5, dayMinutes: 480 }).monthly).toBe(530_000);
  });
});

describe("periodOf", () => {
  it("a calendar month when periods start on the 1st", () => {
    expect(periodOf("2026-10-16", 1)).toEqual({ start: "2026-10-01", end: "2026-10-31", days: 31 });
  });

  it("a 26th–25th month", () => {
    expect(periodOf("2026-10-27", 26)).toEqual({ start: "2026-10-26", end: "2026-11-25", days: 31 });
    expect(periodOf("2026-10-10", 26)).toEqual({ start: "2026-09-26", end: "2026-10-25", days: 30 });
  });

  it("crosses the year", () => {
    expect(periodOf("2027-01-05", 26)).toEqual({ start: "2026-12-26", end: "2027-01-25", days: 31 });
  });
});

describe("firstPay", () => {
  it("is pro rata by calendar days: 310,000 × 16/31 = 160,000 (the money report's joiner)", () => {
    expect(firstPay(310_000, "2026-10-16", 1)).toEqual({ from: "2026-10-16", to: "2026-10-31", days: 16, periodDays: 31, piastres: 160_000 });
  });

  it("a whole period from its first day", () => {
    expect(firstPay(650_000, "2026-09-26", 26).piastres).toBe(650_000);
  });

  it("rounds half away from zero", () => {
    // 26 Sep – 25 Oct is 30 days; from 11 Oct is 15: 100,001 × 15 / 30 = 50,000.5 → 50,001.
    expect(firstPay(100_001, "2026-10-11", 26)).toMatchObject({ days: 15, periodDays: 30, piastres: 50_001 });
  });
});
