/**
 * madar-shared's combo_vectors.json (src/lib, pinned to its tag): the cases
 * `madar_catalog::combo::quote` is tested against. "Make it a meal" is one such
 * quote — the item in its slot at its included size, every other pick a slot
 * default — so each case whose picks fit that shape is asked again as a +X:
 * the quote's unit total less the item alone. Every part's surcharge is checked
 * against `pickExtra` too.
 */
import { describe, expect, it } from "vitest";

import vectors from "@/lib/combo_vectors.json";

import { choiceFor, mealDelta, pickExtra } from "./meal";
import type { Combo } from "./types";
import type { ItemOption } from "./use-menu-options";

interface VSize { label: string; price?: number | null; is_active: boolean; branch_price?: number | null }
interface VPick { slot_id: string; item: string; category_id?: string | null; selection: { size_label: string | null }; quantity: number }
interface VPart { pick_index: number; unit_price: number; size_label: string; included_size_label: string; surcharge_unit: number; extras_unit: number }
interface VCase {
  name: string;
  combo: string;
  picks: VPick[];
  expected: { quote?: { unit_total: number; parts: VPart[] }; refusal?: { refusal: string; error?: { error: string } } };
}
type MealCombo = Pick<Combo, "price" | "slots">;

const items = vectors.items as unknown as Record<string, { item: { id: string; sizes: VSize[] } }>;
const combos = vectors.combos as unknown as Record<string, MealCombo>;
const cases = vectors.cases as unknown as VCase[];

/**
 * What `GET /menu-items?full=true&branch_id=…` hands useMenuOptions for the
 * view: its active sizes at their branch-effective price, cheapest first.
 */
const option = (p: VPick): ItemOption => {
  const it = items[p.item].item;
  const sizes = it.sizes
    .filter((s) => s.is_active && (s.branch_price ?? s.price) != null)
    .map((s) => ({ label: s.label, price: (s.branch_price ?? s.price) as number }))
    .sort((a, b) => a.price - b.price);
  return { id: it.id, name: it.id, category_id: p.category_id ?? null, is_active: true, sizes };
};

const quotes = cases.filter((c) => c.expected.quote);

describe("make it a meal matches madar-shared's combo quotes", () => {
  it("covers the quote cases", () => expect(quotes.length).toBeGreaterThanOrEqual(15));

  it.each(quotes)("$name: each part's surcharge", (c) => {
    const combo = combos[c.combo];
    for (const part of c.expected.quote!.parts) {
      const p = c.picks[part.pick_index];
      const it = option(p);
      const choice = choiceFor(combo.slots.find((s) => s.id === p.slot_id)!, it)!;
      expect(pickExtra(choice, it, p.selection.size_label)).toBe(part.surcharge_unit);
    }
  });

  // The +X prices one default per slot at its minimum and no add-ons, so a
  // case is re-asked only when its picks are exactly that.
  const meals = quotes.flatMap((c) => {
    const q = c.expected.quote!;
    if (q.parts.some((p) => p.extras_unit !== 0)) return [];
    const combo = combos[c.combo];
    const fits = combo.slots.every((s) => {
      const picks = c.picks.filter((p) => p.slot_id === s.id);
      return picks.reduce((n, p) => n + p.quantity, 0) === s.min && new Set(picks.map((p) => p.item)).size <= 1;
    });
    const own = q.parts.find((p) => p.size_label === p.included_size_label);
    return fits && own ? [{ ...c, own }] : [];
  });

  it("re-asks most of them as a +X", () => expect(meals.length).toBeGreaterThanOrEqual(10));

  it.each(meals)("$name: +X = the quote less the item alone", (c) => {
    const base = combos[c.combo];
    const pick = c.picks[c.own.pick_index];
    const combo: MealCombo = {
      ...base,
      slots: base.slots.map((s) => {
        const p = c.picks.find((x) => x.slot_id === s.id);
        return { ...s, default_item_id: p ? items[p.item].item.id : null, default_size_label: p?.selection.size_label ?? null };
      }),
    };
    const byId = new Map(c.picks.map((p) => [items[p.item].item.id, option(p)]));
    expect(mealDelta(combo, pick.slot_id, option(pick), (id) => byId.get(id))).toBe(c.expected.quote!.unit_total - c.own.unit_price);
  });

  it("no_priced_size: an item with no priced size has no +X (the server refuses its quote)", () => {
    const c = cases.find((x) => x.name === "no_priced_size")!;
    expect(c.expected.refusal?.error?.error).toBe("no_priced_size");
    const it = option(c.picks[0]);
    expect(it.sizes).toEqual([]);
    expect(mealDelta(combos[c.combo], c.picks[0].slot_id, it, () => it)).toBeNull();
  });
  it("an included size the item no longer sells costs its lowest (unit_price's fallback)", () => {
    // lunch includes a Regular latte; with Regular switched off, unit_price(Regular)
    // falls back to the lowest active size, Large 6000: the quote is still 15000,
    // so the +X is 15000 − 6000 = 9000 (it used to vanish).
    const drink = { slot_id: "s-drink", item: "latte", selection: { size_label: null }, quantity: 1 };
    const latte = { ...option(drink), sizes: option(drink).sizes.filter((s) => s.label !== "Regular") };
    const byId = new Map([["latte", latte], ["burger", option({ ...drink, item: "burger" })], ["fries", option({ ...drink, item: "fries" })]]);
    const lunch = combos.lunch;
    const combo: MealCombo = { ...lunch, slots: lunch.slots.map((s) => ({ ...s, default_item_id: s.choices[0].menu_item_id })) };
    expect(mealDelta(combo, "s-drink", latte, (id) => byId.get(id))).toBe(9000);
  });

  // Skipped: the validation refusals (too_few, too_many, not_allowed, …) — the
  // +X builds a valid pick set by construction; unknown_option — no add-ons.
});
