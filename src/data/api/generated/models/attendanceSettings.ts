/* eslint-disable */
// @ts-nocheck
import type { LateTier } from './lateTier';

export interface AttendanceSettings {
  absence_deduction_days: number;
  /** Salary advances owed may reach this share of monthly salary (AV-5). */
  advance_cap_percent: number;
  auto_checkout_buffer_minutes: number;
  /** @nullable */
  branch_id?: string | null;
  /**
     * How a confirmed cover is paid (owner decision D5): `minute_rate` (the
     * coverer's day rate ÷ 8 h × the minutes covered, CV-4; the default) or
     * `full_block` (the covered block as a full day). A branch may override
     * it (listed in `overridden`).
     */
  cover_pay_mode: string;
  created_at: string;
  default_overtime_multiplier: number;
  /**
     * Whether an approved mid-shift permission or early departure is PAID by
     * default. The approver may override it on any individual request.
     */
  excused_time_paid_default: boolean;
  /** `off` · `soft` · `hard`: how the gender default weighs in suggestions (SC-12). */
  gender_mode: string;
  /** `half_shift` · `whole_day`: what a half-day leave counts as (RQ-8). */
  half_day_leave_counts: string;
  /** What working a set-up holiday pays (RU-10). */
  holiday_multiplier: number;
  id: string;
  late_deduction_tiers: unknown;
  /**
     * Labour limits, hours (RU-13). They warn, never block, and stay
     * unconfirmed until a lawyer signs them off.
     */
  limit_day_hours: number;
  limit_overtime_day_hours: number;
  limit_presence_hours: number;
  limit_rest_hours: number;
  limit_week_hours: number;
  night_end: string;
  /** Night for the night overtime rate and for suggestions (RU-8, RU-9). */
  night_start: string;
  /** POS-derived coverage: one person per this many orders an hour. */
  orders_per_staff: number;
  org_id: string;
  /**
     * For a branch: the rules it sets itself (every other field is the
     * business's, RU-2). Empty for the business.
     */
  overridden?: string[];
  overtime_day_multiplier: number;
  /** `off` · `automatic` · `approval` (RU-7). */
  overtime_mode: string;
  overtime_night_multiplier: number;
  /** Day of the month a pay period opens (PAY-1): 26 = a 26th–25th cycle. */
  period_start_day: number;
  require_geofence: boolean;
  /**
     * When the business saved its rules; nobody clocks in before (RU-1).
     * @nullable
     */
  rules_saved_at?: string | null;
  /** The ladder the set-up step suggests (RU-1). Never used for pricing. */
  suggested_tiers?: LateTier[];
  updated_at: string;
  working_days_per_month: number;
}
