/* eslint-disable */
// @ts-nocheck
import type { AuditBreakdownEntry } from './auditBreakdownEntry';
import type { DiscountAuditEntry } from './discountAuditEntry';

export interface AuditReport {
  by_issuer: AuditBreakdownEntry[];
  /**
     * Discounts audit only: by act (`preset` / `manual_amount` /
     * `manual_percent`; `unattributed` for sales from before). Additive.
     * @nullable
     */
  by_kind?: AuditBreakdownEntry[] | null;
  by_reason: AuditBreakdownEntry[];
  /**
     * Discounts audit only: the most recent discounted sales, newest first
     * (at most 200). Additive.
     * @nullable
     */
  entries?: DiscountAuditEntry[] | null;
  /** @nullable */
  from?: string | null;
  /** @nullable */
  to?: string | null;
  total_amount_minor: number;
  total_count: number;
}
