/* eslint-disable */
// @ts-nocheck
import type { QuotedDeal } from './quotedDeal';
import type { QuotedLine } from './quotedLine';

export interface CartQuote {
  /** Σ deals' discount. */
  deal_discount: number;
  deals: QuotedDeal[];
  /** Σ line_total, before deals. */
  items_total: number;
  lines: QuotedLine[];
  /** `items_total − deal_discount` (before the channel discount, tax and fees). */
  total_after_deals: number;
}
