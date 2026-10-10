/**
 * madar-shared's cost_vectors.json (src/lib, pinned by rev): the cases
 * madar-money's `cost` is tested against, asked of the dashboard's recipe cost
 * (the wasm). A vector line's quantity is already in the base unit; the draft
 * estimate's own step (typed amount → stored quantity) is checked below.
 */
import { describe, expect, it } from "vitest";

import type { OrgIngredient } from "@/data/api/generated/models";
import vectors from "@/lib/cost_vectors.json";
import recipeQty from "@/lib/recipe_qty_vectors.json";
import { rules } from "@/lib/rules";

import { draftLineCost, draftRecipeCost, foodCostBand, recipeMargin, storedQty } from "./recipe-cost";

const ing = (cost_per_unit: number | null, extra: Partial<OrgIngredient> = {}) =>
  ({ unit: "g", cost_per_unit, yield_pct: null, density_g_per_ml: null, ...extra }) as OrgIngredient;
const line = (qty: number, cost: number | null) => ({ ingredient: ing(cost), quantity: String(qty), unit: "g" });

describe("recipe cost matches madar-shared's cost vectors", () => {
  it.each(vectors.line_cost)("line_cost $name", (c) => {
    expect(draftLineCost(line(c.qty, c.cost_per_unit))).toBe(c.expected);
  });

  it.each(vectors.recipe_cost)("recipe_cost $name", (c) => {
    expect(draftRecipeCost(c.lines.map((l) => line(l.qty, l.cost_per_unit)))).toEqual(c.expected);
  });

  it.each(vectors.margin)("margin $name", (c) => {
    expect(recipeMargin(c.price, { piastres: c.cost, complete: true })).toBe(c.expected);
  });

  for (const c of vectors.food_cost_band) {
    // JSON numbers past 2^53 are not the integers the vector means: no piastre figure reaches them.
    const why = [c.cost, c.price].some((n) => !Number.isSafeInteger(n)) ? " — beyond a JS number's exact integers" : null;
    (why ? it.skip : it)(`food_cost_band ${c.name}${why ?? ""}`, () => {
      expect(foodCostBand(c.cost, c.price)).toBe(c.expected);
    });
  }
});

describe("a draft estimate costs what the server will store", () => {
  it("grosses the typed amount up by the yield loss (D3: 100 g at 80 % stores 125 g)", () => {
    expect(draftLineCost({ ingredient: ing(1, { yield_pct: 80 }), quantity: "100", unit: "g" })).toBe(125);
  });

  it("converts the typed unit to the ingredient's, through its density across weight and volume", () => {
    expect(draftLineCost({ ingredient: ing(2, { unit: "g" }), quantity: "0.1", unit: "kg" })).toBe(200);
    expect(draftLineCost({ ingredient: ing(1, { unit: "g", density_g_per_ml: 1.03 }), quantity: "100", unit: "ml" })).toBe(103);
    expect(draftLineCost({ ingredient: ing(1, { unit: "g" }), quantity: "100", unit: "ml" })).toBeNull();
  });

  it("D2: a cost of 0 is known; only a missing one leaves the recipe incomplete", () => {
    expect(draftRecipeCost([line(10, 0)])).toEqual({ piastres: 0, complete: true });
    expect(draftRecipeCost([line(10, 5), line(10, null)])).toEqual({ piastres: 50, complete: false });
  });

  it("D4: no margin for a partial cost", () => {
    expect(recipeMargin(1000, { piastres: 400, complete: false })).toBeNull();
  });
});

// madar-shared's recipe_qty_vectors.json (pinned by rev): madar-units' typed amount
// → stored quantity (the editors' estimate, storedQty) and back (usable_qty: the
// server's `usable_quantity`, which the web reads; only the mock server computes it).
describe("recipe quantities match madar-shared's recipe_qty vectors", () => {
  const draft = (c: { qty: number; unit: string; base_unit: string; density: number | null; yield_pct: number | null }) =>
    storedQty({ ingredient: ing(null, { unit: c.base_unit, density_g_per_ml: c.density, yield_pct: c.yield_pct }), quantity: String(c.qty), unit: c.unit });

  it.each(recipeQty.recipe_base_qty)("recipe_base_qty $name", (c) => {
    expect(draft(c)).toBe(c.error == null ? c.expected : null);
  });
  it.each(recipeQty.usable_qty)("usable_qty $name", (c) => {
    expect(rules.usable_qty(c.stored, c.yield_pct)).toBe(c.expected);
  });
  it.each(recipeQty.round_trips)("round trip $name", (c) => {
    const stored = draft(c);
    expect(stored).toBe(c.stored);
    expect(rules.usable_qty(stored as number, c.yield_pct)).toBe(c.usable);
  });
});
