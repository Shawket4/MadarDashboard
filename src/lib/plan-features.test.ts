import { afterEach, describe, expect, it } from "vitest";

import { orgHasFeature, setOrgAddons } from "./plan-features";

afterEach(() => setOrgAddons([]));

describe("orgHasFeature: the plan's features plus the org's add-ons", () => {
  it("Free has no loyalty until the add-on is on, and only loyalty", () => {
    expect(orgHasFeature("free", "loyalty")).toBe(false);
    setOrgAddons(["loyalty"]);
    expect(orgHasFeature("free", "loyalty")).toBe(true);
    expect(orgHasFeature("free", "inventory")).toBe(false);
  });
  it("paid has it either way, and an unknown plan reads as paid", () => {
    expect(orgHasFeature("paid", "loyalty")).toBe(true);
    expect(orgHasFeature(null, "loyalty")).toBe(true);
  });
});
