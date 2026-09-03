/* eslint-disable */
// @ts-nocheck
import type { LateTier } from './lateTier';

export interface PutAttendanceSettingsRequest {
  /** @nullable */
  absence_deduction_days?: number | null;
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
  /** @nullable */
  late_deduction_tiers?: LateTier[] | null;
  /** @nullable */
  require_geofence?: boolean | null;
  /** @nullable */
  weekend_days?: number[] | null;
  /** @nullable */
  working_days_per_month?: number | null;
}
