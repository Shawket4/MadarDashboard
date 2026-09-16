import { describe, expect, it } from "vitest";

import {
  effectToLegacyType,
  formPickRule,
  legacyTypeToEffect,
  makeGroupSchema,
  optionRecipeLines,
  pickRuleToSelection,
  selectionToPickRule,
  type PickRule,
} from "./group-model";

describe("pick rule ⇄ selection fields", () => {
  it("maps each rule onto selection_type / min / max / required", () => {
    expect(pickRuleToSelection({ kind: "exactly_one" })).toEqual({
      selection_type: "single",
      min_selections: 1,
      max_selections: 1,
      is_required: true,
    });
    expect(pickRuleToSelection({ kind: "up_to", max: 1 })).toEqual({
      selection_type: "single",
      min_selections: 0,
      max_selections: 1,
      is_required: false,
    });
    expect(pickRuleToSelection({ kind: "up_to", max: 3 })).toEqual({
      selection_type: "multi",
      min_selections: 0,
      max_selections: 3,
      is_required: false,
    });
    expect(pickRuleToSelection({ kind: "any" })).toEqual({
      selection_type: "multi",
      min_selections: 0,
      max_selections: null,
      is_required: false,
    });
  });

  it("round-trips every rule", () => {
    const rules: PickRule[] = [{ kind: "exactly_one" }, { kind: "up_to", max: 1 }, { kind: "up_to", max: 4 }, { kind: "any" }];
    for (const r of rules) expect(selectionToPickRule(pickRuleToSelection(r))).toEqual(r);
  });

  it("reads prod shapes", () => {
    // Red Bull Type: single 1..1 required
    expect(selectionToPickRule({ selection_type: "single", min_selections: 1, max_selections: 1, is_required: true })).toEqual({ kind: "exactly_one" });
    // Milk after the trigger: single 0..1 but required on the group
    expect(selectionToPickRule({ selection_type: "single", min_selections: 0, max_selections: 1, is_required: true })).toEqual({ kind: "exactly_one" });
    // Extras: multi, no cap
    expect(selectionToPickRule({ selection_type: "multi", min_selections: 0, max_selections: null, is_required: false })).toEqual({ kind: "any" });
  });

  it("swap groups always pick exactly one", () => {
    expect(formPickRule({ pick: "any", up_to: 3, effect: "swaps" })).toEqual({ kind: "exactly_one" });
    expect(formPickRule({ pick: "up_to", up_to: 3, effect: "adds" })).toEqual({ kind: "up_to", max: 3 });
  });
});

describe("effect ⇄ legacy_addon_type", () => {
  it("swaps map to the swap families", () => {
    expect(effectToLegacyType("swaps", "milk", "Milk")).toBe("milk_type");
    expect(effectToLegacyType("swaps", "beans", "Espresso Beans")).toBe("coffee_type");
  });

  it("a second bean group keeps its own name and the same family", () => {
    // Audit 2.4: the type no longer names the group.
    expect(effectToLegacyType("swaps", "beans", "V60 Beans", ["coffee_type"])).toBe("coffee_type");
  });

  it("adds / nothing derive a type from the name", () => {
    expect(effectToLegacyType("adds", null, "Red Bull Type")).toBe("red_bull_type");
    expect(effectToLegacyType("none", null, "  Bread choice ")).toBe("bread_choice");
    expect(effectToLegacyType("adds", null, "Flavour", ["flavour"])).toBe("flavour_2");
    expect(effectToLegacyType("adds", null, "Flavour", ["flavour", "flavour_2"])).toBe("flavour_3");
  });

  it("never lets a name smuggle in a swap family", () => {
    expect(effectToLegacyType("adds", null, "Milk type")).toBe("extra");
    expect(effectToLegacyType("adds", null, "Coffee")).toBe("extra");
    expect(effectToLegacyType("none", null, "الحليب")).toBe("extra");
  });

  it("reads the effect back", () => {
    expect(legacyTypeToEffect("milk_type", true)).toEqual({ effect: "swaps", swapTarget: "milk" });
    expect(legacyTypeToEffect("coffee_type", false)).toEqual({ effect: "swaps", swapTarget: "beans" });
    expect(legacyTypeToEffect("extra", true)).toEqual({ effect: "adds", swapTarget: null });
    expect(legacyTypeToEffect("red_bull", false)).toEqual({ effect: "none", swapTarget: null });
    expect(legacyTypeToEffect(null, false)).toEqual({ effect: "none", swapTarget: null });
  });

  it("round-trips swaps", () => {
    for (const target of ["milk", "beans"] as const) {
      expect(legacyTypeToEffect(effectToLegacyType("swaps", target, "x"), true)).toEqual({ effect: "swaps", swapTarget: target });
    }
  });
});

describe("option recipe lines", () => {
  const unitOf = (id: string) => (id === "oat" ? "g" : undefined);
  it("swap writes one line of 1 in the ingredient's unit", () => {
    expect(optionRecipeLines("swaps", { swap_ingredient_id: "oat", lines: [] }, unitOf)).toEqual([{ ingredient_id: "oat", quantity: 1, unit: "g" }]);
  });
  it("adds writes the typed lines; nothing writes none", () => {
    const o = { swap_ingredient_id: "", lines: [{ ingredient_id: "syrup", quantity: 20, unit: "g" }] };
    expect(optionRecipeLines("adds", o, unitOf)).toEqual([{ ingredient_id: "syrup", quantity: 20, unit: "g" }]);
    expect(optionRecipeLines("none", o, unitOf)).toEqual([]);
  });
});

describe("group schema", () => {
  const schema = makeGroupSchema({ required: "req", maxAtLeastOne: "max", swapNeedsIngredient: "swap", duplicateIngredient: "dup", qtyPositive: "qty" });
  const base = { name: "Milk", name_ar: "", pick: "exactly_one", up_to: 1, effect: "swaps", swap_target: "milk" } as const;
  const opt = { name: "Oat", name_ar: "", price: "55", is_active: true, swap_ingredient_id: "", lines: [] };

  it("requires an ingredient on every swap option", () => {
    const r = schema.safeParse({ ...base, options: [opt] });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe("swap");
    expect(schema.safeParse({ ...base, options: [{ ...opt, swap_ingredient_id: "oat" }] }).success).toBe(true);
  });

  it("rejects the same ingredient twice on an adds option", () => {
    const line = { ingredient_id: "syrup", quantity: "20", unit: "g" };
    const r = schema.safeParse({ ...base, effect: "adds", options: [{ ...opt, lines: [line, line] }] });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe("dup");
  });
});
