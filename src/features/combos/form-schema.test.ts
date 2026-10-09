/**
 * The combo form's rules (the ones the server would 400 on) and the two
 * mappings: EGP text ↔ piastres, blank size surcharges meaning "the usual
 * difference" (C9), and a window's hours and dates (C4, §11.3).
 */
import { describe, expect, it } from "vitest";

import type { Combo } from "./types";
import {
  E,
  EMPTY_COMBO,
  comboSchema,
  emptyChoice,
  emptySlot,
  emptyWindow,
  fromWire,
  toEconomicsBody,
  toWire,
  type ComboFormValues,
} from "./form-schema";

const burger = "item-burger";
const fries = "item-fries";
const drinks = "cat-drinks";

function lunch(): ComboFormValues {
  return {
    ...EMPTY_COMBO,
    name: "Lunch deal",
    name_ar: "وجبة الغداء",
    price: "150",
    slots: [
      { ...emptySlot(), name: "Main", choices: [{ ...emptyChoice(), menu_item_id: burger }], default_item_id: burger },
      { ...emptySlot(), name: "Side", choices: [{ ...emptyChoice(), menu_item_id: fries }] },
      {
        ...emptySlot(),
        name: "Drink",
        name_ar: "مشروب",
        choices: [
          {
            ...emptyChoice(),
            target: "category",
            category_id: drinks,
            included_size_label: "Regular",
            size_surcharges: [
              { size_label: "Large", surcharge: "8" },
              { size_label: "XL", surcharge: "" },
            ],
          },
        ],
      },
    ],
  };
}

const issues = (v: unknown) => {
  const r = comboSchema.safeParse(v);
  return r.success ? [] : r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
};

describe("combo form rules", () => {
  it("accepts a meal deal with a category slot", () => {
    expect(issues(lunch())).toEqual([]);
  });

  it("refuses min above max on the min field", () => {
    const v = lunch();
    v.slots[1] = { ...v.slots[1], min: 3, max: 2 };
    expect(issues(v)).toContainEqual({ path: "slots.1.min", message: E.minOverMax });
  });

  it("refuses a slot with no choices", () => {
    const v = lunch();
    v.slots[0] = { ...v.slots[0], choices: [], default_item_id: "" };
    expect(issues(v)).toContainEqual({ path: "slots.0.choices", message: E.noChoices });
  });

  it("refuses max = 0, no slots, a blank choice, a duplicate and a stray default", () => {
    const v = lunch();
    v.slots[0] = { ...v.slots[0], min: 0, max: 0 };
    expect(issues(v)).toContainEqual({ path: "slots.0.max", message: E.maxZero });

    expect(issues({ ...lunch(), slots: [] })).toContainEqual({ path: "slots", message: E.slotsRequired });

    const blank = lunch();
    blank.slots[1].choices.push(emptyChoice());
    expect(issues(blank)).toContainEqual({ path: "slots.1.choices.1.target", message: E.choiceTarget });

    const dup = lunch();
    dup.slots[1].choices.push({ ...emptyChoice(), menu_item_id: fries });
    expect(issues(dup)).toContainEqual({ path: "slots.1.choices.1.target", message: E.choiceDuplicate });

    const stray = lunch();
    stray.slots[1].default_item_id = burger;
    expect(issues(stray)).toContainEqual({ path: "slots.1.default_item_id", message: E.defaultNotChoice });
  });

  it("checks a window's days, hours pair and date order", () => {
    const v = lunch();
    v.windows = [
      { ...emptyWindow(), weekdays: 0 },
      { ...emptyWindow(), starts_at: "12:00", ends_at: "" },
      { ...emptyWindow(), starts_at: "12:00", ends_at: "12:00" },
      { ...emptyWindow(), valid_from: "2026-10-10", valid_to: "2026-10-01" },
    ];
    expect(issues(v)).toEqual(
      expect.arrayContaining([
        { path: "windows.0.weekdays", message: E.noDays },
        { path: "windows.1.ends_at", message: E.hoursPair },
        { path: "windows.2.ends_at", message: E.hoursSame },
        { path: "windows.3.valid_to", message: E.datesOrder },
      ]),
    );
  });

  it("refuses a blank or negative price but never looks at margins", () => {
    expect(issues({ ...lunch(), price: "" })).toContainEqual({ path: "price", message: E.money });
    expect(issues({ ...lunch(), price: "-5" })).toContainEqual({ path: "price", message: E.money });
    // A price far above the items' list value is a warning (NO_SAVING), not an error.
    expect(issues({ ...lunch(), price: "99999" })).toEqual([]);
  });
});

describe("combo form ↔ wire", () => {
  it("writes piastres, translations, and drops blank size surcharges", () => {
    const v = lunch();
    v.windows = [{ ...emptyWindow(), weekdays: 62, starts_at: "12:00:00", ends_at: "16:00", valid_from: "2026-10-01" }];
    const w = toWire(v);
    expect(w.price).toBe(15000);
    expect(w.name_translations).toEqual({ ar: "وجبة الغداء" });
    expect(w.slots.map((s) => s.sort)).toEqual([0, 1, 2]);
    expect(w.slots[0]).toMatchObject({ min: 1, max: 1, default_item_id: burger, name_translations: {} });
    const drink = w.slots[2].choices[0];
    expect(drink).toMatchObject({ menu_item_id: null, category_id: drinks, surcharge: 0, included_size_label: "Regular" });
    // "XL" left blank = the size's usual difference: no row is sent.
    expect(drink.size_surcharges).toEqual([{ size_label: "Large", surcharge: 800 }]);
    expect(w.windows).toEqual([
      { branch_id: null, weekdays: 62, starts_at: "12:00", ends_at: "16:00", valid_from: "2026-10-01", valid_to: null },
    ]);
  });

  it("reads a saved combo back into the same form (ids kept for the in-place diff)", () => {
    const w = toWire(lunch());
    const saved: Combo = {
      ...w,
      name_translations: w.name_translations ?? {},
      is_active: true,
      windows: w.windows ?? [],
      // The server answers with ids on every slot and choice.
      slots: w.slots.map((s, i) => ({
        ...s,
        id: `slot-${i}`,
        name_translations: s.name_translations ?? {},
        sort: s.sort ?? i,
        choices: s.choices.map((c, j) => ({ ...c, id: `ch-${i}-${j}`, surcharge: c.surcharge ?? 0, size_surcharges: c.size_surcharges ?? [], sort: c.sort ?? j })),
      })),
      id: "combo-1",
      kind: "combo",
      image_url: null,
      is_fixed: false,
      created_at: "",
      updated_at: "",
      available_now: true,
      description_translations: {},
      economics: {
        branch_id: null,
        price: 15000,
        list_default: 21000,
        list_min: 19000,
        list_max: 26000,
        cost_default: 6100,
        cost_max: 7400,
        margin_default: "0.5933",
        margin_worst: "0.5067",
        min_margin: "0.5500",
        saving_default: 6000,
        warnings: [],
      },
    };
    const back = fromWire(saved);
    expect(back.price).toBe("150");
    expect(back.slots[2]).toMatchObject({ id: "slot-2", name_ar: "مشروب" });
    expect(back.slots[2].choices[0]).toMatchObject({ id: "ch-2-0", target: "category", size_surcharges: [{ size_label: "Large", surcharge: "8" }] });
    const again = toWire(back);
    expect(again.slots[2].id).toBe("slot-2");
    expect(again.slots[2].choices[0].id).toBe("ch-2-0");
  });

  it("asks the economics panel only once a price and a real slot exist", () => {
    expect(toEconomicsBody({ ...lunch(), price: "" })).toBeNull();
    expect(toEconomicsBody({ ...lunch(), slots: [emptySlot()] })).toBeNull();
    const half = lunch();
    half.slots[1].choices.push(emptyChoice()); // a blank row being typed
    const body = toEconomicsBody(half);
    expect(body?.price).toBe(15000);
    expect(body?.slots[1].choices).toHaveLength(1);
  });
});
