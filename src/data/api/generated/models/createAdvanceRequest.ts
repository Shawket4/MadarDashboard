/* eslint-disable */
// @ts-nocheck

export interface CreateAdvanceRequest {
  amount_piastres: number;
  /**
     * Defaults to 1 — repaid in full from the next payslip.
     * @nullable
     */
  installments?: number | null;
  /** @nullable */
  reason?: string | null;
  /**
     * Admin-only; omitted on `/staff/me/*`.
     * @nullable
     */
  user_id?: string | null;
}
