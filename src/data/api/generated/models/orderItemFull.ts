/* eslint-disable */
// @ts-nocheck
import type { OrderItem } from './orderItem';
import type { OrderItemAddon } from './orderItemAddon';
import type { OrderItemOptional } from './orderItemOptional';

export type OrderItemFull = OrderItem & {
  addons: OrderItemAddon[];
  optionals: OrderItemOptional[];
};
