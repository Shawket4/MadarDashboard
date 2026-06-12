/* eslint-disable */
// @ts-nocheck

export interface Shift {
  branch_id: string;
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
}
