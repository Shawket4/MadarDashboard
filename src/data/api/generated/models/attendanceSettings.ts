/* eslint-disable */
// @ts-nocheck

export interface AttendanceSettings {
  absence_deduction_days: number;
  auto_checkout_buffer_minutes: number;
  /** @nullable */
  branch_id?: string | null;
  created_at: string;
  default_overtime_multiplier: number;
  /**
     * Whether an approved mid-shift permission or early departure is PAID by
     * default. The approver may override it on any individual request.
     */
  excused_time_paid_default: boolean;
  id: string;
  late_deduction_tiers: unknown;
  org_id: string;
  require_geofence: boolean;
  updated_at: string;
  weekend_days: number[];
  working_days_per_month: number;
}
