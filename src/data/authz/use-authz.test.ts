/**
 * `canEverywhere`: a capability held at EVERY branch (B-SETUP-3), what an
 * org-wide act needs — a department, a shift block, a public holiday. A
 * branch manager holds hr.staff.create at their branch only.
 */
import { describe, expect, it } from "vitest";

import { authzFrom } from "./use-authz";

const me = (caps: string[], everywhere?: string[] | null) => ({
  user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [],
  capabilities: caps as never, ask_manager: [], limits: {}, everywhere: everywhere as never,
});

describe("canEverywhere", () => {
  it("is what the server lists as held at every branch", () => {
    const k = authzFrom(me(["hr.staff.create"], []));
    expect(k.can("hr.staff.create" as never)).toBe(true);
    expect(k.canEverywhere("hr.staff.create" as never)).toBe(false);
    expect(authzFrom(me(["hr.staff.create"], ["hr.staff.create"])).canEverywhere("hr.staff.create" as never)).toBe(true);
  });

  it("falls back to the plain check on a backend that doesn't send the list", () => {
    expect(authzFrom(me(["hr.staff.create"])).canEverywhere("hr.staff.create" as never)).toBe(true);
    expect(authzFrom(me([], null)).canEverywhere("hr.staff.create" as never)).toBe(false);
  });

  it("is always true for Madar staff", () => {
    expect(authzFrom(null, { platform: true }).canEverywhere("hr.staff.delete" as never)).toBe(true);
  });
});
