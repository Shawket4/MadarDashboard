import { describe, expect, it } from "vitest";

import { currentYear, displayLocale } from "./dates";

describe("currentYear", () => {
  const midYear = new Date("2026-06-15T12:00:00Z");

  it("writes the year in the page's numerals", () => {
    expect(currentYear("en", midYear)).toBe("2026");
    expect(currentYear("ar", midYear)).toBe("٢٠٢٦");
    expect(currentYear("ar-EG", midYear)).toBe("٢٠٢٦");
  });

  it("follows Cairo's calendar, not the visitor's", () => {
    // 22:30 UTC on New Year's Eve is already 00:30 on 1 January in Cairo.
    expect(currentYear("en", new Date("2026-12-31T22:30:00Z"))).toBe("2027");
    expect(currentYear("en", new Date("2026-12-31T21:30:00Z"))).toBe("2026");
  });

  it("is never a fixed number: it moves with the clock", () => {
    expect(currentYear("en", new Date("2031-03-01T00:00:00Z"))).toBe("2031");
  });
});

describe("displayLocale", () => {
  it("is Egyptian Arabic for Arabic pages and English otherwise", () => {
    expect(displayLocale("ar")).toBe("ar-EG");
    expect(displayLocale("en-US")).toBe("en-GB");
  });
});
