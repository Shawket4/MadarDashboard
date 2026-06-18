/* eslint-disable */
// @ts-nocheck
import type { DeliveryChannelSales } from './deliveryChannelSales';

/**
 * Delivery sales rolled up across channels, plus a per-channel breakdown.
 * Always returns both `in_mall` and `outside` channels (zero-filled) so the
 * dashboard renders a stable shape.
 */
export interface DeliverySalesReport {
  avg_order_value: number;
  cancelled_orders: number;
  channels: DeliveryChannelSales[];
  /** @nullable */
  from?: string | null;
  /** @nullable */
  to?: string | null;
  total_delivery_fees: number;
  total_orders: number;
  total_revenue: number;
}
