import { describe, expect, it } from "vitest";

import { fromDraft, hasLimits, toDraft } from "./limits-button";

describe("limits drafts", () => {
  it("types pounds and percent, stores minor units and basis points", () => {
    expect(fromDraft("max_amount", "50")).toBe(5000);
    expect(toDraft("max_amount", 5000)).toBe("50");
    expect(fromDraft("max_percent", "12.5")).toBe(1250);
    expect(fromDraft("max_age_minutes", "10")).toBe(10);
    expect(fromDraft("max_amount", "")).toBeNull();
  });

  it("an own-only limit counts as limited", () => {
    expect(hasLimits({ own: true })).toBe(true);
    expect(hasLimits({ own: false, max_amount: null })).toBe(false);
  });
});
