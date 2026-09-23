/* eslint-disable */
// @ts-nocheck

export interface ResolveFlag {
  /**
     * `ignore` · `excuse_paid` · `excuse_unpaid` · `deduct` · `revoke` (a new
     * phone) · `confirm`
     */
  action: string;
  /**
     * For `deduct`: the amount the manager typed (CL-7).
     * @nullable
     */
  amount_piastres?: number | null;
}
