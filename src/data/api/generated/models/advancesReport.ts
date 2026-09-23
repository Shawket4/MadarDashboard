/* eslint-disable */
// @ts-nocheck
import type { ExpenseAdvanceRow } from './expenseAdvanceRow';
import type { SalaryAdvanceRow } from './salaryAdvanceRow';

export interface AdvancesReport {
  /** Cash for shop purchases: a log, never deducted (AV-7). */
  expense: ExpenseAdvanceRow[];
  expense_given_piastres: number;
  /** Against salary, repaid by installments. */
  salary: SalaryAdvanceRow[];
  salary_given_piastres: number;
  salary_outstanding_piastres: number;
}
