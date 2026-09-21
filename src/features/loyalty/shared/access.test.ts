import { describe, expect, it } from "vitest";

import { authzFrom, defaultsFor } from "@/data/authz/use-authz";

import { loyaltyAccess } from "./access";

const as = (role: string) => loyaltyAccess(authzFrom(defaultsFor(role)));

describe("loyalty access follows capabilities", () => {
  it("lets only holders of the adjust/delete capabilities adjust or forget", () => {
    expect(as("org_admin")).toMatchObject({ canAdjust: true, canForget: true });
    for (const role of ["branch_manager", "teller", "waiter"]) {
      expect(as(role)).toMatchObject({ canAdjust: false, canForget: false });
    }
  });

  it("lets managers list members and edit the program by default, but not tellers", () => {
    expect(as("branch_manager")).toMatchObject({ canListMembers: true, canEditProgram: true });
    expect(as("teller").canListMembers).toBe(false);
  });

  it("follows a per-person grant, not the role", () => {
    const me = defaultsFor("teller")!;
    me.capabilities = [...me.capabilities, "loyalty.members.list"];
    expect(loyaltyAccess(authzFrom(me)).canListMembers).toBe(true);
  });

  it("reads the program (on or off, points or orders) with loyalty.read — which the customers family never grants", () => {
    expect(as("teller").canReadProgram).toBe(true);
    const me = defaultsFor("waiter")!;
    me.capabilities = ["customers.view", "customers.edit", "customers.merge"];
    expect(loyaltyAccess(authzFrom(me))).toMatchObject({
      canReadProgram: false,
      canListMembers: false,
      canViewMember: false,
      canAdjust: false,
      canForget: false,
    });
  });

  it("keeps wallet diagnostics for the platform", () => {
    expect(as("org_admin").canInspectWallet).toBe(false);
    expect(loyaltyAccess(authzFrom(null, { platform: true })).canInspectWallet).toBe(true);
  });
});
