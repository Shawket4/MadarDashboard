/* eslint-disable */
// @ts-nocheck

export interface VoidOrderRequest {
  reason: string;
  /** @nullable */
  restore_inventory?: boolean | null;
  /** @nullable */
  voided_at?: string | null;
}
