/* eslint-disable */
// @ts-nocheck
import type { ReconciliationInput } from './reconciliationInput';

export interface CloseTillRequest {
  /** @nullable */
  cash_note?: string | null;
  /** @nullable */
  closed_at?: string | null;
  closing_cash_declared: number;
  /** @nullable */
  device_id?: string | null;
  /**
     * Absent (old clients) → every used method is stored `unreviewed`.
     * @nullable
     */
  reconciliation?: ReconciliationInput[] | null;
}
