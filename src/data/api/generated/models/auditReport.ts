/* eslint-disable */
// @ts-nocheck
import type { AuditBreakdownEntry } from './auditBreakdownEntry';
import type { DeductionOverrideEvent } from './deductionOverrideEvent';
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
  /**
     * Deduction overrides audit only: every waive, unwaive and override
     * event with who, when and why, newest first (at most 500) — the
     * history, so a waiver later undone still shows (owner decision D8,
     * AT-10). Additive.
     * @nullable
     */
  history?: DeductionOverrideEvent[] | null;
  /** @nullable */
  to?: string | null;
  total_amount_minor: number;
  total_count: number;
}
