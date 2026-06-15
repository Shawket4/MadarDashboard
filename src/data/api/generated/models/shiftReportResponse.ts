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
  /** Authoritative system (expected) cash in the drawer. For a closed shift
   * this is the snapshot taken at close (`closing_cash_system`); for an open
   * shift it is computed live via the same formula. Clients should display
   * this directly instead of re-deriving it from the payment breakdown. */
  expected_cash: number;
  net_payments: number;
  payment_summary: PaymentSummaryRow[];
  printed_at: string;
  shift: Shift;
  total_payments: number;
  voided_amount: number;
}
