/* eslint-disable */
// @ts-nocheck

/**
 * One stored reconciliation line (§2.1).
 */
export interface TillReconciliationLine {
  /** `current_system_total <> system_total` — a late replay moved the total. */
  changed_after_close: boolean;
  current_system_total: number;
  /** @nullable */
  declared_amount?: number | null;
  is_cash: boolean;
  method: string;
  /** @nullable */
  note?: string | null;
  order_count: number;
  /** @nullable */
  payment_method_id?: string | null;
  reconciled_at: string;
  /** @nullable */
  reconciled_by?: string | null;
  /** `checked` | `disagreed` | `unreviewed` */
  status: string;
  system_total: number;
}
