/** Modules (DSH-2 / PS-2): the sidebar follows what the org has switched on. */
import { describe, expect, it } from "vitest";

import { NAV, isParent, leafVisible, moduleOfPath, type NavLeaf } from "@/config/nav";
import { authzFrom } from "@/data/authz/use-authz";

const everyone = authzFrom(null, { platform: true });
const leaves: NavLeaf[] = NAV.flatMap((g) => g.entries).flatMap((e) => (isParent(e) ? e.children : [e]));
const shown = (modules: string[]) => leaves.filter((l) => leafVisible(l, everyone, modules)).map((l) => l.to);

describe("nav by module", () => {
  it("a Dawam-only org sees Dawam, people, branches and settings — no selling pages", () => {
    const to = shown(["dawam"]);
    for (const p of ["/staff/team", "/staff/schedule", "/staff/payroll", "/staff/reports", "/staff/rules", "/staff/employees", "/staff/attendance", "/staff/requests", "/reports/staff", "/reports/legal", "/branches", "/settings", "/access/users"]) {
      expect(to).toContain(p);
    }
    for (const p of ["/", "/orders", "/tills", "/menu/items", "/inventory/today", "/reports/operations", "/devices"]) {
      expect(to).not.toContain(p);
    }
  });

  it("a POS-only org sees no Dawam pages", () => {
    const to = shown(["pos"]);
    expect(to).toContain("/orders");
    expect(to).toContain("/reports/legal");
    for (const p of ["/staff/team", "/staff/schedule", "/staff/payroll", "/staff/approvals", "/staff/reports", "/staff/employees", "/staff/attendance", "/staff/shifts", "/staff/requests", "/staff/rules", "/reports/staff"]) {
      expect(to).not.toContain(p);
    }
  });

  it("an unknown module list hides nothing", () => {
    expect(leaves.filter((l) => leafVisible(l, everyone)).length).toBe(shown(["pos", "dawam"]).length);
  });
});

describe("route module (the gate reads the same tags)", () => {
  it("tags every staff page Dawam, selling pages POS, shared pages none", () => {
    for (const p of ["/staff/employees", "/staff/attendance", "/staff/shifts", "/staff/requests", "/staff/rules", "/staff/setup", "/staff/team", "/staff/schedule", "/staff/approvals", "/staff/payroll", "/staff/reports", "/reports/staff"]) {
      expect(moduleOfPath(p)).toBe("dawam");
    }
    for (const p of ["/orders", "/tills", "/menu/items", "/menu/items/abc", "/inventory/today", "/reports/staff-pool", "/settings/loyalty", "/devices"]) {
      expect(moduleOfPath(p)).toBe("pos");
    }
    for (const p of ["/", "/branches", "/settings", "/access/users", "/reports/legal", "/orgs"]) {
      expect(moduleOfPath(p)).toBeUndefined();
    }
  });
});
