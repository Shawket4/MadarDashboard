/* eslint-disable */
// @ts-nocheck

/**
 * Why a sale or a bill was torn up — the `void_reason` enum, shared by
 * `orders` and `open_tickets` so a void-rate report reads counter and dine-in
 * alike without a translation layer. Bound as text and cast in SQL
 * (`$n::void_reason`), the way the order void has always done it.
 */
export type VoidReason = typeof VoidReason[keyof typeof VoidReason];


export const VoidReason = {
  customer_request: 'customer_request',
  wrong_order: 'wrong_order',
  quality_issue: 'quality_issue',
  other: 'other',
} as const;
