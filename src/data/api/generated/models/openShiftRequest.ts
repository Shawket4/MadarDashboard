/* eslint-disable */
// @ts-nocheck

export interface OpenShiftRequest {
  /** @nullable */
  edit_reason?: string | null;
  /** @nullable */
  id?: string | null;
  /** @nullable */
  opened_at?: string | null;
  opening_cash: number;
  /**
     * Ignored by the server — the carryover edit is DERIVED from the previous
   * shift's declared closing. Kept only for API/back-compat with clients.
     * @nullable
     */
  opening_cash_edited?: boolean | null;
  /**
     * The till (drawer) this shift opens on. Optional for back-compat: when
   * omitted the server falls back to the branch's default till. Newer
   * device-bound clients send their configured till explicitly.
     * @nullable
     */
  till_id?: string | null;
}
