/* eslint-disable */
// @ts-nocheck
import type { CategorySales } from './categorySales';
import type { ItemSales } from './itemSales';

export interface BranchSalesReport {
  branch_id: string;
  branch_name: string;
  by_category: CategorySales[];
  /** The cash slice of `total_tips` (snapshotted `tip_is_cash`). */
  cash_tips?: number;
  /** @nullable */
  from?: string | null;
  /**
     * Money collected FOR GOODS, bucketed by the method actually tendered
     * (`order_payments`). Tips are not in here — see `total_tips`.
     */
  revenue_by_method: unknown;
  subtotal: number;
  /** @nullable */
  to?: string | null;
  top_items: ItemSales[];
  total_discount: number;
  /**
     * Units sold (SUM of order_items.quantity) across non-voided orders in
     * range. Counts units, not distinct lines ("3× burger" contributes 3),
     * matching quantity_sold in the item/category breakdowns.
     */
  total_line_items?: number;
  total_orders: number;
  total_revenue: number;
  total_tax: number;
  /**
     * Tips, standalone — never folded into a method bucket and never part of
     * `total_revenue`. Same definition as `total_tips` on the shift report, so
     * the two screens can be reconciled line for line.
     */
  total_tips?: number;
  voided_orders: number;
}
