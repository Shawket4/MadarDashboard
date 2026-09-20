/**
 * The Customers nav entry follows customers.view, never a role.
 */
import { describe, expect, it } from "vitest";

import { NAV, isParent, leafVisible, type NavLeaf } from "@/config/nav";
import { authzFrom } from "@/data/authz/use-authz";

const leaf = NAV.flatMap((g) => g.entries).flatMap((e) => (isParent(e) ? e.children : [e])).find((l): l is NavLeaf => l.to === "/customers");

const holding = (capabilities: string[]) =>
  authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: ["org_admin"], capabilities, ask_manager: [], limits: {} });

describe("Customers nav entry", () => {
  it("exists", () => {
    expect(leaf).toBeDefined();
  });
  it("is hidden without customers.view", () => {
    expect(leafVisible(leaf!, holding(["customers.create", "loyalty.read"]))).toBe(false);
  });
  it("is hidden for someone who only lists loyalty members — their list is the Members tab", () => {
    expect(leafVisible(leaf!, holding(["loyalty.members.list", "loyalty.read"]))).toBe(false);
  });
  it("shows with customers.view", () => {
    expect(leafVisible(leaf!, holding(["customers.view"]))).toBe(true);
  });
});
