/* eslint-disable */
// @ts-nocheck

export interface NewExpenseAdvance {
  amount_piastres: number;
  /**
     * Where it was handed over; defaults to the person's first branch. Must
     * be a branch the caller may log at.
     * @nullable
     */
  branch_id?: string | null;
  employee_id: string;
  /**
     * When the cash changed hands; defaults to today (AV-7).
     * @nullable
     */
  given_on?: string | null;
  purpose: string;
  /**
     * `safe` · `bank`. A till pay-out is tagged on the POS (AV-8), never
     * logged here by hand (AV-10).
     */
  via: string;
}
