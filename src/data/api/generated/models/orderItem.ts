/* eslint-disable */
// @ts-nocheck
import type { OrderItemNameTranslations } from './orderItemNameTranslations';

export interface OrderItem {
  /** True when any cost component could not be resolved. */
  cost_missing: boolean;
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
