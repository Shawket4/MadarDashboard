/* eslint-disable */
// @ts-nocheck
import type { DayTime } from './dayTime';

export interface UpsertWorkShiftRequest {
  /** @nullable */
  branch_id?: string | null;
  /** @nullable */
  break_minutes?: number | null;
  /** @nullable */
  checkin_window_minutes?: number | null;
  /**
     * Its own times on some weekdays (each must be a valid day). Omit to keep
     * them; an empty list clears them.
     * @nullable
     */
  day_times?: DayTime[] | null;
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
  /**
     * Weekdays it may be rostered on (0 = Sunday … 6 = Saturday). Omit to
     * keep them (all days for a new block).
     * @nullable
     */
  valid_days?: number[] | null;
}
