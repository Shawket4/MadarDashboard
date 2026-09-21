/**
 * The two capability families meet on one person and neither widens the other.
 */
import { describe, expect, it } from "vitest";

import { authzFrom, defaultsFor } from "@/data/authz/use-authz";

import { canOpenPerson, peopleAccess, peopleSource } from "./access";

const holding = (capabilities: string[]) =>
  peopleAccess(
    authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities, ask_manager: [], limits: {} }),
  );

describe("people access", () => {
  it("only loyalty.members.list: the Members tab from the loyalty endpoint, and no Customers page", () => {
    const a = holding(["loyalty.members.list"]);
    expect(peopleSource(a, true)).toBe("members");
    expect(peopleSource(a, false)).toBeNull();
    expect(a).toMatchObject({ canViewCustomers: false, canEdit: false, canMerge: false, canErase: false, canAdjust: false, canForget: false });
    expect(canOpenPerson(a)).toBe(true);
  });

  it("only customers.view: the Customers page, no Members tab, no loyalty action", () => {
    const a = holding(["customers.view"]);
    expect(peopleSource(a, false)).toBe("customers");
    expect(peopleSource(a, true)).toBeNull();
    expect(a).toMatchObject({ canViewMember: false, canAdjust: false, canForget: false, canReadProgram: false, canInspectWallet: false });
  });

  it("both: the Members tab is the customers list, filtered", () => {
    expect(peopleSource(holding(["customers.view", "loyalty.members.list"]), true)).toBe("customers");
  });

  it("merge is its own capability, not edit's", () => {
    expect(holding(["customers.view", "customers.edit"]).canMerge).toBe(false);
    expect(holding(["customers.view", "customers.merge"])).toMatchObject({ canMerge: true, canEdit: false });
  });

  it("owners and managers merge by default; tellers do not", () => {
    const as = (role: string) => peopleAccess(authzFrom(defaultsFor(role)));
    expect(as("org_admin").canMerge).toBe(true);
    expect(as("branch_manager").canMerge).toBe(true);
    expect(as("teller").canMerge).toBe(false);
  });

  it("with neither family there is nobody to open", () => {
    expect(canOpenPerson(holding(["orders.view"]))).toBe(false);
  });
});
