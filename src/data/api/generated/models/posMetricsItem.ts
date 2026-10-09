/* eslint-disable */
// @ts-nocheck

export interface PosMetricsItem {
  /**
     * The menu item; null for a line with none.
     * @nullable
     */
  item_id?: string | null;
  item_name: string;
  quantity: number;
  /** Σ line totals (before refunds), as `branch_sales.top_items.revenue`. */
  revenue: number;
}
