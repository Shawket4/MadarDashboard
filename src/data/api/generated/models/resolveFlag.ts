/* eslint-disable */
// @ts-nocheck

export interface ResolveFlag {
  /**
     * `ignore` · `excuse_paid` · `excuse_unpaid` · `deduct` · `revoke` (a new
     * phone) · `confirm`. A cover's flag takes only `confirm` or `reject`,
     * which decide the cover itself (400 `FLAG_COVER_CONFIRM_OR_REJECT`).
     */
  action: string;
  /**
     * For `deduct`: the amount the manager typed (CL-7).
     * @nullable
     */
  amount_piastres?: number | null;
  /**
     * For `deduct`: why, on the pay line the employee sees (AD-9).
     * @nullable
     */
  reason?: string | null;
}
