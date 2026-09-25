/* eslint-disable */
// @ts-nocheck

/**
 * The whole run's figures, added up by the server (AT-3).
 */
export interface PayrollTotals {
  advances_piastres: number;
  base_piastres: number;
  bonuses_piastres: number;
  carry_out_piastres: number;
  deductions_piastres: number;
  /** People on payroll with no salary set (D9); approval waits for them. */
  missing_salary_count?: number;
  net_piastres: number;
  overtime_piastres: number;
  people: number;
}
