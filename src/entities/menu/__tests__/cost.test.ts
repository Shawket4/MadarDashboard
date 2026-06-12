import { describe, expect, it } from "vitest";
import { itemMargin, itemMarginPct, recipeCost } from "../cost";

const catalog = [
  { id: "milk", cost_per_unit: 5 }, // 5 piastres per ml
  { id: "beans", cost_per_unit: 120 }, // 120 piastres per g
  { id: "water", cost_per_unit: 0 }, // free but known
  { id: "syrup", cost_per_unit: null }, // cost unknown
];

describe("recipeCost", () => {
  it("sums quantity × cost_per_unit in piastres", () => {
    const lines = [
      { org_ingredient_id: "milk", quantity_used: 200 }, // 1000
      { org_ingredient_id: "beans", quantity_used: 18 }, // 2160
    ];
    expect(recipeCost(lines, catalog)).toBe(3160);
  });

  it("treats zero-cost ingredients as free, not unknown", () => {
    const lines = [
      { org_ingredient_id: "water", quantity_used: 300 },
      { org_ingredient_id: "beans", quantity_used: 10 },
    ];
    expect(recipeCost(lines, catalog)).toBe(1200);
  });

  it("returns null when any ingredient lacks a cost", () => {
    const lines = [
      { org_ingredient_id: "milk", quantity_used: 200 },
      { org_ingredient_id: "syrup", quantity_used: 20 },
    ];
    expect(recipeCost(lines, catalog)).toBeNull();
  });

  it("returns null for unlinked or unknown ingredients", () => {
    expect(recipeCost([{ org_ingredient_id: null, quantity_used: 1 }], catalog)).toBeNull();
    expect(recipeCost([{ org_ingredient_id: "ghost", quantity_used: 1 }], catalog)).toBeNull();
  });

  it("returns null for an empty recipe (no rows ≠ zero cost)", () => {
    expect(recipeCost([], catalog)).toBeNull();
  });

  it("supports multi-size usage by costing each size's lines separately", () => {
    const small = [{ org_ingredient_id: "milk", quantity_used: 150 }];
    const large = [{ org_ingredient_id: "milk", quantity_used: 300 }];
    expect(recipeCost(small, catalog)).toBe(750);
    expect(recipeCost(large, catalog)).toBe(1500);
  });
});

describe("itemMargin", () => {
  const item = { base_price: 4500 }; // 45 EGP

  it("computes price − cost in piastres", () => {
    const lines = [{ org_ingredient_id: "milk", quantity_used: 200 }]; // 1000
    expect(itemMargin(item, lines, catalog)).toBe(3500);
  });

  it("zero-cost recipe yields full price as margin", () => {
    const lines = [{ org_ingredient_id: "water", quantity_used: 500 }];
    expect(itemMargin(item, lines, catalog)).toBe(4500);
  });

  it("null cost yields null margin — never treats missing as zero", () => {
    const lines = [{ org_ingredient_id: "syrup", quantity_used: 10 }];
    expect(itemMargin(item, lines, catalog)).toBeNull();
  });

  it("itemMarginPct returns ratio, null on unknown cost or zero price", () => {
    const lines = [{ org_ingredient_id: "milk", quantity_used: 200 }];
    expect(itemMarginPct(item, lines, catalog)).toBeCloseTo(3500 / 4500);
    expect(itemMarginPct({ base_price: 0 }, lines, catalog)).toBeNull();
    expect(itemMarginPct(item, [{ org_ingredient_id: "syrup", quantity_used: 1 }], catalog)).toBeNull();
  });
});
