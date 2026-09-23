/* eslint-disable */
// @ts-nocheck
import type { DayTime } from './dayTime';

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
  /** Its own times on some weekdays; other valid days use the default. */
  day_times?: DayTime[];
  end_time: string;
  grace_minutes: number;
  /** @nullable */
  half_day_threshold_minutes?: number | null;
  id: string;
  is_active: boolean;
  name: string;
  org_id: string;
  /**
     * This block's own day-overtime rate; `None` = the branch's rules (RU-8).
     * @nullable
     */
  ot_day_multiplier?: number | null;
  /**
     * This block's own night-overtime rate; `None` = the branch's rules.
     * @nullable
     */
  ot_night_multiplier?: number | null;
  /**
     * Some version of it (default or a weekday's) is longer than the labour
     * presence cap. A warning, never a block (RU-13).
     */
  over_presence_cap?: boolean;
  overtime_multiplier: number;
  overtime_threshold_minutes: number;
  paid_break: boolean;
  start_time: string;
  updated_at: string;
  /** The weekdays the block may be rostered on (0 = Sunday … 6 = Saturday). */
  valid_days: number[];
}
