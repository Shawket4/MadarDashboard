/**
 * Copy the team E2E caught: the late-arrival field label read "arriving by"
 * (lower case), and the advance review promised "Above the cap it waits for
 * the owner" while the server refuses a manager outright (409
 * ADVANCE_OVER_CAP) and leaves the ask pending for the owner.
 */
import { describe, expect, it } from "vitest";
import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";

describe("E2E team copy", () => {
  it("labels start with a capital", () => {
    expect(en.staff.arrivingBy).toBe("Arriving by");
  });
  it("the advance review says only the owner can approve above the cap", () => {
    expect(en.dawam.reviewAdvanceHint).not.toMatch(/waits for the owner/);
    expect(en.dawam.reviewAdvanceHint).toMatch(/only the owner/);
    expect(ar.dawam.reviewAdvanceHint).toMatch(/المالك/);
    expect(ar.dawam.reviewAdvanceHint).not.toMatch(/ينتظر المالك/);
  });
});
