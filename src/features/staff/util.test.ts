/**
 * Labour limits are hours (RU-13): a week of 56 h read "2d 08h of 2d 00h"
 * in the schedule's warning (E2E). They count in hours and minutes, never days.
 */
import { describe, expect, it } from "vitest";
import i18n from "@/i18n";
import { fmtHours } from "./util";

describe("fmtHours", () => {
  it("counts hours past a day, never days", async () => {
    await i18n.changeLanguage("en");
    expect(fmtHours(56 * 60)).toBe("56h");
    expect(fmtHours(48 * 60)).toBe("48h");
    expect(fmtHours(10 * 60 + 30)).toBe("10h 30m");
    expect(fmtHours(45)).toBe("45m");
  });
  it("in Arabic, the same with Arabic units, kept left-to-right", async () => {
    await i18n.changeLanguage("ar");
    expect(fmtHours(56 * 60)).toBe("⁦56 س⁩");
    expect(fmtHours(10 * 60 + 30)).toBe("⁦10 س 30 د⁩");
    await i18n.changeLanguage("en");
  });
});

/**
 * "Today" is the branch's calendar day (AT-1), not UTC's: between midnight
 * and 03:00 Cairo summer time `toISOString()` still says yesterday, so the
 * Attendance window and every "today" default hid the new day (E2E, team).
 */
describe("todayIso / isoDaysFromToday", () => {
  it("use the active zone's calendar day, not UTC's", async () => {
    const { vi } = await import("vitest");
    const { useAppStore } = await import("@/data/stores/app.store");
    const { todayIso, isoDaysFromToday } = await import("./util");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-24T22:30:00Z")); // 01:30 on 25 Sep in Cairo (UTC+3)
    const before = useAppStore.getState().activeTimezone;
    useAppStore.setState({ activeTimezone: "Africa/Cairo" });
    try {
      expect(todayIso()).toBe("2026-09-25");
      expect(isoDaysFromToday(0)).toBe("2026-09-25");
      expect(isoDaysFromToday(-6)).toBe("2026-09-19");
      expect(isoDaysFromToday(35)).toBe("2026-10-30");
    } finally {
      useAppStore.setState({ activeTimezone: before });
      vi.useRealTimers();
    }
  });
});
