/* eslint-disable */
// @ts-nocheck
import type { ComputedPayslip } from './computedPayslip';
import type { PayrollPeriod } from './payrollPeriod';
import type { Payslip } from './payslip';

export interface CurrentPayroll {
  /** Earlier periods, newest first. */
  history: PayrollPeriod[];
  /** The frozen payslips once it has been generated. */
  payslips: Payslip[];
  period: PayrollPeriod;
  /** A live computation while the period is still a draft. */
  preview: ComputedPayslip[];
}
