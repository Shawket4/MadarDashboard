/**
 * A combo line prices and travels differently from a plain one: its price is
 * the combo's plus what the picks add, and the server needs the picks, not a
 * size on the header.
 */
import { beforeEach, describe, expect, it } from "vitest";

import type { DeliveryMenuItem } from "@/data/api/generated/models/deliveryMenuItem";

import type { CartLine } from "./types";
import { displaySize, lineTotal, lineUnitPrice, loadCart, saveCart, toCartLineInput } from "./utils";

const comboItem = {
  id: "combo-1",
  kind: "combo",
  name: "Coffee & Soft Serve",
  name_translations: {},
  price: 20000,
  sizes: [],
  optionals: [],
  modifier_groups: [],
  allowed_addon_ids: [],
} as unknown as DeliveryMenuItem;

const comboLine: CartLine = {
  uid: "l-1",
  item: comboItem,
  size_label: null,
  base_price: 20000,
  quantity: 2,
  addons: [],
  optionals: [],
  notes: null,
  combo: {
    picks: [
      {
        slot_id: "slot-coffee",
        menu_item_id: "latte",
        size_label: null,
        quantity: 1,
        name: "Latte",
        name_translations: { ar: "لاتيه" },
        slot_name: "Coffee",
        slot_name_translations: { ar: "قهوة" },
        extra: 0,
      },
      {
        slot_id: "slot-dessert",
        menu_item_id: "vanilla",
        size_label: "large",
        quantity: 2,
        name: "Vanilla Soft Serve",
        name_translations: {},
        slot_name: "Dessert",
        slot_name_translations: {},
        extra: 1000,
      },
    ],
  },
};

describe("combo lines", () => {
  it("price = combo price + Σ(extra × pick quantity), per unit; × line quantity in total", () => {
    expect(lineUnitPrice(comboLine)).toBe(20000 + 1000 * 2);
    expect(lineTotal(comboLine)).toBe(22000 * 2);
  });

  it("sends the picks the server needs, and no size on the header", () => {
    expect(toCartLineInput(comboLine)).toEqual({
      menu_item_id: "combo-1",
      size_label: null,
      quantity: 2,
      addons: [],
      optional_field_ids: [],
      notes: null,
      combo: {
        picks: [
          { slot_id: "slot-coffee", menu_item_id: "latte", size_label: null, quantity: 1 },
          { slot_id: "slot-dessert", menu_item_id: "vanilla", size_label: "large", quantity: 2 },
        ],
      },
    });
  });

  it("never sends or shows the synthetic one_size", () => {
    const line: CartLine = {
      ...comboLine,
      combo: { picks: [{ ...comboLine.combo!.picks[0], size_label: "one_size" }] },
    };
    expect(toCartLineInput(line).combo?.picks[0].size_label).toBeNull();
    expect(displaySize("one_size")).toBeNull();
    expect(displaySize("large")).toBe("large");
  });

  it("a plain line is unchanged: no combo on the wire", () => {
    const plain: CartLine = { ...comboLine, combo: undefined, size_label: "small", base_price: 5000, quantity: 1 };
    expect(lineUnitPrice(plain)).toBe(5000);
    expect(toCartLineInput(plain)).not.toHaveProperty("combo");
    expect(toCartLineInput(plain).size_label).toBe("small");
  });
});

describe("persisted online cart", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips a combo line with its picks", () => {
    saveCart("org", "branch", [comboLine]);
    const [back] = loadCart("org", "branch");
    expect(back).toEqual(comboLine);
    expect(lineUnitPrice(back)).toBe(lineUnitPrice(comboLine));
    expect(toCartLineInput(back)).toEqual(toCartLineInput(comboLine));
  });
});
