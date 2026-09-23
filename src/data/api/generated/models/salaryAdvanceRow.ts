/* eslint-disable */
// @ts-nocheck

export interface SalaryAdvanceRow {
  amount_piastres: number;
  employee_id: string;
  employee_name: string;
  given_on: string;
  id: string;
  installments: number;
  remaining_piastres: number;
  /** `pending` · `approved` · `rejected` · … */
  status: string;
}
