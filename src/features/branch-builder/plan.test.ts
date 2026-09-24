import { describe, expect, it } from "vitest";

import {
  EMPTY_PLAN, addLink, checkPlan, diffPlans, linkKindFor, linksOf, planForSetup, removePieces, routeCategories,
  routeCategory, setupOf, unroutedCategories, type Plan,
} from "./plan";

const names = {
  till: "Till 1", receiptPrinter: "Receipt printer", kitchen: "Kitchen", kitchenPrinter: "Kitchen printer",
  kitchenScreen: "Kitchen screen", sectionA: "Hot", sectionB: "Cold", screenA: "Hot screen",
  screenB: "Cold screen",
};

const seq = () => {
  let n = 0;
  return () => `id-${++n}`;
};

describe("the four setups", () => {
  it("each starts as a plan with no blocking problem and reads back as itself", () => {
    for (const setup of ["till", "till_printer", "till_screen", "sections"] as const) {
      const plan = planForSetup(setup, names, ["c1", "c2"], seq());
      // A kitchen printer made by the template still needs its address.
      const blocking = checkPlan(plan).filter((p) => p.blocking).map((p) => p.code);
      expect(blocking).toEqual(setup === "till_printer" ? ["printer_no_address"] : []);
      expect(setupOf(plan)).toBe(setup);
    }
  });

  it("cases 2 and 3 are one section holding every category", () => {
    const plan = planForSetup("till_screen", names, ["c1", "c2"], seq());
    expect(plan.sections).toHaveLength(1);
    expect(plan.sections[0].category_ids).toEqual(["c1", "c2"]);
    expect(plan.sections[0].is_default).toBe(true);
    expect(unroutedCategories(plan, ["c1", "c2", "c3"])).toEqual(["c3"]);
  });

  it("an empty plan is no setup yet", () => {
    expect(setupOf(EMPTY_PLAN)).toBeNull();
  });
});

describe("links", () => {
  const plan = planForSetup("sections", names, [], seq());
  const [hot] = plan.sections;
  const till = plan.devices.find((d) => d.kind === "pos")!;
  const receipt = plan.printers.find((p) => p.role === "receipt")!;

  it("only connects pieces that make sense together", () => {
    expect(linkKindFor(plan, { kind: "section", id: hot.id }, { kind: "device", id: till.id })).toBeNull();
    expect(linkKindFor(plan, { kind: "device", id: till.id }, { kind: "printer", id: receipt.id })).toBe("receipt");
    // Drawn from either end, a screen and a section mean the same link.
    const screen = plan.devices.find((d) => d.kind === "kitchen")!;
    expect(linkKindFor(plan, { kind: "device", id: screen.id }, { kind: "section", id: hot.id })).toBe("shows");
  });

  it("adding twice is one link, and a section can print on a new kitchen printer", () => {
    const withPrinter: Plan = {
      ...plan,
      printers: [...plan.printers, { ...receipt, id: "kp", role: "kitchen", connection: "network", ip: "10.0.0.9", host_device_id: null }],
    };
    let next = addLink(withPrinter, { kind: "section", id: hot.id }, { kind: "printer", id: "kp" });
    next = addLink(next, { kind: "printer", id: "kp" }, { kind: "section", id: hot.id });
    expect(next.sections[0].printer_ids).toEqual(["kp"]);
    expect(linksOf(next).filter((l) => l.kind === "prints")).toHaveLength(1);
  });

  it("removing a piece removes every line to it and keeps one default section", () => {
    const next = removePieces(plan, new Set([`section:${hot.id}`, `printer:${receipt.id}`]));
    expect(next.sections).toHaveLength(1);
    expect(next.sections[0].is_default).toBe(true);
    expect(next.devices.find((d) => d.id === till.id)!.receipt_printer_id).toBeNull();
    expect(linksOf(next).some((l) => l.to.id === hot.id || l.from.id === hot.id)).toBe(false);
  });
});

describe("checks", () => {
  it("a section with nowhere to send orders blocks saving", () => {
    const plan = planForSetup("till_screen", names, [], seq());
    plan.sections[0].screen_ids = [];
    const problem = checkPlan(plan).find((p) => p.code === "section_no_output");
    expect(problem?.blocking).toBe(true);
  });

  it("a plugged-in printer with no device blocks; a POS with no receipt printer only warns", () => {
    const plan = planForSetup("till", names, [], seq());
    plan.printers[0].host_device_id = null;
    plan.devices[0].receipt_printer_id = null;
    const codes = checkPlan(plan).map((p) => [p.code, p.blocking]);
    expect(codes).toContainEqual(["printer_no_host", true]);
    expect(codes).toContainEqual(["pos_no_receipt_printer", false]);
  });

  it("puts blocking problems first", () => {
    const plan = planForSetup("sections", names, [], seq());
    plan.sections[1].screen_ids = [];
    const problems = checkPlan(plan);
    expect(problems[0].blocking).toBe(true);
    expect(problems.at(-1)?.blocking).toBe(false);
  });
});

describe("routing and changes", () => {
  it("a category lives in one section", () => {
    const plan = planForSetup("sections", names, ["c1"], seq());
    const next = routeCategory(plan, "c1", plan.sections[1].id);
    expect(next.sections[0].category_ids).toEqual([]);
    expect(next.sections[1].category_ids).toEqual(["c1"]);
  });

  it("moving a piece is not a change worth reviewing; renaming one is", () => {
    const plan = planForSetup("till", names, [], seq());
    const moved = { ...plan, devices: [{ ...plan.devices[0], x: 500 }] };
    expect(diffPlans(plan, moved)).toEqual({ added: [], removed: [], changed: [] });
    const renamed = { ...plan, devices: [{ ...plan.devices[0], name: "Front till" }] };
    expect(diffPlans(plan, renamed).changed).toEqual([{ kind: "device", id: plan.devices[0].id }]);
  });
});

describe("select all categories", () => {
  it("takes every category into one section in one step, and clears it again", () => {
    const plan = planForSetup("sections", names, ["c1", "c2"], seq());
    const [hot, cold] = plan.sections;
    const all = routeCategories(plan, ["c1", "c2", "c3"], cold.id);
    expect(all.sections.find((s) => s.id === cold.id)!.category_ids).toEqual(["c1", "c2", "c3"]);
    expect(all.sections.find((s) => s.id === hot.id)!.category_ids).toEqual([]);
    const none = routeCategories(all, ["c1", "c2", "c3"], null);
    expect(none.sections.every((s) => s.category_ids.length === 0)).toBe(true);
  });
});
