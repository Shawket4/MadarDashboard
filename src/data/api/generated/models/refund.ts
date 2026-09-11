/* eslint-disable */
// @ts-nocheck

export interface Refund {
  amount: number;
  branch_id: string;
  /** @nullable */
  client_ref?: string | null;
  created_at: string;
  id: string;
  /** Whether `method` meant cash when the refund was issued. Snapshotted. */
  is_cash: boolean;
  issued_at: string;
  issued_by: string;
  issued_by_name: string;
  method: string;
  /** @nullable */
  note?: string | null;
  order_id: string;
  /** One of the [`RefundReason`] spellings. */
  reason: string;
  /**
     * The shift the refund was ISSUED in — the drawer the money left. Not
     * necessarily the shift the order was sold in.
     */
  shift_id: string;
}
