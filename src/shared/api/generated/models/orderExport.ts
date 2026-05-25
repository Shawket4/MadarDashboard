/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { Order } from './order';
import type { OrderItemFull } from './orderItemFull';
import type { OrderPayment } from './orderPayment';

export type OrderExport = Order & {
  items: OrderItemFull[];
  payments: OrderPayment[];
};
