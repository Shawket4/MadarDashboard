/* eslint-disable */
// @ts-nocheck

/**
 * One cell: an ingredient's amount in one size.
 */
export interface RecipeCardCell {
  /**
     * What the line costs in piastres; `null` = unknown (or no line).
     * @nullable
     */
  line_cost_piastres?: number | null;
  /**
     * The usable amount in the row's unit; `null` = not in this size.
     * @nullable
     */
  quantity?: number | null;
}
