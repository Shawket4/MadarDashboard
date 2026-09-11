/* eslint-disable */
// @ts-nocheck

export interface ShiftSummary {
  branch_id: string;
  branch_name: string;
  /** @nullable */
  cash_discrepancy?: number | null;
  /** The cash slice of `total_tips`. */
  cash_tips?: number;
  /** @nullable */
  closed_at?: string | null;
  /** @nullable */
  closing_cash_declared?: number | null;
  /** @nullable */
  closing_cash_system?: number | null;
  /**
     * This shift's sales as rung up, before any refund. Was what
     * `total_revenue` meant until 2026-09.
     */
  gross_sales?: number;
  opened_at: string;
  opening_cash: number;
  /**
     * Money refunded AGAINST this shift's sales, whenever and from whichever
     * drawer it was issued. `gross_sales − refunded_amount = total_revenue`.
     * A fully refunded sale is out of all three (its status is `refunded`).
     */
  refunded_amount?: number;
  refunds_issued_amount?: number;
  refunds_issued_cash?: number;
  /**
     * Refunds ISSUED IN THIS SHIFT — keyed on `order_refunds.shift_id`, the
     * drawer the money left, which need not be the shift that made the sale.
     * This is the Z-report's money-out line: `refunds_issued_cash` is what the
     * drawer is short by relative to its cash sales.
     */
  refunds_issued_count?: number;
  /**
     * Goods only, by method actually tendered — money IN. Tips are in
     * `total_tips`; refunds are not netted from these buckets (they are money
     * OUT, with their own tender — see `refunds_issued_*`).
     */
  revenue_by_method: unknown;
  shift_id: string;
  status: string;
  teller_id: string;
  teller_name: string;
  /**
     * Delivery fees on this shift's sales. Inside `total_revenue` (the
     * customer paid them) but outside the tax base and not food revenue.
     */
  total_delivery_fees?: number;
  total_discount: number;
  total_orders: number;
  /**
     * What this shift's sales are worth after refunds: `gross_sales` less
     * `refunded_amount`. Same definition as `total_revenue` on the branch
     * sales report, so the two reconcile.
     */
  total_revenue: number;
  /**
     * Service charge added to this shift's dine-in bills. Inside
     * `total_revenue` as the shop's income; see `analytics::schema` for why.
     */
  total_service_charge?: number;
  total_tax: number;
  /** Tips, standalone — matches `total_tips` on `GET /shifts/{id}/report`. */
  total_tips?: number;
  voided_orders: number;
}
