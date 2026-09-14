/* eslint-disable */
// @ts-nocheck
import type { RefundFull } from './refundFull';
import type { RefundTotals } from './refundTotals';

export type TillRefunds = RefundTotals & {
  refunds: RefundFull[];
  /** DEPRECATED: same value as `till_id` (POS v0.6.0 decodes `ShiftRefunds`). */
  shift_id: string;
  till_id: string;
};
