/* eslint-disable */
// @ts-nocheck

export interface ExpenseAdvanceRow {
  amount_piastres: number;
  employee_id: string;
  employee_name: string;
  given_on: string;
  id: string;
  purpose: string;
  /** `safe` · `bank` · `till` */
  via: string;
}
