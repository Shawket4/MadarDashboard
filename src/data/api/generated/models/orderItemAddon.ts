/* eslint-disable */
// @ts-nocheck
import type { OrderItemAddonNameTranslations } from './orderItemAddonNameTranslations';

export interface OrderItemAddon {
  addon_item_id: string;
  addon_name: string;
  id: string;
  /**
     * Ingredient cost of this addon line in piastres. `null` ⟺ unknown, or
     * a swap addon (its cost lives in the item's recipe cost).
     * @nullable
     */
  line_cost?: number | null;
  line_total: number;
  name_translations: OrderItemAddonNameTranslations;
  order_item_id: string;
  quantity: number;
  /**
     * The part of a staff drink's comp this pick absorbed (whole line), already
     * taken off `line_total`. 0 everywhere else.
     */
  staff_comp_minor?: number;
  unit_price: number;
}
