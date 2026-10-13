/* eslint-disable */
// @ts-nocheck

/**
 * Sales of one service mode (`orders.service_mode`).
 */
export interface ServiceModeSales {
  /** Sold orders (voided and refunded excluded). */
  orders: number;
  /** Net of refunds against these orders, like `total_revenue`. */
  revenue: number;
  /** `takeaway` (Pickup) | `dine_in`. */
  service_mode: string;
}
