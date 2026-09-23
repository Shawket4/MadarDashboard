/* eslint-disable */
// @ts-nocheck

/**
 * A work shift resolved onto a concrete calendar date, with its window already
 * converted to UTC instants.
 */
export interface ResolvedShift {
  /**
     * The branch it is worked at (the block's, else the person's first).
     * @nullable
     */
  branch_id?: string | null;
  break_minutes: number;
  checkin_window_minutes: number;
  /** Ends on the following date. */
  crosses_midnight: boolean;
  /** Whose assignment this is. */
  employee_id: string;
  end_time: string;
  /** The date holds its own set (a date change), not the pattern. */
  from_override: boolean;
  grace_minutes: number;
  /** @nullable */
  half_day_threshold_minutes?: number | null;
  name: string;
  /** The business date: the day the shift starts on (SC-10). */
  on_date: string;
  overtime_multiplier: number;
  overtime_threshold_minutes: number;
  paid_break: boolean;
  scheduled_end_at: string;
  /**
     * The EFFECTIVE window: the assignment's own times, else the block's time
     * for that weekday, else its default.
     */
  scheduled_start_at: string;
  /** Effective wall-clock times in the branch's zone. */
  start_time: string;
  /** This assignment has its own from/to (shown as edited). */
  times_edited: boolean;
  work_shift_id: string;
}
