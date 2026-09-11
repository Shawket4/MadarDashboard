/* eslint-disable */
// @ts-nocheck
import type { RefundFull } from './refundFull';
import type { RefundTotals } from './refundTotals';

export type OrderRefunds = RefundTotals & {
  order_id: string;
  order_status: string;
  refundable_remaining: number;
  refunds: RefundFull[];
  total_amount: number;
};
