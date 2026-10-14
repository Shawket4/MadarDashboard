/**
 * Plan gating of the nav (madar-plan): a Free org does not see, and cannot
 * open by URL, the pages of a feature its plan lacks. An unknown plan reads as
 * Paid, so nothing is hidden on a guess.
 */
import { describe, expect, it } from "vitest";

import { authzFrom } from "@/data/authz/use-authz";
import { FEATURES } from "@/generated/plans";

import { NAV, featureOfPath, isParent, leafVisible, type NavLeaf } from "./nav";

const everything = authzFrom(null, { platform: true });
const leaves: NavLeaf[] = NAV.flatMap((g) => g.entries.flatMap((e) => (isParent(e) ? e.children : [e])));
const shown = (plan: string | null | undefined) =>
  leaves.filter((l) => leafVisible(l, everything, ["pos", "dawam"], false, plan)).map((l) => l.to);

describe("nav features", () => {
  it("only names features the plan spec knows", () => {
    for (const l of leaves) if (l.feature) expect(FEATURES, l.to).toContain(l.feature);
  });

  it("a Free org loses bookings, inventory, loyalty, Basira, kitchen setup and Dawam", () => {
    const free = shown("free");
    for (const p of ["/bookings", "/inventory/today", "/inventory/ingredients", "/reports/loyalty", "/basira", "/branch-setup", "/staff/employees", "/menu/bases"]) {
      expect(free, p).not.toContain(p);
    }
  });

  it("a Free org keeps selling, the floor, the menu, tills, discounts, reports and settings", () => {
    const free = shown("free");
    for (const p of ["/", "/orders", "/tills", "/menu/items", "/discounts", "/reports/operations", "/settings", "/branches", "/devices"]) {
      expect(free, p).toContain(p);
    }
  });

  it("a paid or unknown plan hides nothing", () => {
    const all = shown("paid");
    expect(shown(null)).toEqual(all);
    expect(shown(undefined)).toEqual(all);
    expect(all).toContain("/floor");
    expect(all).toContain("/inventory/today");
  });

  it("the URL of a gated page names its feature, detail routes and aliases included", () => {
    expect(featureOfPath("/floor")).toBe("floor");
    expect(featureOfPath("/inventory/counts/abc")).toBe("inventory");
    expect(featureOfPath("/inventory")).toBe("inventory");
    expect(featureOfPath("/settings/brand/")).toBe("branding");
    expect(featureOfPath("/staff/employees")).toBe("dawam");
    expect(featureOfPath("/orders")).toBeUndefined();
    expect(featureOfPath("/settings")).toBeUndefined();
    expect(featureOfPath("/settings/payment-methods")).toBeUndefined();
  });
});
