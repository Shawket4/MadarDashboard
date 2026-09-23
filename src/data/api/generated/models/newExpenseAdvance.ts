/* eslint-disable */
// @ts-nocheck

export interface NewExpenseAdvance {
  amount_piastres: number;
  employee_id: string;
  purpose: string;
  /** `safe` · `bank` · `till` */
  via: string;
}
