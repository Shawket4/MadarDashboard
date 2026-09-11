/* eslint-disable */
// @ts-nocheck
import type { RefundFull } from './refundFull';
import type { RefundTotals } from './refundTotals';

export type ShiftRefunds = RefundTotals & {
  refunds: RefundFull[];
  shift_id: string;
};
