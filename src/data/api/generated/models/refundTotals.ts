/* eslint-disable */
// @ts-nocheck

/**
 * "Everything returned" — against one order, or in one shift. Read from
 * `v_order_refund_totals` for an order and summed by `shift_id` for a shift.
 */
export interface RefundTotals {
  refund_count: number;
  refunded_amount: number;
  /** The cash slice of `refunded_amount` — what left a drawer. */
  refunded_cash: number;
}
