/* eslint-disable */
// @ts-nocheck
import type { CategorySales } from './categorySales';
import type { ItemSales } from './itemSales';

export interface BranchSalesReport {
  branch_id: string;
  branch_name: string;
  by_category: CategorySales[];
  /** @nullable */
  from?: string | null;
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
  voided_orders: number;
}
