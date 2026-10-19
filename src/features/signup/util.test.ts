import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

import { clock, groupNational, nationalDigits, nationalIssue, passwordStrength, regionOf, signupAttribution, signupPhone, signupProblem } from "./util";

const refusal = (status: number, data: Record<string, unknown>) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });

describe("signupProblem", () => {
  it("tells the server's refusals apart", () => {
    expect(signupProblem(refusal(409, { code: "SIGNUP_PHONE_TAKEN", error: "x" }))).toBe("phone_taken");
    expect(signupProblem(refusal(409, { code: "SIGNUP_EMAIL_TAKEN", error: "x" }))).toBe("email_taken");
    expect(signupProblem(refusal(429, { code: "SIGNUP_OTP_COOLDOWN", error: "x" }))).toBe("cooldown");
    expect(signupProblem(refusal(429, { code: "SIGNUP_OTP_LIMIT", error: "x" }))).toBe("limit");
    expect(signupProblem(refusal(429, { code: "RATE_LIMITED", error: "x" }))).toBe("rate");
    expect(signupProblem(refusal(429, { error: "slow down" }))).toBe("rate");
  });

  it("tells the code refusals and the expired token apart by their codes", () => {
    expect(signupProblem(refusal(400, { code: "SIGNUP_CODE_WRONG", error: "x" }))).toBe("bad_code");
    expect(signupProblem(refusal(400, { code: "SIGNUP_CODE_EXPIRED", error: "x" }))).toBe("code_expired");
    expect(signupProblem(refusal(400, { code: "SIGNUP_CODE_LOCKED", error: "x" }))).toBe("code_locked");
    expect(signupProblem(refusal(400, { code: "SIGNUP_TOKEN_EXPIRED", error: "x" }))).toBe("token_expired");
    expect(signupProblem(refusal(400, { error: "password must be at least 8 characters" }))).toBe("other");
  });

  it("anything else, or a non-HTTP failure, is other", () => {
    expect(signupProblem(refusal(500, { error: "boom" }))).toBe("other");
    expect(signupProblem(new Error("offline"))).toBe("other");
  });
});

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
    expect(signupPhone("1001234567")).toBe("201001234567");
    expect(signupPhone("100123")).toBeNull();
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
    expect(signupPhone("501234567", "SA")).toBe("966501234567");
    expect(signupPhone("7700900123", "GB")).toBe("447700900123");
    expect(signupPhone("2025550143", "US")).toBe("12025550143");
    expect(signupPhone("50123", "SA")).toBeNull();
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

describe("passwordStrength", () => {
  it("grows with length and variety, and never gates", () => {
    expect(passwordStrength("short")).toBe(0);
    expect(passwordStrength("aaaaaaaa")).toBe(1);
    expect(passwordStrength("password1")).toBe(1);
    expect(passwordStrength("correcthorse")).toBe(2);
    expect(passwordStrength("Coffee2024sh")).toBe(3);
    expect(passwordStrength("Coffee2024shop")).toBe(4);
    expect(passwordStrength("correct horse battery 7")).toBe(4);
  });
  it("counts down in m:ss", () => {
    expect(clock(58)).toBe("0:58");
    expect(clock(60)).toBe("1:00");
    expect(clock(5)).toBe("0:05");
  });
});

describe("signupAttribution", () => {
  it("keeps only the campaign tags, trimmed, and nothing when there are none", () => {
    expect(signupAttribution("?lang=ar&utm_source=%20ig%20&utm_medium=&fbclid=Iw1&x=1")).toEqual({ utm_source: "ig", fbclid: "Iw1" });
    expect(signupAttribution("?lang=en")).toBeUndefined();
  });
});
