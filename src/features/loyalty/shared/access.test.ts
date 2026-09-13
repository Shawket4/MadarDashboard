import { describe, expect, it } from "vitest";

import { loyaltyAccess } from "./access";

describe("loyalty access mirrors the server's guards", () => {
  it("lets only admins adjust or forget", () => {
    for (const role of ["org_admin", "super_admin"]) expect(loyaltyAccess(role).canAdjust).toBe(true);
    for (const role of ["branch_manager", "teller", "waiter", undefined]) {
      expect(loyaltyAccess(role).canAdjust).toBe(false);
      expect(loyaltyAccess(role).canForget).toBe(false);
    }
  });

  it("lets managers list members and edit the program, but not tellers", () => {
    expect(loyaltyAccess("branch_manager")).toMatchObject({ canListMembers: true, canEditProgram: true });
    expect(loyaltyAccess("teller")).toMatchObject({ canListMembers: false, canEditProgram: false });
  });

  it("keeps wallet diagnostics for super admins", () => {
    expect(loyaltyAccess("org_admin").canInspectWallet).toBe(false);
    expect(loyaltyAccess("super_admin").canInspectWallet).toBe(true);
  });
});
