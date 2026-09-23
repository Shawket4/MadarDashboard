/* eslint-disable */
// @ts-nocheck

export interface ExpenseAdvanceRow {
  amount_piastres: number;
  given_on: string;
  id: string;
  purpose: string;
  user_id: string;
  user_name: string;
  /** `safe` · `bank` · `till` */
  via: string;
}
