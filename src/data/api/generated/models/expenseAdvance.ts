/* eslint-disable */
// @ts-nocheck

export interface ExpenseAdvance {
  amount_piastres: number;
  /** @nullable */
  branch_id?: string | null;
  created_at: string;
  given_on: string;
  /** @nullable */
  handed_by?: string | null;
  /** @nullable */
  handed_by_name?: string | null;
  id: string;
  purpose: string;
  user_id: string;
  user_name: string;
  /** `safe` · `bank` · `till` */
  via: string;
}
