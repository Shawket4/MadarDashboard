/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { CategorySales } from './categorySales';
import type { ItemSales } from './itemSales';

export interface BranchSalesReport {
  branch_id: string;
  branch_name: string;
  by_category: CategorySales[];
  card_revenue: number;
  cash_revenue: number;
  digital_wallet_revenue: number;
  /** @nullable */
  from?: string | null;
  mixed_revenue: number;
  subtotal: number;
  talabat_cash_revenue: number;
  talabat_online_revenue: number;
  /** @nullable */
  to?: string | null;
  top_items: ItemSales[];
  total_discount: number;
  total_orders: number;
  total_revenue: number;
  total_tax: number;
  voided_orders: number;
}
