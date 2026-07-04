/* eslint-disable */
// @ts-nocheck

export interface LedgerTotals {
  /**
     * Σ(target·revenue − margin) over below-target rows — "margin left on
     * the table" this period, in piastres.
     */
  below_target_gap: number;
  /** Cost summed over rows where it is known. */
  cost_known: number;
  margin_known: number;
  /** @nullable */
  margin_pct?: number | null;
  prev_margin_known: number;
  prev_revenue: number;
  revenue: number;
  /** Revenue sitting on rows whose cost is unknown (visibly reconciles). */
  revenue_cost_unknown: number;
}
