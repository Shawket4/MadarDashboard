/* eslint-disable */
// @ts-nocheck
import type { OrderItem } from './orderItem';
import type { OrderItemAddon } from './orderItemAddon';
import type { OrderItemOptional } from './orderItemOptional';

export type OrderItemFull = OrderItem & ({
  addons: OrderItemAddon[];
  optionals: OrderItemOptional[];
  /**
     * Why a covered line was free: `reward` (paid for with points or stamps)
     * or `gift` (the member's birthday gift), so a reprint and history can
     * say which. Absent on a line nothing covered. Additive.
     * @nullable
     */
  reward_source?: string | null;
});
