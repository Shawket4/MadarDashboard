/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface ShiftSummary {
  branch_id: string;
  branch_name: string;
  card_revenue: number;
  /** @nullable */
  cash_discrepancy?: number | null;
  cash_revenue: number;
  /** @nullable */
  closed_at?: string | null;
  /** @nullable */
  closing_cash_declared?: number | null;
  /** @nullable */
  closing_cash_system?: number | null;
  digital_wallet_revenue: number;
  mixed_revenue: number;
  opened_at: string;
  opening_cash: number;
  shift_id: string;
  status: string;
  talabat_cash_revenue: number;
  talabat_online_revenue: number;
  teller_id: string;
  teller_name: string;
  total_discount: number;
  total_orders: number;
  total_revenue: number;
  total_tax: number;
  voided_orders: number;
}
