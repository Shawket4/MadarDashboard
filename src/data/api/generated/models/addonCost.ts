/* eslint-disable */
// @ts-nocheck

/**
 * Computed cost for one addon item.
 */
export interface AddonCost {
  addon_item_id: string;
  addon_type: string;
  /**
     * Ingredient cost rollup in piastres. `null` ⟺ unknown.
     * @nullable
     */
  cost?: number | null;
  cost_missing: boolean;
  /** @nullable */
  margin_pct?: number | null;
  name: string;
  /** Default price in piastres. */
  price: number;
}
