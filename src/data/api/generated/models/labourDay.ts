/* eslint-disable */
// @ts-nocheck

export interface LabourDay {
  branch_id: string;
  date: string;
  /**
     * From the clock: worked minutes at each person's minute rate, plus the
     * overtime premium. The payslip stays the final word.
     */
  labour_piastres: number;
  /**
     * Labour as a share of sales, basis points (null with no sales).
     * @nullable
     */
  labour_share_bp?: number | null;
  /** Completed sales, net of refunds. */
  sales_piastres: number;
}
