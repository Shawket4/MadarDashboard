/* eslint-disable */
// @ts-nocheck

export interface CashMovementSummaryRow {
  amount: number;
  /** @nullable */
  corrects_id?: string | null;
  /**
     * The kind of the movement `corrects_id` points at, so a printed report
     * can say "correction of pay-out" and the totals can net the pair inside
     * the bucket the mistake was made in.
     * @nullable
     */
  corrects_kind?: string | null;
  created_at: string;
  id: string;
  kind: string;
  moved_by_name: string;
  note: string;
}
