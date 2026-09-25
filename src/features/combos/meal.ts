/**
 * "Make it a meal" (C14): which slots of a combo can take this item, and the
 * "+X" the till shows — the combo's price with this item in its slot and the
 * defaults everywhere else, minus what the item costs alone.
 *
 * It mirrors `madar_catalog::combo::quote` for that one case (no add-ons):
 * each pick pays its choice surcharge, plus a size extra when the default
 * size isn't the included one (the owner's size surcharge, else the usual
 * difference, C9).
 */
import type { Combo, ComboChoiceWrite, ComboSlotWrite } from "./contract";
import type { ItemOption } from "./use-menu-options";

export interface MealItem {
  id: string;
  category_id: string | null;
}

/** The choice in `slot` that admits the item: its own item choice first, else its category. */
export function choiceFor(slot: ComboSlotWrite, item: MealItem): ComboChoiceWrite | undefined {
  return (
    slot.choices.find((c) => c.menu_item_id === item.id) ??
    (item.category_id ? slot.choices.find((c) => !!c.category_id && c.category_id === item.category_id) : undefined)
  );
}

export const slotsAdmitting = (combo: Pick<Combo, "slots">, item: MealItem): ComboSlotWrite[] =>
  combo.slots.filter((s) => !!choiceFor(s, item));

const includedLabel = (c: ComboChoiceWrite, it: ItemOption | undefined): string | undefined =>
  c.included_size_label ?? it?.sizes[0]?.label;

/** What one pick of `it` through choice `c` at `sizeLabel` adds on top of the combo price. */
function pickExtra(c: ComboChoiceWrite, it: ItemOption | undefined, sizeLabel: string | null): number {
  const inc = includedLabel(c, it);
  let sizeExtra = 0;
  if (sizeLabel && inc && sizeLabel !== inc) {
    const owner = c.size_surcharges.find((x) => x.size_label === sizeLabel);
    if (owner) sizeExtra = owner.surcharge;
    else {
      const chosen = it?.sizes.find((s) => s.label === sizeLabel)?.price;
      const base = it?.sizes.find((s) => s.label === inc)?.price;
      sizeExtra = chosen !== undefined && base !== undefined ? Math.max(0, chosen - base) : 0;
    }
  }
  return c.surcharge + sizeExtra;
}

/** A slot's default pick: its default item (or its first item choice), and that pick's extra. */
function defaultExtra(slot: ComboSlotWrite, lookup: (id: string) => ItemOption | undefined): number {
  const id = slot.default_item_id ?? slot.choices.find((c) => !!c.menu_item_id)?.menu_item_id ?? null;
  const it = id ? lookup(id) : undefined;
  const c = it ? choiceFor(slot, { id: it.id, category_id: it.category_id }) : slot.choices[0];
  return c ? pickExtra(c, it, slot.default_size_label) : 0;
}

/**
 * The "+X": null when the slot doesn't admit the item or its price is unknown.
 * The item is priced at the size the combo includes for it.
 */
export function mealDelta(
  combo: Pick<Combo, "price" | "slots">,
  slotId: string,
  item: ItemOption,
  lookup: (id: string) => ItemOption | undefined,
): number | null {
  const slot = combo.slots.find((s) => s.id === slotId);
  const own = slot ? choiceFor(slot, item) : undefined;
  if (!slot || !own) return null;
  const inc = includedLabel(own, item);
  const alone = item.sizes.find((s) => s.label === inc)?.price;
  if (alone === undefined) return null;
  let total = combo.price + pickExtra(own, item, null);
  for (const s of combo.slots) {
    const picks = s.id === slotId ? Math.max(0, s.min - 1) : s.min;
    if (picks > 0) total += picks * defaultExtra(s, lookup);
  }
  return total - alone;
}
