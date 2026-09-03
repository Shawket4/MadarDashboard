/* eslint-disable */
// @ts-nocheck

/**
 * A work shift resolved onto a concrete calendar date, with its window already
 * converted to UTC instants.
 */
export interface ResolvedShift {
  break_minutes: number;
  checkin_window_minutes: number;
  grace_minutes: number;
  /** @nullable */
  half_day_threshold_minutes?: number | null;
  name: string;
  overtime_multiplier: number;
  overtime_threshold_minutes: number;
  paid_break: boolean;
  scheduled_end_at: string;
  scheduled_start_at: string;
  work_shift_id: string;
}
