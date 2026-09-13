/* eslint-disable */
// @ts-nocheck
import type { Order } from './order';
import type { OrderDeliveryInfo } from './orderDeliveryInfo';
import type { OrderItemFull } from './orderItemFull';

export type OrderFull = Order & ({
  delivery?: null | OrderDeliveryInfo;
  items: OrderItemFull[];
  /**
     * Set only on the response to a REPLAYED sale whose rewards the points
     * could not pay for: the covered lines stayed covered, no points moved,
     * the order is flagged. The till shows this sentence to the teller.
     * @nullable
     */
  loyalty_redemption_refused?: string | null;
  /**
     * Non-fatal warnings raised while placing the order — currently used to
     * flag ingredients that were oversold (stock driven below zero). Empty
     * for reads/refunds.
     */
  warnings?: string[];
});
