/* eslint-disable */
// @ts-nocheck

export interface SalaryAdvanceRow {
  amount_piastres: number;
  given_on: string;
  id: string;
  installments: number;
  remaining_piastres: number;
  /** `pending` · `approved` · `rejected` · … */
  status: string;
  user_id: string;
  user_name: string;
}
