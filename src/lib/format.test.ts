import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n";
import { useAppStore } from "@/data/stores/app.store";
import { fmtElapsedMs, fmtMoney, fmtMoneySigned, fmtStamp, fmtNumber } from "./format";

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

  it("stamps are 24h in the branch timezone", async () => {
    await setLang("en");
    const now = new Date("2026-09-12T20:00:00Z"); // 23:00 Cairo
    expect(fmtStamp("2026-09-12T15:02:00Z", now)).toBe("18:02");
    expect(fmtStamp("2026-09-10T15:02:00Z", now)).toMatch(/10 Sept?\s·\s18:02/);
    expect(fmtStamp("2025-12-31T21:30:00Z", now)).toMatch(/31 Dec 2025\s·\s23:30/);
  });
});
