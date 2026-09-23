/* eslint-disable */
// @ts-nocheck

export interface DisciplineRow {
  absent_days: number;
  /**
     * Their own shifts a colleague covered (not rejected): the absence stays
     * theirs (CV-6), this says someone stepped in.
     */
  covered_by_others?: number;
  /**
     * Colleagues' shifts this person covered, confirmed by a manager (CV-7).
     * A cover is never a present day of the coverer's own.
     */
  covers_given?: number;
  /** Covers still waiting for the manager. */
  covers_pending?: number;
  /**
     * `None` for a person with no department set — grouped as "Unassigned".
     * @nullable
     */
  department_id?: string | null;
  /** @nullable */
  department_name?: string | null;
  employee_id: string;
  employee_name: string;
  late_days: number;
  present_days: number;
  /**
     * 1 = best in this department: fewest absences, then fewest lates, then
     * least total late time. Ties share a rank (SQL `RANK()`), so a
     * department where everyone has a clean record is all `1`s.
     */
  rank_in_department: number;
  total_late_minutes: number;
}
