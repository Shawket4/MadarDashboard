/* eslint-disable */
// @ts-nocheck

export interface NewExpenseAdvance {
  amount_piastres: number;
  purpose: string;
  user_id: string;
  /** `safe` · `bank` · `till` */
  via: string;
}
