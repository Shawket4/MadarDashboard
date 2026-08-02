/* eslint-disable */
// @ts-nocheck

export interface ShiftSummary {
  branch_id: string;
  branch_name: string;
  /** @nullable */
  cash_discrepancy?: number | null;
  /** The cash slice of `total_tips`. */
  cash_tips?: number;
  /** @nullable */
  closed_at?: string | null;
  /** @nullable */
  closing_cash_declared?: number | null;
  /** @nullable */
  closing_cash_system?: number | null;
  opened_at: string;
  opening_cash: number;
  /** Goods only, by method actually tendered. Tips are in `total_tips`. */
  revenue_by_method: unknown;
  shift_id: string;
  status: string;
  teller_id: string;
  teller_name: string;
  total_discount: number;
  total_orders: number;
  total_revenue: number;
  total_tax: number;
  /** Tips, standalone — matches `total_tips` on `GET /shifts/{id}/report`. */
  total_tips?: number;
  voided_orders: number;
}
