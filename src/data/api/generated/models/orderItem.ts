/* eslint-disable */
// @ts-nocheck
import type { OrderItemNameTranslations } from './orderItemNameTranslations';

export interface OrderItem {
  /** @nullable */
  bundle_id?: string | null;
  /** @nullable */
  bundle_unit_price?: number | null;
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
     * Full line COGS in piastres (recipe + addons + optionals + components).
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
     * Recipe-only cost per unit in piastres (incl. swaps). `null` ⟺ unknown
     * or bundle line.
     * @nullable
     */
  unit_cost?: number | null;
  unit_price: number;
}
