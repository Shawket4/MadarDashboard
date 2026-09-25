/**
 * "Make it a meal" on the contract's lunch combo (P = 15000; burger 12000,
 * fries 4000, latte Regular 5000 / Large 6000): the slots that admit an item
 * and the "+X" the till shows.
 */
import { describe, expect, it } from "vitest";

import type { Combo } from "./contract";
import { choiceFor, mealDelta, slotsAdmitting } from "./meal";
import type { ItemOption } from "./use-menu-options";

const items: Record<string, ItemOption> = {
  burger: { id: "burger", name: "Burger", category_id: "mains", is_active: true, sizes: [{ label: "one_size", price: 12000 }] },
  fries: { id: "fries", name: "Fries", category_id: "sides", is_active: true, sizes: [{ label: "one_size", price: 4000 }] },
  latte: {
    id: "latte",
    name: "Latte",
    category_id: "drinks",
    is_active: true,
    sizes: [
      { label: "Regular", price: 5000 },
      { label: "Large", price: 6000 },
    ],
  },
  cola: { id: "cola", name: "Cola", category_id: "drinks", is_active: true, sizes: [{ label: "one_size", price: 2500 }] },
};
const lookup = (id: string) => items[id];

const choice = (p: Partial<Combo["slots"][number]["choices"][number]>) => ({
  menu_item_id: null,
  category_id: null,
  surcharge: 0,
  included_size_label: null,
  size_surcharges: [],
  sort: 0,
  ...p,
});

const lunch: Pick<Combo, "price" | "slots"> = {
  price: 15000,
  slots: [
    { id: "main", name: "Main", name_translations: {}, sort: 0, min: 1, max: 1, default_item_id: "burger", default_size_label: null, choices: [choice({ menu_item_id: "burger" })] },
    { id: "side", name: "Side", name_translations: {}, sort: 1, min: 1, max: 1, default_item_id: null, default_size_label: null, choices: [choice({ menu_item_id: "fries", surcharge: 0 })] },
    {
      id: "drink",
      name: "Drink",
      name_translations: {},
      sort: 2,
      min: 1,
      max: 1,
      default_item_id: "cola",
      default_size_label: null,
      choices: [choice({ category_id: "drinks", included_size_label: "Regular", size_surcharges: [{ size_label: "Large", surcharge: 800 }] })],
    },
  ],
};

describe("make it a meal", () => {
  it("finds the slots whose choices admit the item, by id or by category", () => {
    expect(slotsAdmitting(lunch, items.latte).map((s) => s.id)).toEqual(["drink"]);
    expect(slotsAdmitting(lunch, items.burger).map((s) => s.id)).toEqual(["main"]);
    expect(slotsAdmitting(lunch, { id: "cake", category_id: "cakes" })).toEqual([]);
    expect(choiceFor(lunch.slots[2], items.latte)?.category_id).toBe("drinks");
  });

  it("prices +X as the combo with the item in its slot, minus the item alone", () => {
    // A Regular latte (5000) becomes the meal at 15000: +10000.
    expect(mealDelta(lunch, "drink", items.latte, lookup)).toBe(10000);
    // A burger (12000) becomes the meal: +3000.
    expect(mealDelta(lunch, "main", items.burger, lookup)).toBe(3000);
  });

  it("adds the other slots' default upgrades and the item's own choice surcharge", () => {
    const pricier = {
      ...lunch,
      slots: lunch.slots.map((s) =>
        s.id === "drink"
          ? { ...s, default_item_id: "latte", default_size_label: "Large" }
          : s.id === "side"
            ? { ...s, choices: [choice({ menu_item_id: "fries", surcharge: 500 })] }
            : s,
      ),
    };
    // Burger meal: 15000 + fries surcharge 500 + default Large latte (owner's 800) − 12000.
    expect(mealDelta(pricier, "main", items.burger, lookup)).toBe(15000 + 500 + 800 - 12000);
    // Fries meal: its own choice carries +500.
    expect(mealDelta(pricier, "side", items.fries, lookup)).toBe(15000 + 500 + 800 - 4000);
  });

  it("is null for a slot that doesn't take the item", () => {
    expect(mealDelta(lunch, "main", items.latte, lookup)).toBeNull();
  });
});
