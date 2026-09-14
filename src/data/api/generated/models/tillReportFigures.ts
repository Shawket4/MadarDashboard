/* eslint-disable */
// @ts-nocheck
import type { CashMovementSummaryRow } from './cashMovementSummaryRow';
import type { PaymentSummaryRow } from './paymentSummaryRow';

/**
 * The report figures shared by the new `TillReportResponse` and the legacy
 * `ShiftReportResponse` (flattened into both).
 */
export interface TillReportFigures {
  cash_adjustments: number;
  cash_in_refunded_sales?: number;
  cash_movements: CashMovementSummaryRow[];
  cash_movements_in: number;
  cash_movements_net: number;
  cash_movements_out: number;
  cash_tips: number;
  expected_cash: number;
  net_payments: number;
  non_cash_tips: number;
  payment_summary: PaymentSummaryRow[];
  printed_at: string;
  refunds_issued_amount?: number;
  refunds_issued_cash?: number;
  refunds_issued_count?: number;
  safe_drops: number;
  /**
     * `branches.standard_float`.
     * @nullable
     */
  standard_float?: number | null;
  /** @nullable */
  suggested_safe_drop?: number | null;
  /** @nullable */
  timezone?: string | null;
  total_payments: number;
  total_tips: number;
  voided_amount: number;
}
