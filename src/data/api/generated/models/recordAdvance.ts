/* eslint-disable */
// @ts-nocheck

export interface RecordAdvance {
  amount_piastres: number;
  employee_id: string;
  /**
     * 1 = in full from the next payslip (AV-3).
     * @nullable
     */
  installments?: number | null;
  /** @nullable */
  reason?: string | null;
}
