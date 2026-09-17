/* eslint-disable */
// @ts-nocheck
import type { CashMovementSummaryRow } from './cashMovementSummaryRow';
import type { PaymentSummaryRow } from './paymentSummaryRow';
import type { TillSpotCheck } from './tillSpotCheck';

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
  refunds_issued_service_charge?: number;
  /**
     * The tax and service charge inside the refunds issued FROM this till's
     * drawer (`refunds_issued_amount`'s split).
     */
  refunds_issued_tax?: number;
  safe_drops: number;
  service_charge_waived_amount?: number;
  /**
     * Table bills whose service charge was removed (`orders:waive_service`),
     * and what those charges came to. Not part of any total.
     */
  service_charge_waived_count?: number;
  /** Cash spot checks taken on this till, oldest first. Additive. */
  spot_checks?: TillSpotCheck[];
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
  /** Service charge on this till's sales, less what their refunds took back. */
  total_service_charge?: number;
  /**
     * Tax on this till's sales, less the tax their refunds took back (a
     * partial refund takes back its pro-rata share; a voided or fully
     * refunded sale is out altogether). Additive.
     */
  total_tax?: number;
  total_tips: number;
  voided_amount: number;
}
