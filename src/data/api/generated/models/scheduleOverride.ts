/* eslint-disable */
// @ts-nocheck

export interface ScheduleOverride {
  created_at: string;
  /** @nullable */
  created_by?: string | null;
  id: string;
  on_date: string;
  org_id: string;
  /** @nullable */
  reason?: string | null;
  user_id: string;
  /**
     * `None` = an explicit day off.
     * @nullable
     */
  work_shift_id?: string | null;
  /** @nullable */
  work_shift_name?: string | null;
}
