/* eslint-disable */
// @ts-nocheck

export interface BranchComparison {
  avg_order_value: number;
  branch_id: string;
  branch_name: string;
  /** The cash slice of `total_tips`. */
  cash_tips?: number;
  gross_sales?: number;
  refunded_amount?: number;
  /**
     * Goods only, by method actually tendered — money in. Tips are in
     * `total_tips`; refunds are not netted from the buckets.
     */
  revenue_by_method: unknown;
  total_orders: number;
  /** Net of refunds: `gross_sales − refunded_amount`. */
  total_revenue: number;
  /** Tips, standalone — same definition as on the branch sales + shift reports. */
  total_tips?: number;
  void_rate_pct: number;
  voided_orders: number;
}
