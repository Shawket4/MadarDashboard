import { describe, expect, it } from "vitest";

import { clock } from "./countdown";
import { groupNational, nationalDigits, nationalIssue, phoneFromNational, regionOf } from "./national-phone";

describe("the phone, as typed after +20", () => {
  it("reads every spelling as ten digits", () => {
    for (const raw of ["0100 123 4567", "+20 100 123 4567", "0020 100 123 4567", "201001234567", "1001234567", "٠١٠٠١٢٣٤٥٦٧"])
      expect(nationalDigits(raw), raw).toBe("1001234567");
    expect(nationalDigits("010012345678999")).toBe("1001234567");
    expect(nationalDigits("")).toBe("");
  });
  it("groups for reading", () => {
    expect(groupNational("1001234567")).toBe("100 123 4567");
    expect(groupNational("10012")).toBe("100 12");
    expect(groupNational("")).toBe("");
  });
  it("flags a wrong prefix at once, a short number only when asked", () => {
    expect(nationalIssue("5", false)).toBe("prefix");
    expect(nationalIssue("13", false)).toBe("prefix");
    expect(nationalIssue("10", false)).toBeNull();
    expect(nationalIssue("15012", false)).toBeNull();
    expect(nationalIssue("10012", true)).toBe("short");
    expect(nationalIssue("", true)).toBeNull();
    expect(nationalIssue("1001234567", true)).toBeNull();
  });
  it("sends the canonical number only when it is a whole mobile", () => {
    expect(phoneFromNational("1001234567")).toBe("201001234567");
    expect(phoneFromNational("100123")).toBeNull();
  });
});

describe("the phone, anywhere else", () => {
  it("takes a number after its code, with or without the trunk 0", () => {
    expect(nationalDigits("050 123 4567", "SA")).toBe("501234567");
    expect(nationalDigits("+966 50 123 4567", "SA")).toBe("501234567");
    expect(nationalDigits("07700 900123", "GB")).toBe("7700900123");
    expect(nationalDigits("(202) 555-0143", "US")).toBe("2025550143");
    // Italy keeps its 0: it is part of the number.
    expect(nationalDigits("06 1234 5678", "IT")).toBe("0612345678");
  });
  it("sends the canonical number once code and number make an E.164 phone", () => {
    expect(phoneFromNational("501234567", "SA")).toBe("966501234567");
    expect(phoneFromNational("7700900123", "GB")).toBe("447700900123");
    expect(phoneFromNational("2025550143", "US")).toBe("12025550143");
    expect(phoneFromNational("50123", "SA")).toBeNull();
    expect(nationalIssue("50123", true, "SA")).toBe("short");
    expect(nationalIssue("50123", false, "SA")).toBeNull();
    // No Egyptian prefix rule elsewhere: a UAE mobile starts with 5.
    expect(nationalIssue("5", false, "AE")).toBeNull();
  });
  it("finds the country of a number pasted with its +code", () => {
    expect(regionOf("+966 50 123 4567", "EG")).toBe("SA");
    expect(regionOf("00971501234567", "EG")).toBe("AE");
    expect(regionOf("+1 202 555 0143", "EG")).toBe("US");
    expect(regionOf("+1 416 555 0143", "CA")).toBe("CA");
    expect(regionOf("+20 100 123 4567", "SA")).toBe("EG");
    expect(regionOf("0100 123 4567", "EG")).toBeNull();
  });
});

describe("the resend countdown", () => {
  it("counts down in m:ss", () => {
    expect(clock(58)).toBe("0:58");
    expect(clock(60)).toBe("1:00");
    expect(clock(5)).toBe("0:05");
  });
});
