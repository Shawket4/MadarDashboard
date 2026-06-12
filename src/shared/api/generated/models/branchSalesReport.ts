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
  total_orders: number;
  total_revenue: number;
  total_tax: number;
  voided_orders: number;
}
