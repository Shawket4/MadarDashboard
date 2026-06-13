/* eslint-disable */
// @ts-nocheck

/**
 * Computed cost for one sellable SKU (menu item × size).
 */
export interface SkuCost {
  /** @nullable */
  category_id?: string | null;
  /**
     * Recipe cost rollup in piastres. `null` ⟺ unknown (no recipe, or any
   * ingredient unlinked / missing a cost).
     * @nullable
     */
  cost?: number | null;
  cost_missing: boolean;
  /**
     * `cost / price` when both known and price > 0.
     * @nullable
     */
  food_cost_pct?: number | null;
  item_name: string;
  /**
     * `(price - cost) / price` when both known and price > 0.
     * @nullable
     */
  margin_pct?: number | null;
  menu_item_id: string;
  /** Current price in piastres for this SKU. */
  price: number;
  /** `"one_size"` when the item has no sizes. */
  size_label: string;
}
