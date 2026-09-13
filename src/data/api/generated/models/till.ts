/* eslint-disable */
// @ts-nocheck
import type { TillStatus } from './tillStatus';
import type { TillVerification } from './tillVerification';

export interface Till {
  branch_id: string;
  /**
     * Branch label (populated by reads; may be null on some write responses).
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
  device_code?: string | null;
  /** @nullable */
  device_id?: string | null;
  /** @nullable */
  device_label?: string | null;
  disagreement_count: number;
  /** @nullable */
  flagged_at?: string | null;
  /** @nullable */
  force_close_reason?: string | null;
  /** @nullable */
  force_closed_at?: string | null;
  /** @nullable */
  force_closed_by?: string | null;
  id: string;
  /** @nullable */
  notes?: string | null;
  /** @nullable */
  old_bills_at_close?: number | null;
  /** @nullable */
  open_bills_at_close?: number | null;
  opened_at: string;
  opened_while_another_open: boolean;
  opening_cash: number;
  /** @nullable */
  opening_cash_edit_reason?: string | null;
  /** @nullable */
  opening_cash_original?: number | null;
  opening_cash_was_edited: boolean;
  /** @nullable */
  other_till_id?: string | null;
  /**
     * `clean` | `disagreed` | `unreviewed` | null (open, or closed before reconciliation existed)
     * @nullable
     */
  reconciliation_status?: string | null;
  /** `open` | `closed` | `force_closed` */
  status: TillStatus;
  teller_id: string;
  teller_name: string;
  /** @nullable */
  timezone?: string | null;
  /** `server` | `lan` | `unverified` | `legacy` */
  verification: TillVerification;
}
