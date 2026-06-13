/* eslint-disable */
// @ts-nocheck
import type { VarianceRow } from './varianceRow';

export interface VarianceReport {
  /** overage − shrinkage (net effect on inventory value). */
  net_variance_value: number;
  rows: VarianceRow[];
  stocktake_id: string;
  /** Piastres of overage (positive variances). */
  total_overage_value: number;
  /** Piastres lost to shrinkage (negative variances), as a positive number. */
  total_shrinkage_value: number;
  /** Count of counted rows whose cost was unknown (excluded from totals). */
  unknown_cost_count: number;
  /** Org tolerance used to compute `is_flagged`. */
  variance_threshold_pct: number;
}
