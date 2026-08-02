/* eslint-disable */
// @ts-nocheck

export interface BranchComparison {
  avg_order_value: number;
  branch_id: string;
  branch_name: string;
  /** The cash slice of `total_tips`. */
  cash_tips?: number;
  /** Goods only, by method actually tendered. Tips are in `total_tips`. */
  revenue_by_method: unknown;
  total_orders: number;
  total_revenue: number;
  /** Tips, standalone — same definition as on the branch sales + shift reports. */
  total_tips?: number;
  void_rate_pct: number;
  voided_orders: number;
}
