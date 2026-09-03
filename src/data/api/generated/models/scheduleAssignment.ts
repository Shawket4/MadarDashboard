/* eslint-disable */
// @ts-nocheck

export interface ScheduleAssignment {
  created_at: string;
  /**
     * Postgres `EXTRACT(DOW)` convention: 0 = Sunday … 6 = Saturday.
     * `None` = every day of the week.
     * @nullable
     */
  day_of_week?: number | null;
  effective_from: string;
  /** @nullable */
  effective_to?: string | null;
  id: string;
  org_id: string;
  user_id: string;
  work_shift_id: string;
  /** @nullable */
  work_shift_name?: string | null;
}
