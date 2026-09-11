/* eslint-disable */
// @ts-nocheck
import type { Refund } from './refund';
import type { RefundLine } from './refundLine';

export type RefundFull = Refund & {
  lines: RefundLine[];
};
