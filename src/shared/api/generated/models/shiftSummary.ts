/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface ShiftSummary {
  branch_id: string;
  branch_name: string;
  /** @nullable */
  cash_discrepancy?: number | null;
  /** @nullable */
  closed_at?: string | null;
  /** @nullable */
  closing_cash_declared?: number | null;
  /** @nullable */
  closing_cash_system?: number | null;
  opened_at: string;
  opening_cash: number;
  revenue_by_method: unknown;
  shift_id: string;
  status: string;
  teller_id: string;
  teller_name: string;
  total_discount: number;
  total_orders: number;
  total_revenue: number;
  total_tax: number;
  voided_orders: number;
}
