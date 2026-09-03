/* eslint-disable */
// @ts-nocheck

export interface UpsertWorkShiftRequest {
  /** @nullable */
  branch_id?: string | null;
  /** @nullable */
  break_minutes?: number | null;
  /** @nullable */
  checkin_window_minutes?: number | null;
  end_time: string;
  /** @nullable */
  grace_minutes?: number | null;
  /** @nullable */
  half_day_threshold_minutes?: number | null;
  /** @nullable */
  is_active?: boolean | null;
  name: string;
  /** @nullable */
  overtime_multiplier?: number | null;
  /** @nullable */
  overtime_threshold_minutes?: number | null;
  /** @nullable */
  paid_break?: boolean | null;
  start_time: string;
}
