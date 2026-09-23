/* eslint-disable */
// @ts-nocheck
import type { LateTier } from './lateTier';

export interface PutAttendanceSettingsRequest {
  /** @nullable */
  absence_deduction_days?: number | null;
  /** @nullable */
  advance_cap_percent?: number | null;
  /** @nullable */
  auto_checkout_buffer_minutes?: number | null;
  /**
     * `None` = the org-wide default row.
     * @nullable
     */
  branch_id?: string | null;
  /** @nullable */
  default_overtime_multiplier?: number | null;
  /** @nullable */
  excused_time_paid_default?: boolean | null;
  /**
     * `off` · `soft` · `hard`; owner only (`hr.roster.settings`).
     * @nullable
     */
  gender_mode?: string | null;
  /**
     * `half_shift` · `whole_day`.
     * @nullable
     */
  half_day_leave_counts?: string | null;
  /** @nullable */
  holiday_multiplier?: number | null;
  /** @nullable */
  late_deduction_tiers?: LateTier[] | null;
  /** @nullable */
  limit_day_hours?: number | null;
  /** @nullable */
  limit_overtime_day_hours?: number | null;
  /** @nullable */
  limit_presence_hours?: number | null;
  /** @nullable */
  limit_rest_hours?: number | null;
  /** @nullable */
  limit_week_hours?: number | null;
  /** @nullable */
  night_end?: string | null;
  /** @nullable */
  night_start?: string | null;
  /** @nullable */
  orders_per_staff?: number | null;
  /** @nullable */
  overtime_day_multiplier?: number | null;
  /**
     * `off` · `automatic` · `approval`.
     * @nullable
     */
  overtime_mode?: string | null;
  /** @nullable */
  overtime_night_multiplier?: number | null;
  /** @nullable */
  period_start_day?: number | null;
  /** @nullable */
  require_geofence?: boolean | null;
  /** @nullable */
  working_days_per_month?: number | null;
}
