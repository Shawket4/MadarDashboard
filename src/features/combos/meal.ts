/**
 * "Make it a meal" (C14): which slots of a combo can take this item, and the
 * "+X" the till shows — the combo's price with this item in its slot and the
 * defaults everywhere else, minus what the item costs alone.
 *
 * Both are madar-catalog's (`combo::choice_for`, `combo::quote`), called
 * through WebAssembly; meal-vectors.test.ts asks them the crate's combo vectors.
 */
import { rules, type CatalogView, type PickIn, type SlotView } from "@/lib/rules";

import type { Combo, ComboChoiceWrite, ComboSlotWrite } from "./types";
import type { ItemOption } from "./use-menu-options";

export interface MealItem {
  id: string;
  category_id: string | null;
}

/** A slot as the rule reads it (a write shape leaves its defaults unset). */
const slotView = (s: ComboSlotWrite): SlotView => ({
  id: s.id ?? "",
  min: s.min,
  max: s.max,
  sort: s.sort ?? 0,
  default_item_id: s.default_item_id ?? null,
  default_size_label: s.default_size_label ?? null,
  choices: s.choices.map((c) => ({
    id: c.id ?? null,
    menu_item_id: c.menu_item_id ?? null,
    category_id: c.category_id ?? null,
    surcharge: c.surcharge ?? 0,
    included_size_label: c.included_size_label ?? null,
    size_surcharges: c.size_surcharges ?? [],
    sort: c.sort ?? 0,
  })),
});

/** The choice in `slot` that admits the item: its own item choice first, else its category. */
export function choiceFor(slot: ComboSlotWrite, item: MealItem): ComboChoiceWrite | undefined {
  return rules.combo_choice_for(slotView(slot), item.id, item.category_id) ?? undefined;
}

export const slotsAdmitting = (combo: Pick<Combo, "slots">, item: MealItem): ComboSlotWrite[] =>
  combo.slots.filter((s) => !!choiceFor(s, item));

/** An item as the rule prices it: the sizes it sells, at their (branch-effective) price. */
const catalogView = (it: ItemOption): CatalogView => ({
  item: { id: it.id, sizes: it.sizes.map((s) => ({ label: s.label, price: s.price, is_active: true })) },
});

/**
 * The "+X": null when the slot doesn't admit the item, a slot's default can't
 * be found, or the combo can't be priced. The item is priced at the size the
 * combo includes for it; every other pick is its slot's default (its default
 * item, else its first item choice) at the default size, slot minimum times.
 */
export function mealDelta(
  combo: Pick<Combo, "price" | "slots">,
  slotId: string,
  item: ItemOption,
  lookup: (id: string) => ItemOption | undefined,
): number | null {
  const slot = combo.slots.find((s) => s.id === slotId);
  if (!slot || !choiceFor(slot, item)) return null;
  const picks: PickIn[] = [{ slot_id: slotId, view: catalogView(item), category_id: item.category_id, quantity: 1 }];
  for (const s of combo.slots) {
    const n = s.id === slotId ? s.min - 1 : s.min;
    if (n <= 0) continue;
    const id = s.default_item_id ?? s.choices.find((c) => !!c.menu_item_id)?.menu_item_id;
    const it = id ? lookup(id) : undefined;
    // ponytail: a slot of category choices with no default item has no pick to price; the till then asks.
    if (!it) return null;
    picks.push({
      slot_id: s.id ?? "",
      view: catalogView(it),
      category_id: it.category_id,
      selection: { size_label: s.default_size_label ?? null },
      quantity: n,
    });
  }
  const q = rules.combo_quote({ id: "", price: combo.price, slots: combo.slots.map(slotView) }, picks, 1);
  if ("refusal" in q) return null;
  const own = q.parts.find((p) => p.pick_index === 0)!;
  return q.unit_total - own.unit_price;
}
