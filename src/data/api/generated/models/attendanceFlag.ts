/* eslint-disable */
// @ts-nocheck

export interface AttendanceFlag {
  /** @nullable */
  attendance_record_id?: string | null;
  /** @nullable */
  branch_id?: string | null;
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
