import { describe, expect, it } from "vitest";

import {
  birthdayBounds,
  birthdayComplete,
  clampBirthday,
  daysIn,
  formatBirthday,
  limits,
  monthNames,
  partOrder,
  startingBirthday,
  typeaheadIndex,
} from "./birthday";

/** A fixed "today": 23 October 2026. */
const TODAY = new Date(2026, 9, 23);
const bounds = birthdayBounds(TODAY);

describe("daysIn", () => {
  it("gives February 29 days unless a common year says otherwise", () => {
    expect(daysIn(2)).toBe(29); // no year: someone born on the 29th can say so
    expect(daysIn(2, null)).toBe(29);
    expect(daysIn(2, 2024)).toBe(29);
    expect(daysIn(2, 2023)).toBe(28);
    expect(daysIn(2, 1900)).toBe(28); // a century is not a leap year...
    expect(daysIn(2, 2000)).toBe(29); // ...unless it divides by 400
  });

  it("knows the thirty-day months", () => {
    expect([4, 6, 9, 11].map((m) => daysIn(m))).toEqual([30, 30, 30, 30]);
    expect([1, 3, 5, 7, 8, 10, 12].map((m) => daysIn(m))).toEqual([31, 31, 31, 31, 31, 31, 31]);
  });
});

describe("birthdayComplete", () => {
  it("treats half a birthday as no birthday", () => {
    expect(birthdayComplete({ month: 3, day: null })).toBe(false);
    expect(birthdayComplete({ month: null, day: 17 })).toBe(false);
    expect(birthdayComplete({ month: null, day: null })).toBe(false);
    expect(birthdayComplete({ month: 3, day: 17 })).toBe(true);
  });
});

describe("bounds", () => {
  it("offers the last 110 years, newest this one", () => {
    expect(bounds).toEqual({ minYear: 1916, maxYear: 2026, today: { y: 2026, m: 10, d: 23 } });
  });

  it("never lets the newest year be in the future", () => {
    expect(birthdayBounds(TODAY, 1950, 2040).maxYear).toBe(2026);
  });

  it("stops this year at today", () => {
    expect(limits(2026, 10, bounds.today)).toEqual({ maxMonth: 10, maxDay: 23 });
    expect(limits(2026, 9, bounds.today)).toEqual({ maxMonth: 10, maxDay: 30 });
    expect(limits(2025, 12, bounds.today)).toEqual({ maxMonth: 12, maxDay: 31 });
    expect(limits(null, 12, bounds.today)).toEqual({ maxMonth: 12, maxDay: 31 });
  });
});

describe("clampBirthday", () => {
  it("pulls a day back inside its month", () => {
    expect(clampBirthday({ month: 4, day: 31, year: null }, bounds)).toEqual({ month: 4, day: 30, year: null });
    expect(clampBirthday({ month: 2, day: 31, year: null }, bounds)).toEqual({ month: 2, day: 29, year: null });
    expect(clampBirthday({ month: 2, day: 29, year: 2023 }, bounds)).toEqual({ month: 2, day: 28, year: 2023 });
  });

  it("keeps a year inside the offered years", () => {
    expect(clampBirthday({ month: 1, day: 1, year: 1800 }, bounds).year).toBe(1916);
  });

  it("never lands after today", () => {
    expect(clampBirthday({ month: 12, day: 25, year: 2026 }, bounds)).toEqual({ month: 10, day: 23, year: 2026 });
    expect(clampBirthday({ month: 10, day: 30, year: 2026 }, bounds)).toEqual({ month: 10, day: 23, year: 2026 });
  });
});

describe("startingBirthday", () => {
  it("opens on today's month and day, like a phone's own picker", () => {
    expect(startingBirthday({ month: null, day: null }, "none", bounds)).toEqual({ month: 10, day: 23, year: null });
  });

  it("starts an optional year on no year, so a year is only given on purpose", () => {
    expect(startingBirthday({ month: null, day: null }, "optional", bounds).year).toBeNull();
  });

  it("starts a required year thirty years back", () => {
    expect(startingBirthday({ month: null, day: null }, "required", bounds).year).toBe(1996);
  });

  it("opens on what was picked before", () => {
    expect(startingBirthday({ month: 3, day: 17, year: 1990 }, "optional", bounds)).toEqual({ month: 3, day: 17, year: 1990 });
    // A field that asks no year drops one it was handed.
    expect(startingBirthday({ month: 3, day: 17, year: 1990 }, "none", bounds)).toEqual({ month: 3, day: 17, year: null });
  });
});

describe("reading a birthday", () => {
  it("orders the wheels the way the language writes a date", () => {
    expect(partOrder("en-GB")).toEqual(["day", "month", "year"]);
    expect(partOrder("en-US")).toEqual(["month", "day", "year"]);
    expect(partOrder("ar-EG")).toEqual(["day", "month", "year"]);
  });

  it("names the months in the page's language", () => {
    expect(monthNames("en-GB")).toHaveLength(12);
    expect(monthNames("en-GB")[0]).toBe("January");
    expect(monthNames("ar-EG")[0]).toBe("يناير");
  });

  it("writes it back in words, with Western digits in both languages", () => {
    expect(formatBirthday({ month: 3, day: 17 }, "en-GB")).toBe("17 March");
    expect(formatBirthday({ month: 3, day: 17, year: 1990 }, "en-GB")).toBe("17 March 1990");
    expect(formatBirthday({ month: 2, day: 29 }, "en-GB")).toBe("29 February");
    expect(formatBirthday({ month: 3, day: 17 }, "ar-EG")).toBe("17 مارس");
    expect(formatBirthday({ month: null, day: null }, "en-GB")).toBe("");
  });
});

describe("typeaheadIndex", () => {
  const months = monthNames("en-GB");
  it("finds a month by its first letters", () => {
    expect(typeaheadIndex(months, "ma")).toBe(2); // March
    expect(typeaheadIndex(months, "May")).toBe(4);
    expect(typeaheadIndex(months, "x")).toBe(-1);
  });

  it("finds a day typed in Arabic-Indic digits", () => {
    const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
    expect(typeaheadIndex(days, "١٧")).toBe(16);
  });
});
