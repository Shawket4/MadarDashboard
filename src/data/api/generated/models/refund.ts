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
  /** How much of `amount` was service charge, the same way. Additive. */
  service_charge_amount?: number;
  /** DEPRECATED: same value as `till_id`. */
  shift_id: string;
  /**
     * How much of `amount` was tax, taken back pro rata of the order's own
     * tax (filled by the database, cumulatively across the order's refunds,
     * so a full refund takes back exactly the order's tax). Additive.
     */
  tax_amount?: number;
  /**
     * The shift the refund was ISSUED in — the drawer the money left. Not
     * necessarily the till the order was sold in.
     */
  till_id: string;
}
