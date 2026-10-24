import { describe, expect, it } from "vitest";
import { afterSignIn, isCounterPath, toExternal, toInternal } from "./paths";

describe("the Rewards host's paths", () => {
  it("shows the Rewards pages at the root and back", () => {
    expect(toInternal("/")).toBe("/rewards");
    expect(toInternal("/members/m1")).toBe("/rewards/members/m1");
    expect(toInternal("/login")).toBe("/login");
    expect(toInternal("/counter")).toBe("/counter");
    expect(toInternal("/rewards/card")).toBe("/rewards/card");
    expect(toExternal("/rewards")).toBe("/");
    expect(toExternal("/rewards/members/m1")).toBe("/members/m1");
    expect(toExternal("/login")).toBe("/login");
  });

  it("knows the counter", () => {
    expect(isCounterPath("/counter")).toBe(true);
    expect(isCounterPath("/counter/x")).toBe(true);
    expect(isCounterPath("/counters")).toBe(false);
  });

  it("returns after sign-in to this host only", () => {
    expect(afterSignIn(undefined)).toBe("/rewards");
    expect(afterSignIn("/members?q=sara")).toBe("/rewards/members?q=sara");
    expect(afterSignIn("/rewards/card")).toBe("/rewards/card");
    expect(afterSignIn("//evil.example/x")).toBe("/rewards");
    expect(afterSignIn("/\\evil.example")).toBe("/rewards");
    expect(afterSignIn("https://evil.example")).toBe("/rewards");
    expect(afterSignIn("/login")).toBe("/rewards");
  });
});
