/* eslint-disable */
// @ts-nocheck
import type { ComputedPayslip } from './computedPayslip';
import type { PayrollPeriod } from './payrollPeriod';
import type { PayrollTotals } from './payrollTotals';
import type { Payslip } from './payslip';

export interface CurrentPayroll {
  /** Earlier periods, newest first. */
  history: PayrollPeriod[];
  /**
     * People on payroll with no salary set (D9): the preview rows with
     * `salary_missing`; approval is refused until it is 0.
     */
  missing_salary_count: number;
  /** How many payslips are marked paid (a 'none' mark counts). */
  paid_count: number;
  /** The frozen payslips once it has been generated. */
  payslips: Payslip[];
  period: PayrollPeriod;
  /** A live computation while the period is still a draft. */
  preview: ComputedPayslip[];
  /** The run added up by the server (AT-3). */
  totals: PayrollTotals;
}
