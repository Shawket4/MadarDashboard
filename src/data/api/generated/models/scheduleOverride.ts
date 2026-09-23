/* eslint-disable */
// @ts-nocheck

export interface ScheduleOverride {
  created_at: string;
  /** @nullable */
  created_by?: string | null;
  employee_id: string;
  id: string;
  on_date: string;
  org_id: string;
  /** @nullable */
  reason?: string | null;
  /**
     * `None` = an explicit day off.
     * @nullable
     */
  work_shift_id?: string | null;
  /** @nullable */
  work_shift_name?: string | null;
}
