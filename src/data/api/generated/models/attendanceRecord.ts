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
  /**
     * `pending` · `confirmed` · `rejected` for a cover.
     * @nullable
     */
  cover_status?: string | null;
  /**
     * A cover: whose shift this person worked (CV-*).
     * @nullable
     */
  covered_employee_id?: string | null;
  created_at: string;
  /** @nullable */
  created_by?: string | null;
  early_leave_minutes: number;
  /** @nullable */
  edit_reason?: string | null;
  /** @nullable */
  edited_by?: string | null;
  employee_id: string;
  /** @nullable */
  employee_name?: string | null;
  id: string;
  is_manual: boolean;
  late_minutes: number;
  /** @nullable */
  notes?: string | null;
  org_id: string;
  overtime_minutes: number;
  /**
     * `pending` · `approved` · `rejected` when overtime needs a decision.
     * @nullable
     */
  overtime_status?: string | null;
  /**
     * Why someone else punched for this person.
     * @nullable
     */
  punch_reason?: string | null;
  /** @nullable */
  scheduled_end_at?: string | null;
  /** @nullable */
  scheduled_start_at?: string | null;
  status: string;
  tracking_off: boolean;
  updated_at: string;
  /** @nullable */
  work_shift_id?: string | null;
  /** @nullable */
  work_shift_name?: string | null;
  worked_minutes: number;
}
