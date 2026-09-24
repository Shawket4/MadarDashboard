/* eslint-disable */
// @ts-nocheck
import type { DayTime } from './dayTime';

export interface UpsertWorkShiftRequest {
  /**
     * The block's branch; null = the whole business. On an update, omitted
     * keeps the block's branch (E2E B-ROTA-8); on a create, omitted = the
     * whole business.
     * @nullable
     */
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
  /**
     * The block's own day-overtime rate (RU-8). Omit to keep it, null to go
     * back to the branch's rules.
     * @nullable
     */
  ot_day_multiplier?: number | null;
  /**
     * The block's own night-overtime rate. Omit to keep, null to clear.
     * @nullable
     */
  ot_night_multiplier?: number | null;
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
