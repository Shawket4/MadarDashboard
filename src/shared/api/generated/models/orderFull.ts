/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { Order } from './order';
import type { OrderItemFull } from './orderItemFull';

export type OrderFull = Order & {
  items: OrderItemFull[];
};
