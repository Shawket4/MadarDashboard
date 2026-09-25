/**
 * The combo picker's rules, apart from its looks.
 *
 * A combo is sold as one line with a price of its own; the customer fills its
 * slots ("a Coffee", "a Dessert") from the choices the owner allowed. The
 * server prices it (`POST …/cart-quote`, and again at intake) — everything
 * here is the ESTIMATE the picker shows while the customer chooses, and the
 * picks the server needs to be told.
 */
import type { TFunction } from "i18next";

import type { DeliveryMenuItem } from "@/data/api/generated/models/deliveryMenuItem";
import type { PublicCombo } from "@/data/api/generated/models/publicCombo";
import type { PublicComboChoice } from "@/data/api/generated/models/publicComboChoice";
import type { PublicComboSlot } from "@/data/api/generated/models/publicComboSlot";

import type { ComboPick } from "./types";
import { displaySize } from "./utils";

/** A slot's picks: menu_item_id → how many (per combo) and at which size. */
export type SlotSelection = Record<string, { qty: number; size: string }>;
/** Every slot's picks, by slot id. */
export type ComboSelection = Record<string, SlotSelection>;

/** Is this menu item a combo the picker can fill? */
export const isCombo = (item: DeliveryMenuItem | null | undefined): boolean =>
  !!item && item.kind === "combo" && !!item.combo;

/** The slots in the order the owner arranged them. */
export const sortedSlots = (combo: PublicCombo): PublicComboSlot[] =>
  [...combo.slots].sort((a, b) => a.sort - b.sort);

/**
 * A slot the customer has nothing to decide in: a fixed bundle, or one choice
 * that must be taken exactly so many times. It is filled in and shown, not asked.
 */
export const isLockedSlot = (combo: PublicCombo, slot: PublicComboSlot): boolean =>
  combo.is_fixed || (slot.choices.length === 1 && slot.min === slot.max && slot.min > 0);

/** How many units a slot holds right now. */
export const slotCount = (sel: SlotSelection | undefined): number =>
  Object.values(sel ?? {}).reduce((n, p) => n + p.qty, 0);

/** The size a choice starts at: the one the combo includes. */
const includedSize = (choice: PublicComboChoice): string =>
  choice.included_size_label || choice.sizes[0]?.label || "";

/** A size the choice actually offers, or its included size. */
const validSize = (choice: PublicComboChoice, label: string | null | undefined): string =>
  label && choice.sizes.some((s) => s.label === label) ? label : includedSize(choice);

/** What one unit of this choice at this size adds to the combo's price. */
export const choiceExtra = (choice: PublicComboChoice, size: string | null): number => {
  const s = choice.sizes.find((x) => x.label === size);
  return choice.surcharge + (s?.extra ?? 0);
};

/**
 * Where the picker opens: the line's own picks when editing; otherwise each
 * locked slot filled, each slot with a default choice pre-picked, and the rest
 * left for the customer.
 */
export function initialSelection(combo: PublicCombo, editing?: ComboPick[] | null): ComboSelection {
  const out: ComboSelection = {};
  const slots = sortedSlots(combo);
  if (editing && editing.length > 0) {
    for (const p of editing) {
      const slot = slots.find((s) => s.id === p.slot_id);
      const choice = slot?.choices.find((c) => c.menu_item_id === p.menu_item_id);
      if (!slot || !choice) continue;
      (out[slot.id] ??= {})[choice.menu_item_id] = {
        qty: p.quantity,
        size: validSize(choice, p.size_label),
      };
    }
    return out;
  }
  for (const slot of slots) {
    const byDefault = slot.choices.find((c) => c.menu_item_id === slot.default_item_id);
    const locked = isLockedSlot(combo, slot);
    const choice = byDefault ?? (locked ? slot.choices[0] : undefined);
    if (!choice) continue;
    const qty = Math.min(Math.max(slot.min, 1), Math.max(slot.max, 1));
    out[slot.id] = {
      [choice.menu_item_id]: {
        qty,
        size: validSize(choice, byDefault ? slot.default_size_label : null),
      },
    };
  }
  return out;
}

/** The first slot the selection does not satisfy yet, if any. */
export const firstUnmetSlot = (
  combo: PublicCombo,
  sel: ComboSelection,
): PublicComboSlot | null =>
  sortedSlots(combo).find((s) => {
    const n = slotCount(sel[s.id]);
    return n < s.min || n > s.max;
  }) ?? null;

/** The selection as cart picks: slot order, then the owner's choice order. */
export function buildPicks(combo: PublicCombo, sel: ComboSelection): ComboPick[] {
  const picks: ComboPick[] = [];
  for (const slot of sortedSlots(combo)) {
    const slotSel = sel[slot.id] ?? {};
    for (const choice of slot.choices) {
      const p = slotSel[choice.menu_item_id];
      if (!p || p.qty <= 0) continue;
      picks.push({
        slot_id: slot.id,
        menu_item_id: choice.menu_item_id,
        // Only a real choice of size is worth sending or showing.
        size_label: choice.sizes.length > 1 ? displaySize(p.size) : null,
        quantity: p.qty,
        name: choice.name,
        name_translations: choice.name_translations,
        slot_name: slot.name,
        slot_name_translations: slot.name_translations,
        extra: choiceExtra(choice, p.size),
      });
    }
  }
  return picks;
}

/** What the slot asks for, in a few words: "Pick 1", "Pick 2 to 3", "Optional". */
export function slotHint(slot: PublicComboSlot, t: TFunction): string {
  if (slot.min <= 0)
    return slot.max <= 1
      ? t("order.combo.optional", "Optional")
      : t("order.combo.optionalUpTo", { defaultValue: "Optional · up to {{count}}", count: slot.max });
  if (slot.min === slot.max) return t("order.combo.pickN", { defaultValue: "Pick {{count}}", count: slot.min });
  return t("order.combo.pickRange", { defaultValue: "Pick {{min}} to {{max}}", min: slot.min, max: slot.max });
}
