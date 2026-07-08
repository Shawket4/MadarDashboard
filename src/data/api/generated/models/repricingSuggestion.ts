/* eslint-disable */
// @ts-nocheck

/**
 * One repricing suggestion: an underpriced SKU + the price that would restore
 * the target margin.
 */
export interface RepricingSuggestion {
  /** True when the item currently sells BELOW cost (negative margin). */
  below_cost: boolean;
  /** Complete recipe cost, piastres. */
  cost: number;
  /** Current selling price, piastres. */
  current_price: number;
  item_name: string;
  /** `(price − cost) / price`, current. */
  margin_pct: number;
  menu_item_id: string;
  /** `"one_size"` for items without sizes. */
  size_label: string;
  /** Target-restoring price `ceil(cost / (1 − target))` to whole EGP, piastres. */
  suggested_price: number;
  /** The org/branch target margin this suggestion aims for. */
  target_pct: number;
  /** `suggested_price − current_price`, piastres. */
  uplift: number;
}
