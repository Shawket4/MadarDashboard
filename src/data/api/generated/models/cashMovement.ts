/* eslint-disable */
// @ts-nocheck

export interface CashMovement {
  amount: number;
  /** @nullable */
  client_ref?: string | null;
  /** @nullable */
  corrects_id?: string | null;
  created_at: string;
  /** @nullable */
  device_id?: string | null;
  id: string;
  kind: string;
  moved_by: string;
  moved_by_name: string;
  note: string;
  /** DEPRECATED: same value as `till_id` (kept for POS v0.5.1/v0.6.0). */
  shift_id: string;
  till_id: string;
}
