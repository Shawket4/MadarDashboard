/* eslint-disable */
// @ts-nocheck

/**
 * Computed cost for one sellable SKU (menu item × size).
 */
export interface SkuCost {
  /** @nullable */
  category_id?: string | null;
  /**
     * Recipe cost rollup in piastres over the ingredients that *are* priced.
   * `null` only when there is no recipe, or no recipe ingredient has a known
   * cost at all. A partial rollup (some ingredients unpriced) still returns
   * the sum so far, with `cost_missing = true` flagging it as incomplete.
     * @nullable
     */
  cost?: number | null;
  /** `true` when at least one recipe ingredient is unlinked or has no cost, so
   * `cost` (if any) is a partial figure rather than the full COGS. */
  cost_missing: boolean;
  /**
     * `cost / price` — only when the cost is *complete* and price > 0.
     * @nullable
     */
  food_cost_pct?: number | null;
  item_name: string;
  /**
     * `(price - cost) / price` — only when the cost is *complete* and price > 0.
   * Suppressed (`null`) for partial rollups so an incomplete cost is never
   * graded as a food-cost percentage.
     * @nullable
     */
  margin_pct?: number | null;
  menu_item_id: string;
  /** Current price in piastres for this SKU. */
  price: number;
  /** `"one_size"` when the item has no sizes. */
  size_label: string;
}
