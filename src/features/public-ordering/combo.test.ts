/** Where the combo picker opens, and when it lets the customer add. */
import { describe, expect, it } from "vitest";

import type { PublicCombo } from "@/data/api/generated/models/publicCombo";

import { buildPicks, firstUnmetSlot, initialSelection, isAvailable } from "./combo";

const choice = (id: string, sizes: { label: string; extra: number }[] = [{ label: "one_size", extra: 0 }], surcharge = 0) => ({
  menu_item_id: id,
  name: id,
  name_translations: {},
  image_url: null,
  base_price: 1000,
  included_size_label: sizes[0].label,
  sizes: sizes.map((s) => ({ ...s, price: 1000 + s.extra })),
  surcharge,
});

const combo: PublicCombo = {
  is_fixed: false,
  slots: [
    {
      id: "drink",
      name: "Drink",
      name_translations: {},
      sort: 0,
      min: 1,
      max: 1,
      default_item_id: "cola",
      default_size_label: "large",
      choices: [choice("water"), choice("cola", [{ label: "small", extra: 0 }, { label: "large", extra: 500 }], 200)],
    },
    { id: "side", name: "Side", name_translations: {}, sort: 1, min: 0, max: 2, choices: [choice("fries"), choice("salad")] },
    { id: "main", name: "Main", name_translations: {}, sort: 2, min: 2, max: 2, choices: [choice("burger")] },
  ],
};

describe("initialSelection", () => {
  it("pre-picks a slot's default at its default size, fills a one-choice exact slot, leaves the rest", () => {
    const sel = initialSelection(combo);
    expect(sel.drink).toEqual({ cola: { qty: 1, size: "large" } });
    expect(sel.side).toBeUndefined();
    expect(sel.main).toEqual({ burger: { qty: 2, size: "one_size" } });
    expect(firstUnmetSlot(combo, sel)).toBeNull();
  });

  it("a slot with several choices and no default waits for the customer", () => {
    const sel = initialSelection({ ...combo, slots: [{ ...combo.slots[0], default_item_id: null }] });
    expect(sel.drink).toBeUndefined();
    expect(firstUnmetSlot({ ...combo, slots: [combo.slots[0]] }, sel)?.id).toBe("drink");
  });

  it("reopens an edited line with its own picks", () => {
    const sel = initialSelection(combo, [
      {
        slot_id: "drink",
        menu_item_id: "water",
        size_label: null,
        quantity: 1,
        name: "water",
        name_translations: {},
        slot_name: "Drink",
        slot_name_translations: {},
        extra: 0,
      },
    ]);
    expect(sel).toEqual({ drink: { water: { qty: 1, size: "one_size" } } });
  });
});

describe("buildPicks", () => {
  it("carries each pick's extra (choice surcharge + size extra) and only a real size", () => {
    const picks = buildPicks(combo, initialSelection(combo));
    expect(picks.map((p) => [p.menu_item_id, p.size_label, p.quantity, p.extra])).toEqual([
      ["cola", "large", 1, 700],
      ["burger", null, 2, 0],
    ]);
  });
});

/* ── Unavailable choices: shown greyed, never picked (owner, 2026-09-27) ── */

const off = (id: string) => ({ ...choice(id), sizes: [], available: false });

describe("unavailable choices", () => {
  it("a choice is available unless the server says otherwise (an older server sends no flag)", () => {
    expect(isAvailable(choice("water"))).toBe(true);
    expect(isAvailable({ ...choice("water"), available: true })).toBe(true);
    expect(isAvailable(off("water"))).toBe(false);
  });

  it("is never the default, and a slot left with one pickable choice is filled with it", () => {
    const c: PublicCombo = {
      is_fixed: false,
      slots: [
        // The default itself went unavailable: nothing pre-picked, the customer chooses.
        { ...combo.slots[0], default_item_id: "cola", choices: [choice("water"), choice("juice"), off("cola")] },
        // Exactly one pickable choice, taken once: filled, the greyed one shown beside it.
        { id: "main", name: "Main", name_translations: {}, sort: 1, min: 1, max: 1, choices: [off("burger"), choice("wrap")] },
      ],
    };
    const sel = initialSelection(c);
    expect(sel.drink).toBeUndefined();
    expect(sel.main).toEqual({ wrap: { qty: 1, size: "one_size" } });
    expect(firstUnmetSlot(c, sel)?.id).toBe("drink");
  });

  it("drops an edited line's pick that has gone unavailable, and never sends one", () => {
    const c: PublicCombo = { is_fixed: false, slots: [{ ...combo.slots[0], choices: [choice("water"), off("cola")] }] };
    const sel = initialSelection(c, [
      { slot_id: "drink", menu_item_id: "cola", size_label: null, quantity: 1, name: "cola", name_translations: {}, slot_name: "Drink", slot_name_translations: {}, extra: 0 },
    ]);
    expect(sel).toEqual({});
    // Even if a selection somehow holds it, the picks leave it out.
    expect(buildPicks(c, { drink: { cola: { qty: 1, size: "one_size" }, water: { qty: 1, size: "one_size" } } }).map((p) => p.menu_item_id)).toEqual(["water"]);
  });
});
