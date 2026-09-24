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

describe("Rules in the nav (owner decision 2026-09-23)", () => {
  const as = (capabilities: string[]) =>
    authzFrom({
      user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [],
      capabilities: capabilities as never, ask_manager: [], limits: {},
    });
  const rules = leaves.find((l) => l.to === "/staff/rules")!;

  it("shows for a manager who may only view the rules, and for the owner who edits them", () => {
    expect(leafVisible(rules, as(["hr.rules.view"]), ["dawam"])).toBe(true);
    expect(leafVisible(rules, as(["hr.rules.edit"]), ["dawam"])).toBe(true);
  });

  it("stays hidden from someone with neither", () => {
    expect(leafVisible(rules, as(["hr.attendance.read"]), ["dawam"])).toBe(false);
  });
});

describe("Approvals in the nav (O-17; E2E, team)", () => {
  const as = (capabilities: string[]) =>
    authzFrom({
      user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [],
      capabilities: capabilities as never, ask_manager: [], limits: {},
    });
  const approvals = leaves.find((l) => l.to === "/staff/approvals")!;

  it("shows for anyone the page itself lets decide something, attendance edits included", () => {
    expect(leafVisible(approvals, as(["hr.attendance.edit"]), ["dawam"])).toBe(true);
    expect(leafVisible(approvals, as(["hr.leave.edit"]), ["dawam"])).toBe(true);
  });

  it("stays hidden from someone who decides nothing", () => {
    expect(leafVisible(approvals, as(["hr.attendance.read"]), ["dawam"])).toBe(false);
  });
});
