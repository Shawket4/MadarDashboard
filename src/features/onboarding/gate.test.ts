/**
 * The POS first-run gate (the /onboarding wizard) is for an owner whose org
 * sells with Madar POS. A Dawam-only owner has no menu, tills or payment
 * methods to set up; their first run is Staff ▸ Set-up (E2E D-008 / SA-4).
 */
import { describe, expect, it } from "vitest";

import { sendsToOnboarding } from "./gate";

describe("sendsToOnboarding", () => {
  const base = { role: "org_admin", skipped: false, modules: ["pos", "dawam"], modulesKnown: true, completed: false };

  it("sends a POS owner with an unfinished checklist to the wizard", () => {
    expect(sendsToOnboarding(base)).toBe(true);
  });

  it("never sends a Dawam-only owner into the POS wizard", () => {
    expect(sendsToOnboarding({ ...base, modules: ["dawam"] })).toBe(false);
  });

  it("waits for the modules before deciding, and respects skip, completion and role", () => {
    expect(sendsToOnboarding({ ...base, modulesKnown: false, modules: [] })).toBe(false);
    expect(sendsToOnboarding({ ...base, skipped: true })).toBe(false);
    expect(sendsToOnboarding({ ...base, completed: true })).toBe(false);
    expect(sendsToOnboarding({ ...base, completed: undefined })).toBe(false);
    expect(sendsToOnboarding({ ...base, role: "branch_manager" })).toBe(false);
  });
});
