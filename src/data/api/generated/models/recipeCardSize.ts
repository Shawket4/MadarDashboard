/* eslint-disable */
// @ts-nocheck

/**
 * One column: a size of the item, with what its recipe costs.
 */
export interface RecipeCardSize {
  /**
     * The recipe base this size expands, if any.
     * @nullable
     */
  base_name?: string | null;
  cost_incomplete: boolean;
  /**
     * The recipe's cost in piastres; `null` when there is no recipe or no
     * line is costed. With `cost_incomplete` it is the sum of the known lines.
     * @nullable
     */
  cost_piastres?: number | null;
  /**
     * `cost / price` as a fraction (0–1), only for a complete cost and a
     * price above 0.
     * @nullable
     */
  food_cost_pct?: number | null;
  is_active: boolean;
  /** `one_size` for a single-price item. */
  label: string;
  /**
     * `(price − cost) / price` as a fraction, on the same terms.
     * @nullable
     */
  margin_pct?: number | null;
  /** The org's price, in piastres. */
  price: number;
  size_id: string;
}
