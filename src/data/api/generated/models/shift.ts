/* eslint-disable */
// @ts-nocheck

export interface Shift {
  branch_id: string;
  /**
     * Branch label — only populated by the shifts list (so the "All branches"
   * view can show which branch each shift belongs to). Other shift endpoints
   * leave it `null`.
     * @nullable
     */
  branch_name?: string | null;
  /** @nullable */
  cash_discrepancy?: number | null;
  /** @nullable */
  closed_at?: string | null;
  /** @nullable */
  closed_by?: string | null;
  /** @nullable */
  closing_cash_declared?: number | null;
  /** @nullable */
  closing_cash_system?: number | null;
  /** @nullable */
  force_close_reason?: string | null;
  /** @nullable */
  force_closed_at?: string | null;
  /** @nullable */
  force_closed_by?: string | null;
  id: string;
  /** @nullable */
  notes?: string | null;
  opened_at: string;
  opening_cash: number;
  /** @nullable */
  opening_cash_edit_reason?: string | null;
  /** @nullable */
  opening_cash_original?: number | null;
  opening_cash_was_edited: boolean;
  status: string;
  teller_id: string;
  teller_name: string;
  /**
     * The till (drawer) this shift is on. Populated by the read/list/open
   * endpoints; mutation responses that build the row via RETURNING may leave
   * `till_name` null (same convention as `branch_name`).
     * @nullable
     */
  till_id?: string | null;
  /** @nullable */
  till_name?: string | null;
}
