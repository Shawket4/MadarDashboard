/** A Free shop's checklist leaves out ingredients and recipes (stock and cost are the paid plan's). */
import { describe, expect, it } from "vitest";

import { STEPS, stepApplies, stepsForPlan } from "./config";

describe("onboarding steps by plan", () => {
  it("a Free org skips ingredients and recipes, keeping the order of the rest", () => {
    const keys = stepsForPlan("free").map((s) => s.key);
    expect(keys).not.toContain("ingredients");
    expect(keys).not.toContain("recipes");
    expect(keys).toEqual(STEPS.map((s) => s.key).filter((k) => k !== "ingredients" && k !== "recipes"));
    expect(keys).toEqual(["org_profile", "branch", "payment_methods", "categories", "menu_items", "addons", "team", "go_live"]);
  });

  it("a paid org, or one whose plan is not known yet, keeps every step", () => {
    for (const plan of ["paid", null, undefined]) expect(stepsForPlan(plan), String(plan)).toEqual(STEPS);
  });

  it("applies by the server's step key", () => {
    expect(stepApplies("recipes", "free")).toBe(false);
    expect(stepApplies("ingredients", "free")).toBe(false);
    expect(stepApplies("menu_items", "free")).toBe(true);
    expect(stepApplies("recipes", "paid")).toBe(true);
  });
});
