import { describe, expect, it } from "vitest";

import {
  endsNextDay, formatSpan, formatTime, hhmmOf, minutesOf, nearestSlot, parseTime, slots, spanMinutes, suggestEnd, toHHMM, toWire,
} from "./time";
import { parseNumber } from "./number";
import { quickRange } from "./date-field";
import { phoneProblem } from "./phone-field";
import { summarizeDays } from "./weekday-picker";

describe("parseTime", () => {
  it.each([
    ["9", "09:00"],
    ["09", "09:00"],
    ["930", "09:30"],
    ["0930", "09:30"],
    ["2130", "21:30"],
    ["17", "17:00"],
    ["9:30", "09:30"],
    ["9.30", "09:30"],
    ["9 30", "09:30"],
    [" 21:05 ", "21:05"],
    ["0", "00:00"],
    ["24:00", "00:00"],
    ["2400", "00:00"],
  ])("reads %j on the 24-hour clock as %s", (text, want) => {
    expect(parseTime(text)).toBe(want);
  });

  it.each([
    ["9p", "21:00"],
    ["9pm", "21:00"],
    ["9 PM", "21:00"],
    ["9:30 p.m.", "21:30"],
    ["930pm", "21:30"],
    ["9a", "09:00"],
    ["12am", "00:00"],
    ["12:15 am", "00:15"],
    ["12pm", "12:00"],
    ["12:45 PM", "12:45"],
  ])("reads the meridiem in %j as %s", (text, want) => {
    expect(parseTime(text)).toBe(want);
  });

  it("reads Arabic: Arabic-Indic digits and ص/م", () => {
    expect(parseTime("٩:٣٠ م")).toBe("21:30");
    expect(parseTime("٩٣٠")).toBe("09:30");
    expect(parseTime("9:30 ص")).toBe("09:30");
    expect(parseTime("12 ص")).toBe("00:00");
    expect(parseTime("5 مساء")).toBe("17:00");
    expect(parseTime("۱۰:۱۵")).toBe("10:15"); // Persian digits too
  });

  it.each(["", "  ", "abc", "9x", "25", "2460", "9:60", "961", "13pm", "0am", "9:3", "12345", "9::30", "-1"])(
    "refuses %j",
    (text) => {
      expect(parseTime(text)).toBeNull();
    },
  );

  it("round-trips its own 12-hour output in both languages", () => {
    for (const hhmm of slots(15)) {
      expect(parseTime(formatTime(hhmm, { lang: "en" }))).toBe(hhmm);
      expect(parseTime(formatTime(hhmm, { lang: "ar" }))).toBe(hhmm);
      expect(parseTime(formatTime(hhmm, { hourCycle: "h23" }))).toBe(hhmm);
    }
  });
});

describe("formatTime", () => {
  it("12-hour with Latin digits in English and Arabic", () => {
    expect(formatTime("21:30", { lang: "en" })).toBe("09:30 PM");
    expect(formatTime("09:05", { lang: "en" })).toBe("09:05 AM");
    expect(formatTime("00:00", { lang: "en" })).toBe("12:00 AM");
    expect(formatTime("12:00", { lang: "en" })).toBe("12:00 PM");
    expect(formatTime("21:30", { lang: "ar" })).toBe("09:30 م");
    expect(formatTime("09:30:00", { lang: "ar" })).toBe("09:30 ص");
  });
  it("24-hour when asked", () => {
    expect(formatTime("21:30", { hourCycle: "h23" })).toBe("21:30");
  });
  it("nothing for no time", () => {
    expect(formatTime("")).toBe("");
    expect(formatTime(null)).toBe("");
    expect(formatTime("nope")).toBe("");
  });
});

describe("wire helpers", () => {
  it("toHHMM drops the API's seconds and refuses junk", () => {
    expect(toHHMM("22:00:00")).toBe("22:00");
    expect(toHHMM("7:05")).toBe("07:05");
    expect(toHHMM("25:00")).toBe("");
    expect(toHHMM(undefined)).toBe("");
  });
  it("toWire adds seconds", () => {
    expect(toWire("09:30")).toBe("09:30:00");
    expect(toWire("")).toBe("");
  });
  it("minutesOf / hhmmOf wrap around the day", () => {
    expect(minutesOf("01:30")).toBe(90);
    expect(hhmmOf(-30)).toBe("23:30");
    expect(hhmmOf(24 * 60 + 15)).toBe("00:15");
  });
  it("slots and nearestSlot", () => {
    expect(slots(15)).toHaveLength(96);
    expect(slots(30)[1]).toBe("00:30");
    expect(nearestSlot(9 * 60 + 8)).toBe("09:15");
    expect(nearestSlot(23 * 60 + 58)).toBe("00:00");
  });
});

describe("overnight handling", () => {
  it("a same-day shift", () => {
    expect(spanMinutes("09:00", "17:00")).toBe(480);
    expect(endsNextDay("09:00", "17:00")).toBe(false);
  });
  it("an end before the start runs into the next day, not an error", () => {
    expect(spanMinutes("22:00", "06:00")).toBe(480);
    expect(endsNextDay("22:00", "06:00")).toBe(true);
    expect(spanMinutes("16:00", "00:00")).toBe(480);
    expect(endsNextDay("16:00", "00:00")).toBe(true);
    expect(spanMinutes("16:00", "01:00")).toBe(540);
  });
  it("the same time twice is zero, never a 24-hour shift", () => {
    expect(spanMinutes("09:00", "09:00")).toBe(0);
    expect(endsNextDay("09:00", "09:00")).toBe(false);
  });
  it("missing ends are unknown", () => {
    expect(spanMinutes("", "09:00")).toBeNull();
    expect(spanMinutes("09:00", null)).toBeNull();
  });
  it("spots 9-to-5 typed as 09:00 → 05:00 and offers 17:00", () => {
    expect(suggestEnd("09:00", "05:00")).toBe("17:00");
    expect(suggestEnd("08:30", "04:30")).toBe("16:30");
  });
  it("leaves a real night shift alone", () => {
    expect(suggestEnd("22:00", "06:00")).toBeNull();
    expect(suggestEnd("16:00", "01:00")).toBeNull();
    expect(suggestEnd("09:00", "17:00")).toBeNull();
  });
});

describe("formatSpan", () => {
  it("minutes, hours, both, in both languages", () => {
    expect(formatSpan(45)).toBe("45 min");
    expect(formatSpan(480)).toBe("8 h");
    expect(formatSpan(510)).toBe("8 h 30 min");
    expect(formatSpan(510, "ar")).toBe("8 س 30 د");
  });
});

describe("parseNumber", () => {
  it("reads Latin and Arabic digits, separators and decimal marks", () => {
    expect(parseNumber("1,500.5")).toBe(1500.5);
    expect(parseNumber("١٬٥٠٠٫٥")).toBe(1500.5);
    expect(parseNumber(" 12 ")).toBe(12);
    expect(parseNumber(".5")).toBe(0.5);
    expect(parseNumber("−3")).toBe(-3);
  });
  it("refuses what isn't a number", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("12a")).toBeNull();
    expect(parseNumber("1.2.3")).toBeNull();
  });
});

describe("quickRange", () => {
  const tz = "Africa/Cairo";
  const march10 = Date.UTC(2026, 2, 10, 10);
  it("a pay period that starts on the 26th", () => {
    expect(quickRange("this_period", { periodStartDay: 26, now: march10, tz })).toEqual({ from: "2026-02-26", to: "2026-03-25" });
    expect(quickRange("last_period", { periodStartDay: 26, now: march10, tz })).toEqual({ from: "2026-01-26", to: "2026-02-25" });
  });
  it("a calendar-month pay period", () => {
    expect(quickRange("this_period", { periodStartDay: 1, now: march10, tz })).toEqual({ from: "2026-03-01", to: "2026-03-31" });
  });
  it("months and weeks (Saturday first)", () => {
    expect(quickRange("last_month", { now: march10, tz })).toEqual({ from: "2026-02-01", to: "2026-02-28" });
    // 10 March 2026 is a Tuesday; its week starts Saturday 7 March.
    expect(quickRange("this_week", { now: march10, tz })).toEqual({ from: "2026-03-07", to: "2026-03-13" });
  });
});

describe("phoneProblem", () => {
  it("is quiet for a good number or an empty field", () => {
    expect(phoneProblem("")).toBeNull();
    expect(phoneProblem("010 1234 5678")).toBeNull();
    expect(phoneProblem("+20 100 123 4567")).toBeNull();
    expect(phoneProblem("٠١٠١٢٣٤٥٦٧٨")).toBeNull();
  });
  it("says what's wrong", () => {
    expect(phoneProblem("0101234567")).toBe("short");
    expect(phoneProblem("010123456789")).toBe("long");
    expect(phoneProblem("01012345")).toBe("short");
    expect(phoneProblem("hello")).toBe("bad");
  });
});

describe("summarizeDays", () => {
  it("every day, runs and singles in week order", () => {
    expect(summarizeDays([0, 1, 2, 3, 4, 5, 6], "en", "Every day", "No days")).toBe("Every day");
    expect(summarizeDays([], "en", "Every day", "No days")).toBe("No days");
    expect(summarizeDays([6, 0, 1, 2, 3], "en", "E", "N")).toBe("Sat – Wed");
    expect(summarizeDays([4, 5], "en", "E", "N")).toBe("Thu, Fri");
  });
});
