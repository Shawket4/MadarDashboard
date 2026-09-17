/* eslint-disable */
// @ts-nocheck

export interface VoidOrderRequest {
  /**
     * Free-text explanation. Required when `reason` is "other".
     * @nullable
     */
  note?: string | null;
  reason: string;
  /**
     * Ignored: a void always puts the sale's stock back. Kept so older tills
     * that still send it are read, not refused.
     * @nullable
     */
  restore_inventory?: boolean | null;
  /** @nullable */
  voided_at?: string | null;
}
