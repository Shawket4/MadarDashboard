/* eslint-disable */
// @ts-nocheck

export interface AttendanceRecord {
  branch_id: string;
  business_date: string;
  /** @nullable */
  check_in_at?: string | null;
  /** @nullable */
  check_in_distance_meters?: number | null;
  /** @nullable */
  check_in_latitude?: number | null;
  /** @nullable */
  check_in_longitude?: number | null;
  /** @nullable */
  check_in_method?: string | null;
  /** @nullable */
  check_out_at?: string | null;
  /** @nullable */
  check_out_distance_meters?: number | null;
  /** @nullable */
  check_out_latitude?: number | null;
  /** @nullable */
  check_out_longitude?: number | null;
  /** @nullable */
  check_out_method?: string | null;
  created_at: string;
  /** @nullable */
  created_by?: string | null;
  early_leave_minutes: number;
  /** @nullable */
  edit_reason?: string | null;
  /** @nullable */
  edited_by?: string | null;
  id: string;
  is_manual: boolean;
  late_minutes: number;
  /** @nullable */
  notes?: string | null;
  org_id: string;
  overtime_minutes: number;
  /** @nullable */
  scheduled_end_at?: string | null;
  /** @nullable */
  scheduled_start_at?: string | null;
  status: string;
  updated_at: string;
  user_id: string;
  /** @nullable */
  user_name?: string | null;
  /** @nullable */
  work_shift_id?: string | null;
  /** @nullable */
  work_shift_name?: string | null;
  worked_minutes: number;
}
