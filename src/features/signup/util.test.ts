import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

import { signupProblem } from "./util";

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

  it("a 400 about the code is the code; any other 400 is not", () => {
    expect(signupProblem(refusal(400, { error: "Bad request: Incorrect code." }))).toBe("bad_code");
    expect(signupProblem(refusal(400, { error: "No active code — request a new one." }))).toBe("bad_code");
    expect(signupProblem(refusal(400, { error: "password must be at least 8 characters" }))).toBe("other");
  });

  it("anything else, or a non-HTTP failure, is other", () => {
    expect(signupProblem(refusal(500, { error: "boom" }))).toBe("other");
    expect(signupProblem(new Error("offline"))).toBe("other");
  });
});
