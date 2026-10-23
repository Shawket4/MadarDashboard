import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

import { passwordStrength, signupAttribution, signupProblem } from "./util";

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
});

describe("signupAttribution", () => {
  it("keeps only the campaign tags, trimmed, and nothing when there are none", () => {
    expect(signupAttribution("?lang=ar&utm_source=%20ig%20&utm_medium=&fbclid=Iw1&x=1")).toEqual({ utm_source: "ig", fbclid: "Iw1" });
    expect(signupAttribution("?lang=en")).toBeUndefined();
  });
});
