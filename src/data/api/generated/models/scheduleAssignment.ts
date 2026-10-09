/* eslint-disable */
// @ts-nocheck

export interface ScheduleAssignment {
  /**
     * Where a business-wide block is worked (hunt H2-B8b); null = the
     * block's own branch, else the person's first.
     * @nullable
     */
  branch_id?: string | null;
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
  employee_id: string;
  id: string;
  org_id: string;
  work_shift_id: string;
  /** @nullable */
  work_shift_name?: string | null;
}
