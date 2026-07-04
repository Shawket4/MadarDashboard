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
  unit_price: number;
}
