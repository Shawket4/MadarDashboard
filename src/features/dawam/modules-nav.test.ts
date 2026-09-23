/** Modules (DSH-2 / PS-2): the sidebar follows what the org has switched on. */
import { describe, expect, it } from "vitest";

import { NAV, isParent, leafVisible, type NavLeaf } from "@/config/nav";
import { authzFrom } from "@/data/authz/use-authz";

const everyone = authzFrom(null, { platform: true });
const leaves: NavLeaf[] = NAV.flatMap((g) => g.entries).flatMap((e) => (isParent(e) ? e.children : [e]));
const shown = (modules: string[]) => leaves.filter((l) => leafVisible(l, everyone, modules)).map((l) => l.to);

describe("nav by module", () => {
  it("a Dawam-only org sees Dawam, people, branches and settings — no selling pages", () => {
    const to = shown(["dawam"]);
    for (const p of ["/staff/team", "/staff/schedule", "/staff/payroll", "/staff/reports", "/staff/rules", "/staff/employees", "/branches", "/settings", "/access/users"]) {
      expect(to).toContain(p);
    }
    for (const p of ["/", "/orders", "/tills", "/menu/items", "/inventory/today", "/reports/operations", "/devices"]) {
      expect(to).not.toContain(p);
    }
  });

  it("a POS-only org sees no Dawam pages", () => {
    const to = shown(["pos"]);
    expect(to).toContain("/orders");
    for (const p of ["/staff/team", "/staff/schedule", "/staff/payroll", "/staff/approvals", "/staff/reports"]) {
      expect(to).not.toContain(p);
    }
  });

  it("an unknown module list hides nothing", () => {
    expect(leaves.filter((l) => leafVisible(l, everyone)).length).toBe(shown(["pos", "dawam"]).length);
  });
});
