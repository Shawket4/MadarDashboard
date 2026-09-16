import { describe, expect, it } from "vitest";

import { CAPABILITIES } from "@/generated/capabilities";

import { approvalCapabilities, catalogGroups, isCoreFor, metaOf, roleHolds } from "./catalog";

describe("permission screen catalogue", () => {
  it("never shows a legacy capability", () => {
    const shown = catalogGroups().flatMap((g) => [...g.main, ...g.advanced]);
    expect(shown.some((c) => c.tier === "legacy")).toBe(false);
    expect(shown.length).toBe(CAPABILITIES.filter((c) => c.tier !== "legacy").length);
  });

  it("puts advanced capabilities only in the advanced section", () => {
    for (const g of catalogGroups()) {
      expect(g.main.every((c) => c.tier !== "advanced")).toBe(true);
      expect(g.advanced.every((c) => c.tier === "advanced")).toBe(true);
    }
  });

  it("treats core grants as held for their kind even when not stored", () => {
    const signIn = metaOf("pos.sign_in")!;
    expect(isCoreFor(signIn, "teller")).toBe(true);
    expect(roleHolds([], "teller").has(signIn.key)).toBe(true);
    expect(roleHolds([], "kitchen").has(signIn.key)).toBe(false);
  });

  it("offers ask-a-manager only where the registry allows approval", () => {
    expect(approvalCapabilities().every((c) => c.approval)).toBe(true);
  });
});
