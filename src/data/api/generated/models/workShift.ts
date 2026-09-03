/* eslint-disable */
// @ts-nocheck

export interface WorkShift {
  /**
     * `None` = an org-wide template usable at any branch.
     * @nullable
     */
  branch_id?: string | null;
  break_minutes: number;
  checkin_window_minutes: number;
  created_at: string;
  /** Derived by the database from `end_time <= start_time`. */
  crosses_midnight: boolean;
  end_time: string;
  grace_minutes: number;
  /** @nullable */
  half_day_threshold_minutes?: number | null;
  id: string;
  is_active: boolean;
  name: string;
  org_id: string;
  overtime_multiplier: number;
  overtime_threshold_minutes: number;
  paid_break: boolean;
  start_time: string;
  updated_at: string;
}
