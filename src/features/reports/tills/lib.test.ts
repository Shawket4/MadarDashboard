import { AxiosError, type AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n";
import { useAppStore } from "@/data/stores/app.store";
import { MOCK_TILL_SESSIONS } from "@/data/api/mock/data";
import {
  byHour, fmtBusinessDate, fmtMinutesOfDay, isRangeRefused, meanTimeOfDay, minutesOfDay, salesStats, timingStats,
} from "./lib";
import type { TillSessionRow } from "@/data/api/generated/models";

let seq = 0;
const till = (p: Partial<TillSessionRow> = {}): TillSessionRow => ({
  till_id: `till-${++seq}`,
  business_date: "2026-09-18",
  branch_id: "branch-1",
  branch_name: "Zamalek",
  branch_code: "ZAM",
  teller_id: "teller-1",
  teller_name: "Nour",
  opened_at: "2026-09-18T06:00:00Z",
  status: "closed",
  opening_cash: 50000,
  net_cash_payment: 0,
  pay_ins: 0,
  pay_outs: 0,
  cash_drops: 0,
  cash_adjustments: 0,
  closing_cash_declared: null,
  closing_cash_system: null,
  cash_discrepancy: null,
  closed_at: "2026-09-18T14:00:00Z",
  orders_count: 0,
  net_sales: 0,
  ...p,
});

const setTz = (tz: string) => useAppStore.setState({ activeTimezone: tz });
beforeEach(async () => {
  await i18n.changeLanguage("en");
  setTz("Africa/Cairo");
});
afterEach(() => setTz("Africa/Cairo"));

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

  it("formats minutes past midnight on the app's 12-hour clock, in the app language", async () => {
    // The same shape the table's opened-at column uses — not a 24-hour dialect.
    expect(fmtMinutesOfDay(0)).toBe("12:00 AM");
    expect(fmtMinutesOfDay(7 * 60 + 5)).toBe("07:05 AM");
    expect(fmtMinutesOfDay(19 * 60 + 5)).toBe("07:05 PM");
    expect(fmtMinutesOfDay(null)).toBe("—");
    await i18n.changeLanguage("ar");
    expect(fmtMinutesOfDay(19 * 60 + 5)).toBe("07:05 م");
  });
});

describe("salesStats", () => {
  it("averages the bill over orders, not over tills", () => {
    const s = salesStats([
      till({ orders_count: 3, net_sales: 300 }),
      till({ orders_count: 1, net_sales: 100 }),
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

describe("the branch's clock, not the browser's", () => {
  it("reads the hour of an open in the active timezone", () => {
    // 22:30 UTC is 01:30 the next morning in Cairo (UTC+3 in September).
    expect(minutesOfDay("2026-09-18T22:30:00Z")).toBe(90);
    setTz("America/New_York");
    expect(minutesOfDay("2026-09-18T22:30:00Z")).toBe(18 * 60 + 30);
  });

  it("buckets a session that runs past midnight into the hours it opened and closed", () => {
    const b = byHour([till({ opened_at: "2026-09-18T19:10:00Z", closed_at: "2026-09-18T23:40:00Z" })]);
    expect(b[22].opened).toBe(1); // 22:10 Cairo
    expect(b[2].closed).toBe(1); // 02:40 Cairo, the next calendar day
    expect(b.reduce((n, h) => n + h.opened + h.closed, 0)).toBe(2);
  });

  it("measures a session across midnight as one span", () => {
    const s = timingStats([till({ opened_at: "2026-09-18T20:50:00Z", closed_at: "2026-09-18T23:10:00Z" })]);
    expect(s.avgDurationMs).toBe(140 * 60_000);
    expect(s.longest?.opened_at).toBe("2026-09-18T20:50:00Z");
  });

  it("keeps a business date on its own day in every zone", () => {
    // `new Date("2026-09-18")` is midnight UTC — the 17th anywhere west of it.
    expect(fmtBusinessDate("2026-09-18")).toMatch(/18 Sept? 2026/);
    setTz("America/Los_Angeles");
    expect(fmtBusinessDate("2026-09-18")).toMatch(/18 Sept? 2026/);
    setTz("Pacific/Kiritimati"); // UTC+14
    expect(fmtBusinessDate("2026-09-18")).toMatch(/18 Sept? 2026/);
    expect(fmtBusinessDate("not a date")).toBe("—");
  });
});

describe("isRangeRefused", () => {
  const http = (status: number) =>
    new AxiosError("x", "ERR", undefined, undefined, { status, data: {} } as AxiosResponse);

  it("is the 400 the API answers an over-long range with, and nothing else", () => {
    expect(isRangeRefused(http(400))).toBe(true);
    expect(isRangeRefused(http(403))).toBe(false);
    expect(isRangeRefused(http(500))).toBe(false);
    expect(isRangeRefused(new Error("offline"))).toBe(false);
    expect(isRangeRefused(null)).toBe(false);
  });
});

describe("mock till sessions", () => {
  it("add up the way the API's rows do", () => {
    // opening + net cash + pay-ins − pay-outs − drops + adjustments = expected.
    for (const r of MOCK_TILL_SESSIONS) {
      if (r.closing_cash_system == null) continue;
      expect(
        r.opening_cash + r.net_cash_payment + r.pay_ins - r.pay_outs - r.cash_drops + r.cash_adjustments,
      ).toBe(r.closing_cash_system);
      if (r.closing_cash_declared != null) {
        expect(r.closing_cash_declared - r.closing_cash_system).toBe(r.cash_discrepancy);
      }
    }
  });
});
