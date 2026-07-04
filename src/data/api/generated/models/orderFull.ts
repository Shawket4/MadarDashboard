/* eslint-disable */
// @ts-nocheck
import type { Order } from './order';
import type { OrderDeliveryInfo } from './orderDeliveryInfo';
import type { OrderItemFull } from './orderItemFull';

export type OrderFull = Order & ({
  delivery?: null | OrderDeliveryInfo;
  items: OrderItemFull[];
  /**
     * Non-fatal warnings raised while placing the order — currently used to
     * flag ingredients that were oversold (stock driven below zero). Empty
     * for reads/refunds.
     */
  warnings?: string[];
});
