import { describe, expect, it } from "vitest";

import { signupEnabled, signupOpen } from "./flag";

describe("signup flag", () => {
  it("is off unless the build says 1 or true", () => {
    for (const v of [undefined, "", "0", "false", "yes", "TRUE"]) expect(signupEnabled(v), String(v)).toBe(false);
    expect(signupEnabled("1")).toBe(true);
    expect(signupEnabled("true")).toBe(true);
  });

  it("while off, only the preview key opens the page", () => {
    expect(signupOpen(undefined, false)).toBe(false);
    expect(signupOpen("0", false)).toBe(false);
    expect(signupOpen("1", false)).toBe(true);
    expect(signupOpen(undefined, true)).toBe(true);
  });

  it("is off in this repo's committed env (.env points at prod and never sets it)", () => {
    expect(signupEnabled()).toBe(false);
  });
});
