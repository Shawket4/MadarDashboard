/* eslint-disable */
// @ts-nocheck

/**
 * Live per-size cost of an item from the NEW tables.
 */
export interface SizeCostOut {
  cost_incomplete: boolean;
  /**
     * Recipe cost rollup in piastres. `null` = unknown (no priced ingredient),
   * never 0. A partial rollup returns the sum-so-far with `cost_incomplete=true`.
     * @nullable
     */
  cost_piastres?: number | null;
  label: string;
  size_id: string;
}
