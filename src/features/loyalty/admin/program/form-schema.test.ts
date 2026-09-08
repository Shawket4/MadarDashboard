import { describe, expect, it } from "vitest";

import type { LoyaltySettings } from "@/data/api/generated/models";

import { fromWire, previewOf, toWire } from "./form-schema";

const saved: LoyaltySettings = {
  org_id: "org-1",
  branch_id: null,
  enabled: true,
  program_name: "Bean Club",
  program_name_ar: "نادي البن",
  mode: "visits",
  earn_piastres_per_point: 1000,
  earn_on_discounted: true,
  earn_include_tax: false,
  default_reward_cost: 5,
  require_otp: true,
  reward_any_item: false,
  birthday_enabled: true,
  birthday_reward_amount: 2,
  birthday_message: "Happy birthday {name}",
  birthday_message_ar: "كل سنة وأنت طيب",
  terms: "One per visit",
  terms_ar: "واحدة لكل زيارة",
};

const scope = { orgId: "org-1", branchId: null };

describe("the program form's wire mapping", () => {
  it("round-trips everything the form shows", () => {
    const out = toWire(fromWire(saved), scope, saved);
    expect(out.program_name).toBe("Bean Club");
    expect(out.mode).toBe("visits");
    expect(out.default_reward_cost).toBe(5);
    expect(out.birthday_reward_amount).toBe(2);
    expect(out.birthday_message).toBe("Happy birthday {name}");
    expect(out.reward_any_item).toBe(false);
  });

  it("keeps the fields the form does not show", () => {
    // `terms_ar` has no input on this screen. Building a body only from what is
    // on screen silently clears it — which is exactly how it came to be nulled
    // by a form that never displayed it.
    const out = toWire(fromWire(saved), scope, saved);
    expect(out.terms_ar).toBe("واحدة لكل زيارة");
  });

  it("converts money in one direction only", () => {
    // Piastres on the wire, EGP on screen. A rate that survives a save
    // unchanged is the whole requirement.
    const v = fromWire(saved);
    expect(v.earn_egp_per_point).toBe(10);
    expect(toWire(v, scope, saved).earn_piastres_per_point).toBe(1000);
  });

  it("defaults a flag the server may not send", () => {
    // `reward_any_item` is optional on the wire so older clients keep working.
    // Reading it as `undefined` would send `undefined` straight back.
    const older = { ...saved, reward_any_item: undefined } as LoyaltySettings;
    expect(fromWire(older).reward_any_item).toBe(false);
    expect(toWire(fromWire(older), scope, older).reward_any_item).toBe(false);
  });

  it("clears the birthday settings when birthdays are switched off", () => {
    // Otherwise turning the feature back on a year later silently restores a
    // gift and a message nobody remembers configuring.
    const v = { ...fromWire(saved), birthday_enabled: false };
    const out = toWire(v, scope, saved);
    expect(out.birthday_enabled).toBe(false);
    expect(out.birthday_reward_amount).toBeNull();
    expect(out.birthday_message).toBeNull();
    expect(out.birthday_message_ar).toBeNull();
  });

  it("treats an empty gift as no gift, not as zero", () => {
    const v = { ...fromWire(saved), birthday_reward_amount: "" };
    expect(toWire(v, scope, saved).birthday_reward_amount).toBeNull();
  });

  it("sends empty optional text as null rather than an empty string", () => {
    const v = { ...fromWire(saved), program_name_ar: "", terms: "" };
    const out = toWire(v, scope, saved);
    expect(out.program_name_ar).toBeNull();
    expect(out.terms).toBeNull();
  });

  it("carries the scope it is saving to", () => {
    const out = toWire(fromWire(saved), { orgId: "org-1", branchId: "b-9" }, saved);
    expect(out.org_id).toBe("org-1");
    expect(out.branch_id).toBe("b-9");
  });

  it("previews what saving would send, not what was last saved", () => {
    const v = { ...fromWire(saved), birthday_message: "Edited {name}" };
    expect(previewOf(v, saved)?.birthday_message).toBe("Edited {name}");
    // Nothing to preview when the feature is off, or before anything loaded.
    expect(previewOf({ ...v, birthday_enabled: false }, saved)).toBeNull();
    expect(previewOf(v, undefined)).toBeNull();
  });
});
