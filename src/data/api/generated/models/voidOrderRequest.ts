/* eslint-disable */
// @ts-nocheck

export interface VoidOrderRequest {
  /**
     * Free-text explanation. Required when `reason` is "other".
     * @nullable
     */
  note?: string | null;
  reason: string;
  /** @nullable */
  restore_inventory?: boolean | null;
  /** @nullable */
  voided_at?: string | null;
}
