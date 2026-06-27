/* eslint-disable */
// @ts-nocheck

/**
 * Computed cost for one addon item.
 */
export interface AddonCost {
  addon_item_id: string;
  addon_type: string;
  /**
     * Ingredient cost rollup in piastres over the ingredients that *are*
   * priced. A partial rollup still returns the sum so far, with
   * `cost_missing = true`; `null` only when nothing is priced.
     * @nullable
     */
  cost?: number | null;
  /** `true` when at least one ingredient is unlinked or has no cost, so `cost`
   * (if any) is partial rather than the full figure. */
  cost_missing: boolean;
  /**
     * `(price - cost) / price` — only when the cost is *complete* and price > 0.
     * @nullable
     */
  margin_pct?: number | null;
  name: string;
  /** Default price in piastres. */
  price: number;
}
