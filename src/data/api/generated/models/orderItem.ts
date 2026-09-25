/* eslint-disable */
// @ts-nocheck
import type { OrderItemNameTranslations } from './orderItemNameTranslations';

export interface OrderItem {
  /**
     * A part: its header's `id`.
     * @nullable
     */
  combo_line_id?: string | null;
  /** A part: its share of the combo price, whole line. */
  combo_share?: number;
  /**
     * A part: the slot it filled (soft: the slot may be gone since).
     * @nullable
     */
  combo_slot_id?: string | null;
  /**
     * A part: the slot's name at the sale.
     * @nullable
     */
  combo_slot_name?: string | null;
  /** A part: its choice and size surcharges, whole line. */
  combo_surcharge?: number;
  /**
     * A header: P per combo unit, as charged.
     * @nullable
     */
  combo_unit_price?: number | null;
  /** True when any cost component could not be resolved. */
  cost_missing: boolean;
  /**
     * A plain line: what an applied deal took off it, already out of
     * `line_total` (print it as a line discount, never subtract it again).
     */
  deal_minor?: number;
  deductions_snapshot: unknown;
  id: string;
  /**
     * A loyalty reward paid for some or all of this line. The receipt and the
     * kitchen say "Reward" beside it.
     */
  is_reward?: boolean;
  item_name: string;
  /**
     * Full line COGS in piastres (recipe + addons + optionals).
     * `null` ⟺ unknown.
     * @nullable
     */
  line_cost?: number | null;
  /**
     * Combos (additive). `item` = a plain line; `combo` = a combo's HEADER
     * (its `menu_item_id` is the combo; it carries no money: `unit_price` and
     * `line_total` are 0, P is in `combo_unit_price`); `combo_part` = one
     * chosen item of a combo, a real line of that item whose `line_total` is
     * `combo_share + combo_surcharge` and whose `unit_price` stays the item's
     * normal price at its size. Lines come header first, then its parts in
     * slot order.
     */
  line_kind?: string;
  line_total: number;
  /** @nullable */
  menu_item_id?: string | null;
  name_translations: OrderItemNameTranslations;
  /** @nullable */
  notes?: string | null;
  order_id: string;
  quantity: number;
  /** Minor units the reward took off this line (0 for a paid line). */
  reward_covered?: number;
  /** How many of `quantity` the reward covered. */
  reward_units?: number;
  /** @nullable */
  size_label?: string | null;
  /**
     * A staff drink: what the branch's pool comped on this line, in minor
     * units, size part and required-choice part together. ALREADY taken off
     * `line_total` (the size part) and the add-ons' `line_total` (their part):
     * print it as a line discount, never subtract it again. 0 on a paid line.
     */
  staff_comp_minor?: number;
  /**
     * The `staff_drinks` row this line is (`GET /staff-pool/drinks`).
     * @nullable
     */
  staff_drink_id?: string | null;
  /**
     * Recipe-only cost per unit in piastres (incl. swaps). `null` ⟺ unknown.
     * @nullable
     */
  unit_cost?: number | null;
  unit_price: number;
}
