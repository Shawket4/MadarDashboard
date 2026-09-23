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
  /**
     * After the calendar-day proration — what the days employed earn, at
     * each day's salary (PAY-13).
     */
  base_piastres: number;
  /** The monthly salary in force at the end of the window. */
  base_salary_piastres: number;
  bonuses_piastres: number;
  /**
     * Line-by-line, so a preview can name each deduction rather than showing a
     * lump sum nobody can argue with.
     */
  breakdown: unknown;
  /**
     * Deductions beyond what was earned: the payslip stops at zero and this
     * carries into the next one as a debt (PAY-12).
     */
  carry_out_piastres: number;
  deductions_piastres: number;
  employee_id: string;
  late_minutes: number;
  leave_days: number;
  name: string;
  net_piastres: number;
  overtime_minutes: number;
  overtime_piastres: number;
  worked_days: number;
}
