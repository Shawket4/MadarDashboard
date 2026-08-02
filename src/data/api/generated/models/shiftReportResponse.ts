/* eslint-disable */
// @ts-nocheck
import type { CashMovementSummaryRow } from './cashMovementSummaryRow';
import type { PaymentSummaryRow } from './paymentSummaryRow';
import type { Shift } from './shift';

export interface ShiftReportResponse {
  cash_movements: CashMovementSummaryRow[];
  cash_movements_in: number;
  /** Net of all cash movements (in - out) as a signed integer */
  cash_movements_net: number;
  cash_movements_out: number;
  /**
     * The cash slice of `total_tips` (snapshotted `tip_is_cash`). This IS in
     * the drawer, so it is counted by `expected_cash` even though it is not
     * part of `net_payments`.
     */
  cash_tips: number;
  /**
     * Authoritative system (expected) cash in the drawer. For a closed shift
     * this is the snapshot taken at close (`closing_cash_system`); for an open
     * shift it is computed live via the same formula. Clients should display
     * this directly instead of re-deriving it from the payment breakdown.
     */
  expected_cash: number;
  net_payments: number;
  /** `total_tips - cash_tips` — tips added onto a card/wallet tender. */
  non_cash_tips: number;
  /**
     * Money COLLECTED FOR GOODS, bucketed by the method actually tendered
     * (`order_payments`, so a split order contributes to each leg it really
     * used). Tips are NOT in here — see `total_tips`.
     */
  payment_summary: PaymentSummaryRow[];
  printed_at: string;
  shift: Shift;
  total_payments: number;
  /**
     * Tips, as a standalone figure — never folded into a method bucket, and
     * never part of `total_payments`/`net_payments`. Mirrors `total_tips` on
     * the sales reports so the two screens agree on what "revenue" means.
     */
  total_tips: number;
  voided_amount: number;
}
