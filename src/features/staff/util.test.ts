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
