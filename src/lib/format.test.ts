import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n";
import { useAppStore } from "@/data/stores/app.store";
import { fmtElapsedMs, fmtHour, fmtMoney, fmtMoneySigned, fmtStamp, fmtNumber, fmtWireTime } from "./format";

const setLang = async (l: "en" | "ar") => {
  await i18n.changeLanguage(l);
};

describe("money (POS shape)", () => {
  afterEach(() => setLang("en"));

  it("English: label first, grouped, two decimals, true minus", async () => {
    await setLang("en");
    expect(fmtMoney(123450)).toBe("EGP 1,234.50");
    expect(fmtMoney(-5000)).toBe("−EGP 50.00");
    expect(fmtMoneySigned(2000)).toBe("+EGP 20.00");
    expect(fmtMoney(0)).toBe("EGP 0.00");
    expect(fmtMoney(null)).toBe("—");
    expect(fmtMoney(123456, { maxFractionDigits: 0 })).toBe("EGP 1,235");
  });

  it("Arabic: Western digits, LTR-isolated figure, label after", async () => {
    await setLang("ar");
    expect(fmtMoney(123450)).toBe("⁦1,234.50⁩ ج.م");
    expect(fmtMoney(-5000)).toBe("⁦−50.00⁩ ج.م");
    expect(fmtNumber(1234)).toBe("1,234");
  });
});

describe("elapsed + stamps", () => {
  beforeEach(() => useAppStore.getState().setActiveTimezone("Africa/Cairo"));
  afterEach(() => setLang("en"));

  it("elapsed drops seconds and pads", async () => {
    await setLang("en");
    expect(fmtElapsedMs(0)).toBe("0m");
    expect(fmtElapsedMs(42 * 60_000)).toBe("42m");
    expect(fmtElapsedMs(65 * 60_000)).toBe("1h 05m");
    expect(fmtElapsedMs((27 * 60 + 5) * 60_000)).toBe("1d 03h");
  });

  it("stamps are 12h in the branch timezone", async () => {
    await setLang("en");
    const now = new Date("2026-09-12T20:00:00Z"); // 23:00 Cairo
    expect(fmtStamp("2026-09-12T15:02:00Z", now)).toBe("06:02 PM");
    expect(fmtStamp("2026-09-10T15:02:00Z", now)).toMatch(/10 Sept?\s·\s06:02 PM/);
    expect(fmtStamp("2025-12-31T21:30:00Z", now)).toMatch(/31 Dec 2025\s·\s11:30 PM/);
  });

  it("clock labels are 12h, midnight and noon included", async () => {
    await setLang("en");
    expect(fmtHour(0)).toBe("12:00 AM");
    expect(fmtHour(12)).toBe("12:00 PM");
    expect(fmtHour(13)).toBe("01:00 PM");
    expect(fmtWireTime("00:05")).toBe("12:05 AM");
    expect(fmtWireTime("18:02")).toBe("06:02 PM");
    // Never a 24-hour hour.
    for (let h = 0; h < 24; h++) {
      const hour = Number(fmtHour(h).slice(0, 2));
      expect(hour).toBeGreaterThanOrEqual(1);
      expect(hour).toBeLessThanOrEqual(12);
    }
    // Not a clock time -> untouched.
    expect(fmtWireTime("")).toBe("");
    expect(fmtWireTime("nope")).toBe("nope");
  });

  it("Arabic uses ص / م, with Western figures", async () => {
    await setLang("ar");
    expect(fmtHour(9)).toBe("09:00 ص");
    expect(fmtHour(18)).toBe("06:00 م");
    await setLang("en");
  });
});
