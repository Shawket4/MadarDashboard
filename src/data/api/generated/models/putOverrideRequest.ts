/* eslint-disable */
// @ts-nocheck

export interface PutOverrideRequest {
  on_date: string;
  /** @nullable */
  reason?: string | null;
  user_id: string;
  /**
     * Omit (or send null) to mark the date an explicit day off.
     * @nullable
     */
  work_shift_id?: string | null;
}
