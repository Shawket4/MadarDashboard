import { describe, expect, it } from "vitest";

import { fmtMinutesOfDay, meanTimeOfDay, salesStats, timingStats } from "./lib";
import type { TillSessionRow } from "@/data/api/generated/models";

const till = (p: Partial<TillSessionRow> = {}): TillSessionRow => ({
  till_id: Math.random().toString(36).slice(2),
  business_date: "2026-09-18",
  branch_name: "Zamalek",
  branch_code: "ZAM",
  teller_name: "Nour",
  opened_at: "2026-09-18T06:00:00Z",
  status: "closed",
  opening_cash: 50000,
  net_cash_payment: 0,
  pay_ins: 0,
  pay_outs: 0,
  cash_drops: 0,
  closing_cash_declared: null,
  closing_cash_system: null,
  cash_discrepancy: null,
  closed_at: "2026-09-18T14:00:00Z",
  orders_count: 0,
  gross_sales: 0,
  ...p,
});

describe("meanTimeOfDay", () => {
  it("averages ordinary times the obvious way", () => {
    // 08:00 and 10:00 → 09:00.
    expect(meanTimeOfDay([8 * 60, 10 * 60])).toBe(9 * 60);
  });

  it("averages ACROSS midnight instead of landing at noon", () => {
    // The bug a plain mean has: 23:50 and 00:10 average to 12:00, the one
    // time neither till was open. The circular mean gives midnight.
    const naive = (23 * 60 + 50 + 10) / 2;
    expect(naive).toBe(720); // 12:00 — what we must NOT return
    expect(meanTimeOfDay([23 * 60 + 50, 10])).toBe(0);
  });

  it("has no answer for times spread evenly round the clock", () => {
    // 00:00, 06:00, 12:00, 18:00 cancel out. Reporting 00:00 would be a
    // fiction, so the caller gets null and renders a dash.
    expect(meanTimeOfDay([0, 6 * 60, 12 * 60, 18 * 60])).toBeNull();
  });

  it("returns null for nothing to average", () => {
    expect(meanTimeOfDay([])).toBeNull();
  });

  it("formats minutes past midnight as a clock time", () => {
    expect(fmtMinutesOfDay(0)).toBe("00:00");
    expect(fmtMinutesOfDay(7 * 60 + 5)).toBe("07:05");
    expect(fmtMinutesOfDay(null)).toBe("—");
  });
});

describe("salesStats", () => {
  it("averages the bill over orders, not over tills", () => {
    const s = salesStats([
      till({ orders_count: 3, gross_sales: 300 }),
      till({ orders_count: 1, gross_sales: 100 }),
    ]);
    expect(s.orders).toBe(4);
    expect(s.sales).toBe(400);
    expect(s.avgOrderValue).toBe(100); // 400 / 4 orders
    expect(s.avgSalesPerTill).toBe(200); // 400 / 2 sessions
  });

  it("divides by nothing safely", () => {
    const s = salesStats([]);
    expect(s.avgOrderValue).toBe(0);
    expect(s.avgSalesPerTill).toBe(0);
    expect(s.best).toBeNull();
  });
});

describe("timingStats", () => {
  it("only measures length for sessions that closed", () => {
    const s = timingStats([
      till({ opened_at: "2026-09-18T06:00:00Z", closed_at: "2026-09-18T14:00:00Z" }),
      till({ opened_at: "2026-09-18T07:00:00Z", closed_at: null, status: "open" }),
    ]);
    expect(s.openNow).toBe(1);
    expect(s.avgDurationMs).toBe(8 * 3600 * 1000); // the one closed session
  });

  it("ignores a negative span rather than averaging an impossibility", () => {
    // Clock skew or a bad close can land closed_at before opened_at.
    const s = timingStats([
      till({ opened_at: "2026-09-18T06:00:00Z", closed_at: "2026-09-18T14:00:00Z" }),
      till({ opened_at: "2026-09-18T09:00:00Z", closed_at: "2026-09-18T08:00:00Z" }),
    ]);
    expect(s.avgDurationMs).toBe(8 * 3600 * 1000);
  });

  it("has no average length when nothing has closed", () => {
    const s = timingStats([till({ closed_at: null, status: "open" })]);
    expect(s.avgDurationMs).toBeNull();
    expect(s.avgClose).toBeNull();
  });
});
