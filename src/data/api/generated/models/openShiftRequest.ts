/* eslint-disable */
// @ts-nocheck

/**
 * Request of the legacy open (`till_id` is the removed entity and ignored).
 */
export interface OpenShiftRequest {
  /** @nullable */
  edit_reason?: string | null;
  /** @nullable */
  id?: string | null;
  /** @nullable */
  opened_at?: string | null;
  opening_cash: number;
  /** @nullable */
  opening_cash_edited?: boolean | null;
  /** @nullable */
  till_id?: string | null;
}
