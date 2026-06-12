/* eslint-disable */
// @ts-nocheck
import type { OrderBundleComponentFull } from './orderBundleComponentFull';
import type { OrderItem } from './orderItem';
import type { OrderItemAddon } from './orderItemAddon';
import type { OrderItemOptional } from './orderItemOptional';

export type OrderItemFull = OrderItem & {
  addons: OrderItemAddon[];
  bundle_components?: OrderBundleComponentFull[];
  optionals: OrderItemOptional[];
};
