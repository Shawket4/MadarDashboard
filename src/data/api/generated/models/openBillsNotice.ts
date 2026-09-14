/* eslint-disable */
// @ts-nocheck

export interface OpenBillsNotice {
  old_bill_hours: number;
  old_bills_count: number;
  /** @nullable */
  oldest_opened_at?: string | null;
  open_bills_amount: number;
  open_bills_count: number;
  seated_tables_count: number;
  /**
     * `closed_at` of the most recent closed till at the branch.
     * @nullable
     */
  since?: string | null;
}
