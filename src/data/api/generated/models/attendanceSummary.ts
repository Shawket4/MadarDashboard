/* eslint-disable */
// @ts-nocheck

/**
 * One employee's totals over a reporting window.
 */
export interface AttendanceSummary {
  absent_days: number;
  half_days: number;
  late_days: number;
  leave_days: number;
  present_days: number;
  total_late_minutes: number;
  total_overtime_minutes: number;
  total_worked_minutes: number;
  user_id: string;
  user_name: string;
}
