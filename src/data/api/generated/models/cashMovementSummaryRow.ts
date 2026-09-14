/* eslint-disable */
// @ts-nocheck

export interface CashMovementSummaryRow {
  amount: number;
  /** @nullable */
  corrects_id?: string | null;
  /** @nullable */
  corrects_kind?: string | null;
  created_at: string;
  id: string;
  kind: string;
  moved_by_name: string;
  note: string;
}
