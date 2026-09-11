/* eslint-disable */
// @ts-nocheck
import type { RefundFull } from './refundFull';
import type { RefundTotals } from './refundTotals';

/**
 * What `POST /refunds` returns: the refund, plus where the order now stands
 * so the till can print "fully refunded" without a second request.
 */
export type RefundIssued = RefundFull & RefundTotals & {
  /**
     * `orders.status` after this refund — `refunded` only when the cumulative
     * amount reached the total (the trigger's rule, not this module's).
     */
  order_status: string;
  /** `total_amount − refunded_amount`: what may still be returned. */
  refundable_remaining: number;
};
