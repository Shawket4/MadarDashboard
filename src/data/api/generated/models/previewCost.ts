/* eslint-disable */
// @ts-nocheck

export interface PreviewCost {
  /** At least one deducted line has no cost: `total` is partial. */
  cost_missing: boolean;
  /**
     * `(price − cost) / price` (fraction, like `/costing`); null when the cost
     * is partial or the price is 0.
     * @nullable
     */
  margin_pct?: number | null;
  /** Piastres over the deducted lines with a known cost. */
  total: number;
}
