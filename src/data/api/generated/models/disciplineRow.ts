/* eslint-disable */
// @ts-nocheck

export interface DisciplineRow {
  absent_days: number;
  /**
     * `None` for a person with no department set — grouped as "Unassigned".
     * @nullable
     */
  department_id?: string | null;
  /** @nullable */
  department_name?: string | null;
  late_days: number;
  present_days: number;
  /**
     * 1 = best in this department: fewest absences, then fewest lates, then
     * least total late time. Ties share a rank (SQL `RANK()`), so a
     * department where everyone has a clean record is all `1`s.
     */
  rank_in_department: number;
  total_late_minutes: number;
  user_id: string;
  user_name: string;
}
