/* eslint-disable */
// @ts-nocheck

export interface PutOverrideRequest {
  employee_id: string;
  on_date: string;
  /** @nullable */
  reason?: string | null;
  /**
     * Omit (or send null) to mark the date an explicit day off.
     * @nullable
     */
  work_shift_id?: string | null;
}
