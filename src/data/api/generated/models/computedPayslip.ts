/* eslint-disable */
// @ts-nocheck

/**
 * One employee's pay for a period, computed but not yet written.
 *
 * PREVIEW AND GENERATE SHARE THIS. The preview endpoint exists so a manager can
 * see what payroll is about to do — a figure that would be worthless if it came
 * from a second implementation that could drift from the real one. So the
 * generator computes these first and then persists them, and the preview
 * computes exactly the same values and persists nothing.
 */
export interface ComputedPayslip {
  absent_days: number;
  /**
     * What the advances WANT versus what the payslip can afford differ when net
     * pay would go negative; this is the affordable figure, the one collected.
     */
  advance_installment_piastres: number;
  /** After the attendance proration — what the days actually worked earn. */
  base_piastres: number;
  base_salary_piastres: number;
  bonuses_piastres: number;
  /**
     * Line-by-line, so a preview can name each deduction rather than showing a
     * lump sum nobody can argue with.
     */
  breakdown: unknown;
  deductions_piastres: number;
  late_minutes: number;
  leave_days: number;
  name: string;
  net_piastres: number;
  overtime_minutes: number;
  overtime_piastres: number;
  user_id: string;
  worked_days: number;
}
