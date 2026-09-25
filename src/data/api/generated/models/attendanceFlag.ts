/* eslint-disable */
// @ts-nocheck

export interface AttendanceFlag {
  /** @nullable */
  attendance_record_id?: string | null;
  /** @nullable */
  branch_id?: string | null;
  /**
     * The deduction the flag was handled with (a deduct or an unpaid
     * excuse), and its status: `approved`, or `pending` = over the
     * manager's limit, it waits for the owner (minor default M33).
     * @nullable
     */
  deduction_id?: string | null;
  /** @nullable */
  deduction_status?: string | null;
  detected_at: string;
  employee_id: string;
  employee_name: string;
  id: string;
  /**
     * `left_mid_shift` · `suspicious` · `tracking_off` · `time_unverified` ·
     * `new_phone` · `cover`
     */
  kind: string;
  minutes_away: number;
  /** @nullable */
  resolution?: string | null;
  /** @nullable */
  resolved_at?: string | null;
  /** Time away × the person's minute rate, rounded to the nearest 5 EGP (CL-7). */
  suggested_deduction_piastres: number;
}
