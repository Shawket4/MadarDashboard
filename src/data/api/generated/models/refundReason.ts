/* eslint-disable */
// @ts-nocheck

/**
 * Why money went back. The first three share their spelling with
 * [`crate::orders::VoidReason`] so a report reads "wrong order" across voids
 * and refunds alike; the rest exist only for refunds (you do not void a sale
 * for being late). Bound as text; the table's CHECK is the authority on the
 * vocabulary and this enum mirrors it.
 */
export type RefundReason = typeof RefundReason[keyof typeof RefundReason];


export const RefundReason = {
  customer_request: 'customer_request',
  wrong_order: 'wrong_order',
  quality_issue: 'quality_issue',
  overcharged: 'overcharged',
  late_or_undelivered: 'late_or_undelivered',
  goodwill: 'goodwill',
  other: 'other',
} as const;
